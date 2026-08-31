import type { Auth, ICart } from '@/types';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

/** Keep in sync with CartsController::MAX_CART_ITEMS. */
export const MAX_CART_ITEMS = 100;

/** How long to coalesce rapid +/- taps on the same line before hitting the server. */
const QUANTITY_SYNC_DELAY = 350;

const STORAGE_KEY = 'cart_session';

export interface CartEvent {
    name?: string | null;
    discount?: number | null;
    is_active?: boolean | null;
}

export interface CartSelection {
    unit?: string | null;
    category?: string | null;
    subCategory?: string | null;
    division?: string | null;
    variant?: string | null;
    variantColor?: string | null;
}

export interface CartItem {
    // Composite id to differentiate option combos when needed
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    // Server-side row id when using authenticated cart
    serverId?: string;
    // Optional selection metadata to support server sync
    meta?: ICart;
    sku: string;
    // Resolved server-side (authenticated carts); undefined on the guest path.
    originalPrice?: number;
    currency?: string;
    event?: CartEvent | null;
    selection?: CartSelection;
}

/** The slim row shape returned by /v1/carts/{id}/items. */
interface SlimCartItem {
    id: string;
    product_id: string;
    category_id: string | null;
    sub_category_id: string | null;
    division_id: string | null;
    variant_id: string | null;
    quantity: number;
    name: string;
    sku: string;
    image?: string | null;
    price: number;
    original_price: number;
    currency: string;
    event: CartEvent | null;
    selection: CartSelection;
}

interface CartSummary {
    lines: number;
    units: number;
    max_items: number;
}

interface CartContextType {
    items: CartItem[];
    totalItems: number;
    totalPrice: number;
    addItem: (item: Omit<CartItem, 'quantity' | 'serverId'>, options?: { quantity?: number; meta?: CartItem['meta'] }) => Promise<void> | void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    isCartOpen: boolean;
    openCart: (status: boolean) => void;
    /** True once the full item list has been fetched (always true for guests). */
    itemsLoaded: boolean;
    /** Fetches the full item list on demand and resolves with it. Safe to call repeatedly. */
    ensureItemsLoaded: () => Promise<CartItem[]>;
    /** Distinct line count, known even before the items themselves are loaded. */
    totalLines: number;
    maxItems: number;
    /** Last rejection message (e.g. the cart-full cap). Cleared on the next successful mutation. */
    cartError: string | null;
    clearCartError: () => void;
}

interface CartProviderProps {
    children: ReactNode;
    auth?: Auth;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

const buildCompositeId = (parts: {
    product_id?: string | null;
    category_id?: string | null;
    sub_category_id?: string | null;
    division_id?: string | null;
    variant_id?: string | null;
}) =>
    [parts.product_id ?? '', parts.category_id ?? '-', parts.sub_category_id ?? '-', parts.division_id ?? '-', parts.variant_id ?? '-'].join('|');

const csrfToken = () => document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

/**
 * Maps a slim server row to a CartItem.
 *
 * `meta` is kept deliberately light — only the ids the mutation endpoints need
 * plus the handful of product fields the storefront reads off it. The full
 * product graph is no longer shipped here; the cart page gets that from its own
 * Inertia props instead.
 */
const toCartItem = (row: SlimCartItem): CartItem => {
    const meta = {
        id: row.id,
        product_id: row.product_id,
        category_id: row.category_id,
        sub_category_id: row.sub_category_id,
        division_id: row.division_id,
        variant_id: row.variant_id,
        quantity: row.quantity,
        price_per_product: row.price,
        product: {
            id: row.product_id,
            product_name: row.name,
            product_sku: row.sku,
            default_price: row.price,
            default_currency: row.currency,
            unit: row.selection?.unit ? { name: row.selection.unit } : undefined,
            event: row.event ?? undefined,
        },
    } as unknown as ICart;

    return {
        id: buildCompositeId(row),
        name: row.name,
        price: Number(row.price ?? 0),
        quantity: Number(row.quantity ?? 0),
        image: row.image ?? undefined,
        serverId: String(row.id),
        meta,
        sku: row.sku ?? '',
        originalPrice: Number(row.original_price ?? row.price ?? 0),
        currency: row.currency,
        event: row.event,
        selection: row.selection,
    };
};

export const CartProvider = ({ children, auth }: CartProviderProps) => {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isCartOpen, setCartOpen] = useState(false);
    const [itemsLoaded, setItemsLoaded] = useState(false);
    const [summary, setSummary] = useState<CartSummary>({ lines: 0, units: 0, max_items: MAX_CART_ITEMS });
    const [cartError, setCartError] = useState<string | null>(null);

