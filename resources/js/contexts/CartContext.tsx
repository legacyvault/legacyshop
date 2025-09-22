import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import type { Auth } from '@/types';

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
    meta?: {
        product_id?: string;
        category_id?: string;
        sub_category_id?: string | null;
        division_id?: string | null;
        variant_id?: string | null;
    };
}

interface CartContextType {
    items: CartItem[];
    totalItems: number;
    totalPrice: number;
    addItem: (
        item: Omit<CartItem, 'quantity' | 'serverId'>,
        options?: { quantity?: number; meta?: CartItem['meta'] }
    ) => Promise<void> | void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    isCartOpen: boolean;
    openCart: (status: boolean) => void;
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

export const CartProvider = ({ children, auth }: CartProviderProps) => {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isCartOpen, setCartOpen] = useState(false);

    const isAuthenticated = useMemo(() => Boolean(auth?.user?.id), [auth?.user?.id]);
    const userId = auth?.user?.id ? String(auth.user.id) : undefined;

    // Helpers
    const STORAGE_KEY = 'cart_session';

    const saveToSession = (data: CartItem[]) => {
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            // no-op
        }
    };

    const loadFromSession = (): CartItem[] => {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            return raw ? (JSON.parse(raw) as CartItem[]) : [];
        } catch (e) {
            return [];
        }
    };

    const fetchServerCart = async () => {
        if (!userId) return [] as CartItem[];
        const res = await fetch(`/v1/carts/${userId}`, {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
        });
        if (!res.ok) return [] as CartItem[];
        const data = await res.json();
        const list = (data?.carts ?? []) as any[];
        const mapped: CartItem[] = list.map((row) => {
            const product = row.product ?? {};
            const name = product.product_name ?? 'Product';
            const basePrice = Number(product.product_price ?? 0);
            const image = product.pictures?.[0]?.url ?? undefined;
            const meta = {
                product_id: String(row.product_id ?? product.id ?? ''),
                category_id: row.category_id ? String(row.category_id) : undefined,
                sub_category_id: row.sub_category_id ? String(row.sub_category_id) : null,
                division_id: row.division_id ? String(row.division_id) : null,
                variant_id: row.variant_id ? String(row.variant_id) : null,
            };
            const compositeId = [
                meta.product_id ?? '',
                meta.category_id ?? '-',
                meta.sub_category_id ?? '-',
                meta.division_id ?? '-',
                meta.variant_id ?? '-',
            ].join('|');
            return {
                id: compositeId,
                name,
                price: basePrice,
                quantity: Number(row.quantity ?? 0),
                image,
                serverId: String(row.id),
                meta,
            } as CartItem;
        });
        setItems(mapped);
        return mapped;
    };

    // Initial load: server for auth, session for guests
    useEffect(() => {
        let active = true;
        const init = async () => {
            if (isAuthenticated) {
                await fetchServerCart();
            } else {
                const local = loadFromSession();
                if (!active) return;
                setItems(local);
            }
        };
        init();
        return () => {
            active = false;
        };
    }, [isAuthenticated, userId]);

    // Save to session storage for guest (and as a backup for auth)
    useEffect(() => {
        saveToSession(items);
    }, [items]);

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const addItem: CartContextType['addItem'] = async (newItem, options) => {
        const qty = Math.max(1, Number(options?.quantity ?? 1));
        const meta = options?.meta ?? newItem.meta;
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
            try {
                await new Promise<void>((resolve) => {
                    router.post(
                        route('add.cart'),
                        {
                            product_id: meta?.product_id ?? newItem.meta?.product_id ?? newItem.id.split('|')[0],
                            category_id: meta?.category_id,
                            sub_category_id: meta?.sub_category_id,
                            division_id: meta?.division_id,
                            variant_id: meta?.variant_id,
                            target_quantity: qty,
                        },
                        {
                            preserveScroll: true,
                            onFinish: () => resolve(),
                        }
                    );
                });
                await fetchServerCart();
            } catch (e) {
                updateLocal();
            }
        } else {
            updateLocal();
        }
    };

    const removeItem = (id: string) => {
        const target = items.find((i) => i.id === id);
        if (isAuthenticated && target?.meta) {
            const meta = target.meta;
            router.post(
                route('add.cart'),
                {
                    product_id: meta.product_id ?? id.split('|')[0],
                    category_id: meta.category_id,
                    sub_category_id: meta.sub_category_id,
                    division_id: meta.division_id,
                    variant_id: meta.variant_id,
                    target_quantity: 0,
                },
                {
                    preserveScroll: true,
                    onFinish: () => {
                        void fetchServerCart();
                    },
                    onError: () => setItems((prev) => prev.filter((i) => i.id !== id)),
                }
            );
        } else {
            setItems((prevItems) => prevItems.filter((item) => item.id !== id));
        }
    };

    const updateQuantity = (id: string, quantity: number) => {
        if (quantity <= 0) {
            removeItem(id);
            return;
        }
        const target = items.find((i) => i.id === id);
        if (isAuthenticated && target?.meta) {
            const meta = target.meta;
            router.post(
                route('add.cart'),
                {
                    product_id: meta.product_id ?? id.split('|')[0],
                    category_id: meta.category_id,
                    sub_category_id: meta.sub_category_id,
                    division_id: meta.division_id,
                    variant_id: meta.variant_id,
                    target_quantity: quantity,
                },
                {
                    preserveScroll: true,
                    onFinish: () => {
                        void fetchServerCart();
                    },
                    onError: () => setItems((prev) => prev.map((it) => (it.id === id ? { ...it, quantity } : it))),
                }
            );
        } else {
            setItems((prevItems) => prevItems.map((item) => (item.id === id ? { ...item, quantity } : item)));
        }
    };

    const clearCart = () => {
        setItems([]);
    };

    const openCart = (status: boolean) => {
        setCartOpen(status);
    };

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
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