    const isAuthenticated = useMemo(() => Boolean(auth?.user?.id), [auth?.user?.id]);
    const userId = auth?.user?.id ? String(auth.user.id) : undefined;

    // Pending debounced quantity writes, keyed by composite id.
    const pendingRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
    // Serialises writes per line so a burst of taps can't land out of order.
    const chainRef = useRef(new Map<string, Promise<unknown>>());
    const loadingItemsRef = useRef<Promise<CartItem[]> | null>(null);
    // Mirrors `items` so async callers can read the current list after an await
    // without waiting for a re-render.
    const itemsRef = useRef<CartItem[]>([]);

    const saveToSession = (data: CartItem[]) => {
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch {
            // no-op
        }
    };

    const loadFromSession = (): CartItem[] => {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            return raw ? (JSON.parse(raw) as CartItem[]) : [];
        } catch {
            return [];
        }
    };

    const fetchSummary = useCallback(async () => {
        if (!userId) return;
        try {
            const res = await fetch(`/v1/carts/${userId}/summary`, {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });
            if (!res.ok) return;
            const data = await res.json();
            if (data?.summary) setSummary(data.summary as CartSummary);
        } catch {
            // Leave the previous summary in place — a stale badge beats a wrong one.
        }
    }, [userId]);

    const fetchItems = useCallback(async (): Promise<CartItem[]> => {
        if (!userId) return itemsRef.current;
        try {
            const res = await fetch(`/v1/carts/${userId}/items`, {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });
            if (!res.ok) return itemsRef.current;
            const data = await res.json();
            const rows = (data?.items ?? []) as SlimCartItem[];
            const mapped = rows.map(toCartItem);
            itemsRef.current = mapped;
            setItems(mapped);
            if (data?.summary) setSummary(data.summary as CartSummary);
            setItemsLoaded(true);
            return mapped;
        } catch {
            // Keep whatever we had; the badge stays driven by the summary.
            return itemsRef.current;
        }
    }, [userId]);

    /**
     * Loads the item list once, on demand.
     *
     * Page boot only fetches the summary, so a 100-item cart costs one tiny
     * aggregate response on every storefront page instead of the full list.
     */
    const ensureItemsLoaded = useCallback(async (): Promise<CartItem[]> => {
        if (!isAuthenticated || itemsLoaded) return itemsRef.current;
        if (!loadingItemsRef.current) {
            loadingItemsRef.current = fetchItems().finally(() => {
                loadingItemsRef.current = null;
            });
        }
        return loadingItemsRef.current;
    }, [isAuthenticated, itemsLoaded, fetchItems]);

    // Initial load: summary only for auth (items are lazy), session for guests.
    useEffect(() => {
        let active = true;

        if (isAuthenticated) {
            setItems([]);
            setItemsLoaded(false);
            void fetchSummary();
        } else {
            const local = loadFromSession();
            if (!active) return;
            setItems(local);
            setItemsLoaded(true);
        }

        return () => {
            active = false;
        };
    }, [isAuthenticated, userId, fetchSummary]);

    useEffect(() => {
        itemsRef.current = items;
    }, [items]);

    // Save to session storage for guests.
    useEffect(() => {
        if (isAuthenticated) return;
        saveToSession(items);
    }, [items, isAuthenticated]);

    // Flush any debounced writes if the provider goes away mid-burst.
    useEffect(() => {
        const pending = pendingRef.current;
        return () => {
            pending.forEach((timer) => clearTimeout(timer));
            pending.clear();
        };
    }, []);

    const derivedUnits = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
    const totalItems = isAuthenticated && !itemsLoaded ? summary.units : derivedUnits;
    const totalLines = isAuthenticated && !itemsLoaded ? summary.lines : items.length;
    // Only meaningful once items are loaded — the boot-time summary carries no prices.
    const totalPrice = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

    /**
     * Posts a quantity change as a plain JSON call and reconciles from the response.
     *
     * No Inertia visit (which would re-render the whole page's props) and no
     * follow-up refetch of the entire cart — the endpoint hands back the updated
     * line plus a fresh summary.
     */
    const postQuantity = useCallback(
        async (id: string, meta: CartItem['meta'], quantity: number) => {
            const body = {
                product_id: meta?.product_id ?? id.split('|')[0],
                category_id: meta?.category_id ?? null,
                sub_category_id: meta?.sub_category_id ?? null,
                division_id: meta?.division_id ?? null,
                variant_id: meta?.variant_id ?? null,
                target_quantity: quantity,
            };

            try {
                const res = await fetch(route('add.cart'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': csrfToken(),
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify(body),
                });

                const data = await res.json().catch(() => null);

                if (!res.ok) {
                    setCartError(data?.message ?? 'Failed to update cart.');
                    // Fall back to server truth rather than leaving an optimistic lie on screen.
                    await fetchItems();
                    return false;
                }

                setCartError(null);
                if (data?.summary) setSummary(data.summary as CartSummary);
                if (data?.item) {
                    const updated = toCartItem(data.item as SlimCartItem);
                    setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
                }
                return true;
            } catch {
                setCartError('Failed to update cart.');
                await fetchItems();
                return false;
            }
        },
        [fetchItems],
    );

    /** Queues a write for one line, coalescing rapid taps and keeping order. */
    const scheduleQuantitySync = useCallback(
        (id: string, meta: CartItem['meta'], quantity: number) => {
            const existing = pendingRef.current.get(id);
            if (existing) clearTimeout(existing);

            const timer = setTimeout(() => {
                pendingRef.current.delete(id);
                const previous = chainRef.current.get(id) ?? Promise.resolve();
                const next = previous.then(() => postQuantity(id, meta, quantity));
                chainRef.current.set(id, next);
                void next.finally(() => {
                    if (chainRef.current.get(id) === next) chainRef.current.delete(id);
                });
            }, QUANTITY_SYNC_DELAY);

            pendingRef.current.set(id, timer);
        },
        [postQuantity],
    );

    const addItem: CartContextType['addItem'] = async (newItem, options) => {
        const qty = Math.max(1, Number(options?.quantity ?? 1));
        const meta = options?.meta ?? newItem.meta;

        // Make sure we know the current lines before deciding on the cap.
        const current = isAuthenticated ? await ensureItemsLoaded() : items;

        const isNewLine = !current.some((i) => i.id === newItem.id);
        if (isNewLine && current.length >= MAX_CART_ITEMS) {
            setCartError(`Your cart is full (${MAX_CART_ITEMS} items max). Remove an item before adding another.`);
            return;
        }

        const updateLocal = () => {
            setItems((prev) => {
                const existing = prev.find((i) => i.id === newItem.id);
                if (existing) {
                    return prev.map((i) => (i.id === newItem.id ? { ...i, quantity: qty } : i));
                }
                return [...prev, { ...newItem, quantity: qty, meta } as CartItem];
            });
        };

        if (isAuthenticated) {
            updateLocal();
            const ok = await postQuantity(newItem.id, meta, qty);
            // A brand-new line has no server id yet; pull it in so later edits
            // and the dropdown render against real server data.
            if (ok && isNewLine) await fetchItems();
        } else {
            setCartError(null);
            updateLocal();
        }
    };

    const removeItem = (id: string) => {
        const target = items.find((i) => i.id === id);
        setItems((prev) => prev.filter((i) => i.id !== id));

        if (isAuthenticated) {
            const pending = pendingRef.current.get(id);
            if (pending) {
                clearTimeout(pending);
                pendingRef.current.delete(id);
            }
            setSummary((prev) => ({
                ...prev,
                lines: Math.max(0, prev.lines - 1),
                units: Math.max(0, prev.units - (target?.quantity ?? 0)),
            }));
            void postQuantity(id, target?.meta, 0);
        }
    };

    const updateQuantity = (id: string, quantity: number) => {
        if (quantity <= 0) {
            removeItem(id);
            return;
        }

        const target = items.find((i) => i.id === id);
        const delta = quantity - (target?.quantity ?? 0);

        // Optimistic — the UI moves on the tap, the write is coalesced behind it.
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity } : item)));

        if (isAuthenticated) {
            setSummary((prev) => ({ ...prev, units: Math.max(0, prev.units + delta) }));
            scheduleQuantitySync(id, target?.meta, quantity);
        }
    };

    const clearCart = () => {
        setItems([]);
        setSummary((prev) => ({ ...prev, lines: 0, units: 0 }));
    };

    const openCart = (status: boolean) => {
        setCartOpen(status);
        if (status) void ensureItemsLoaded();
    };

    const clearCartError = useCallback(() => setCartError(null), []);

    const value: CartContextType = {
        items,
        totalItems,
        totalPrice,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isCartOpen,
        openCart,
        itemsLoaded,
        ensureItemsLoaded,
        totalLines,
        maxItems: MAX_CART_ITEMS,
        cartError,
        clearCartError,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
