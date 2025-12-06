import AppLogoIcon from '@/components/app-logo-icon';
import { CartDropdown } from '@/components/CartDropdown';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { Auth, IRunningText } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import gsap from 'gsap';
import { Loader2, SearchIcon, X } from 'lucide-react';
import { ChangeEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

interface IPropsHeader {
    auth: Auth;
    locale: string;
    translations: any;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    searchRoute?: string;
    searchScopeLabel?: string;
    searchUnitId?: string;
}

type ProductSuggestion = {
    id: string;
    name: string;
    type: 'product' | 'unit' | 'sub_unit' | 'tags' | 'any';
    sub_unit?: { id: string; name: string } | null;
    unit?: { id: string; name: string } | null;
    tags?: { id: string; name: string }[];
};

const NavBottom = [
    {
        title: 'home',
        url: '/',
    },
    {
        title: 'products',
        url: '/list-products',
    },
    {
        title: 'articles',
        url: '/articles',
    },
];

export default function FrontHeader({
    auth,
    locale,
    translations,
    searchValue,
    onSearchChange,
    searchRoute,
    searchScopeLabel,
    searchUnitId,
}: IPropsHeader) {
    const page = usePage();
    const getInitials = useInitials();
    const [internalQuery, setInternalQuery] = useState('');
    const value = searchValue !== undefined ? searchValue : internalQuery;
    const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement | null>(null);
    const marqueeRef = useRef<HTMLDivElement | null>(null);
    const marqueeContainerRef = useRef<HTMLDivElement | null>(null);
    const [runningTexts, setRunningTexts] = useState<IRunningText[]>([]);
    const [isRTLoading, setIsRTLoading] = useState(true);
    const [repeatFactor, setRepeatFactor] = useState(1);
    const placeholder = useMemo(() => {
        if (searchScopeLabel) {
            return `Search within ${searchScopeLabel}...`;
        }
        return translations.navbar.search;
    }, [searchScopeLabel, translations.navbar.search]);

    const persistRecents = (items: string[]) => {
        setRecentSearches(items);
        try {
            localStorage.setItem('lv_recent_searches', JSON.stringify(items.slice(0, 8)));
        } catch {
            // ignore storage issues
        }
    };

    useEffect(() => {
        try {
            const saved = localStorage.getItem('lv_recent_searches');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    setRecentSearches(parsed.filter((v) => typeof v === 'string'));
                }
            }
        } catch {
            // ignore
        }
    }, []);

    const addRecentSearch = (term: string) => {
        const normalized = term.trim();
        if (!normalized) return;
        const next = [normalized, ...recentSearches.filter((r) => r.toLowerCase() !== normalized.toLowerCase())].slice(0, 8);
        persistRecents(next);
    };

    const updateQuery = (term: string) => {
        if (onSearchChange) onSearchChange(term);
        else setInternalQuery(term);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        updateQuery(e.target.value);
        setShowDropdown(true);
    };

    const handleSubmitSearch = (source: 'enter' | 'click' = 'enter') => {
        const q = value.trim();
        if (!q) return;
        addRecentSearch(q);
        const payload = searchUnitId ? { q, unit_id: searchUnitId } : q ? { q } : {};
        router.get(searchRoute ?? '/list-products', payload);
        setShowDropdown(false);
        if (mobileSearchOpen) {
            setMobileSearchOpen(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSubmitSearch('enter');
        }
    };

    const handleClear = () => {
        updateQuery('');
        setSuggestions([]);
    };

    const handleSuggestionClick = (suggestion: ProductSuggestion) => {
        setShowDropdown(false);
        setMobileSearchOpen(false);

        if (suggestion.type === 'product') {
            router.get(`/view-product/${suggestion.id}`);
            return;
        }

        if (suggestion.type === 'unit') {
            router.get(`/list-products/${suggestion.id}`);
            return;
        }

        if (suggestion.type === 'sub_unit') {
            router.get('/list-products', { sub_unit_ids: [suggestion.id] });
            return;
        }

        if (suggestion.type === 'tags') {
            router.get('/list-products', { tag_ids: [suggestion.id] });
            return;
        }
    };

    const handleRecentClick = (term: string) => {
        updateQuery(term);
        addRecentSearch(term);
        handleSubmitSearch('click');
    };

    useEffect(() => {
        const listener = (event: MouseEvent) => {
            if (mobileSearchOpen) return;
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', listener);
        return () => document.removeEventListener('mousedown', listener);
    }, [mobileSearchOpen]);

    useEffect(() => {
        const term = value.trim();

        if (term.length < 2) {
            setSuggestions([]);
            setIsLoadingSuggestions(false);
            return;
        }

        const controller = new AbortController();
        setIsLoadingSuggestions(true);
        const timer = window.setTimeout(async () => {
            try {
                const params = new URLSearchParams({
                    q: term,
                    limit: '10',
                });
                if (searchUnitId) params.set('unit_id', searchUnitId);

                const url = `/v1/public/product-search?${params.toString()}`;
                const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal, credentials: 'same-origin' });
                if (!res.ok) {
                    throw new Error('Failed to load suggestions');
                }
                const data = await res.json();
                if (!Array.isArray(data)) {
                    setSuggestions([]);
                } else {
                    setSuggestions(data as ProductSuggestion[]);
                }
            } catch (err: any) {
                if (err?.name === 'AbortError') return;
                setSuggestions([]);
            } finally {
                setIsLoadingSuggestions(false);
            }
        }, 280);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [value, searchUnitId]);

    const hasQuery = value.trim().length >= 2;
    const showRecents = !value.trim() && recentSearches.length > 0;
    const noMatches = hasQuery && !isLoadingSuggestions && suggestions.length === 0;

    const renderSuggestionsPanel = (isMobile = false) => (
        <div className={`${isMobile ? '' : 'max-h-80 overflow-y-auto'} rounded-xl border border-border bg-white shadow-lg`}>
            {showRecents && <div className="border-b px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">Recent searches</div>}
            {showRecents &&
                recentSearches.map((item) => (
                    <button
                        key={item}
                        type="button"
                        onClick={() => handleRecentClick(item)}
                        className="flex w-full items-center justify-between px-4 py-2 text-sm hover:bg-muted/60"
                    >
                        <span className="truncate">{item}</span>
                        <span className="text-xs text-primary uppercase">Search</span>
                    </button>
                ))}

            {hasQuery && (
                <div className="divide-y">
                    <div
                        onClick={() => router.get('/list-products', { q: value })}
                        className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground"
                    >
                        <div className="text-sm font-normal text-foreground">
                            {value} in <span className="font-semibold">All</span>
                        </div>
                    </div>
                    {suggestions.map((s) => {
                        const typeLabelMap: Record<string, string> = {
                            unit: 'Collection',
                            sub_unit: 'Category',
                            product: 'Product',
                            tags: 'Tags',
                        };
                        const unitName = s.unit?.name ?? '';
                        const subUnitName = s.sub_unit?.name ?? '';
                        return (
                            <button
                                type="button"
                                key={`${s.type}-${s.id}`}
                                className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-muted/60"
                                onClick={() => handleSuggestionClick(s)}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center">
                                        <div className="text-sm font-normal text-foreground">
                                            {s.name} in <span className="font-semibold">{typeLabelMap[s.type]}</span>
                                        </div>
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                        {s.type === 'product' && (unitName || subUnitName) && (
                                            <span className="rounded-full bg-muted px-2 py-0.5">
                                                {[unitName, subUnitName].filter(Boolean).join(' | ')}
                                            </span>
                                        )}
                                        {s.tags && s.tags.length > 0 && (
                                            <span className="flex flex-wrap gap-1">
                                                {s.tags.slice(0, 3).map((t) => (
                                                    <span key={t.id} className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                                                        {t.name}
                                                    </span>
                                                ))}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {isLoadingSuggestions && (
                <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Searching products…</span>
                </div>
            )}
        </div>
    );

    // Compute how many times to repeat the base sequence so one sequence is wider than the viewport
    useLayoutEffect(() => {
        const el = marqueeRef.current;
        const container = marqueeContainerRef.current;
        if (!el || !container) return;
        if (isRTLoading) return;
        if (runningTexts.length === 0) return;

        // Measure width of a single base sequence (A) by dividing by 2 and current repeatFactor
        const totalWidth = el.scrollWidth; // A + B, each already includes repeatFactor copies
        const perSequence = totalWidth / 2;
        if (!perSequence) return;
        const baseSequenceWidth = perSequence / Math.max(1, repeatFactor);
        if (!baseSequenceWidth) return;

        // Target: single sequence should be at least ~2x the container width for smooth wrap
        const desired = Math.max(1, Math.ceil((container.clientWidth * 2.2) / baseSequenceWidth));
        if (desired !== repeatFactor) setRepeatFactor(desired);
    }, [runningTexts.length, isRTLoading, repeatFactor]);

    // Reset repeat factor when there's no running text
    useEffect(() => {
        if (runningTexts.length === 0 && repeatFactor !== 1) setRepeatFactor(1);
    }, [runningTexts.length, repeatFactor]);

    // GSAP marquee: re-init when content or repeat factor changes (ensures seamless loop)
    useLayoutEffect(() => {
        const el = marqueeRef.current;
        if (!el) return;
        if (isRTLoading) return; // disable animation until running texts load
        if (runningTexts.length === 0) return;

        const setup = () => {
            const sequenceWidth = el.scrollWidth / 2; // we render the content twice
            if (!sequenceWidth) return;
            const pixelsPerSecond = 60; // adjust to change speed
            const duration = sequenceWidth / pixelsPerSecond;
            gsap.set(el, { x: 0 });
            return gsap.to(el, {
                x: -sequenceWidth,
                duration,
                ease: 'none',
                repeat: -1,
                modifiers: {
                    x: gsap.utils.unitize(gsap.utils.wrap(-sequenceWidth, 0)),
                },
            });
        };

        let tween = setup();
        const onResize = () => {
            tween && tween.kill();
            tween = setup();
        };
        window.addEventListener('resize', onResize);
        return () => {
            window.removeEventListener('resize', onResize);
            tween && tween.kill();
        };
        // Depend on content and repeatFactor so we re-measure when they change
    }, [runningTexts.length, repeatFactor, isRTLoading]);

    // Fetch active running texts for the marquee
    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                setIsRTLoading(true);
                const url = route('active.running-text');
                const res = await fetch(url, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
                if (!res.ok) return;
                const data = await res.json();
                if (!active) return;
                const list: IRunningText[] = Array.isArray(data) ? data : data && typeof data === 'object' ? [data as IRunningText] : [];
                setRunningTexts(list);
            } catch (e) {
                // noop
            } finally {
                if (active) setIsRTLoading(false);
            }
        };
        void load();
        return () => {
            active = false;
        };
    }, []);

    return (
        <>
            {/* <Link href={route('locale.switch', locale === 'en' ? 'id' : 'en')} className="rounded bg-gray-200 px-4 py-2">
                Switch to {locale === 'en' ? 'Bahasa' : 'English'}
            </Link> */}
            {auth.user && auth.user.role === 'admin' && (
                <div className="hidden border-b bg-gray-50 md:block">
                    <div className="mx-auto max-w-7xl px-4">
                        <div className="flex items-center justify-between py-2 text-xs text-gray-600">
                            <div className="flex items-center gap-4">
                                <Link href="/dashboard" prefetch>
                                    <span className="flex items-center gap-1">Back to Dashboard</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {runningTexts.length > 0 && (
                <div ref={marqueeContainerRef} className="relative overflow-hidden">
                    <div ref={marqueeRef} className="flex gap-8 py-2 text-[11px] whitespace-nowrap text-gray-600 uppercase will-change-transform">
                        {/* sequence A: repeat to ensure adequate width based on computed repeatFactor */}
                        {Array.from({ length: Math.max(1, repeatFactor) }).flatMap((_, repIdx) =>
                            runningTexts.map((t, i) => (
                                <div className="flex" key={`a-${repIdx}-${i}-${t.id}`}>
                                    <img src="/poke-icon.png" className="me-4 h-4 w-4" />
                                    <span>{t.running_text}</span>
                                </div>
                            )),
                        )}
                        {/* sequence B: duplicate for seamless loop */}
                        {Array.from({ length: Math.max(1, repeatFactor) }).flatMap((_, repIdx) =>
                            runningTexts.map((t, i) => (
                                <div className="flex" key={`b-${repIdx}-${i}-${t.id}`}>
                                    <img src="/poke-icon.png" className="me-4 h-4 w-4" />
                                    <span>{t.running_text}</span>
                                </div>
                            )),
                        )}
                    </div>
                </div>
            )}
            {/* Sticky header containing main header + nav + mobile search */}
            <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
                {/* Main header */}
                <div className="mx-auto max-w-7xl px-4">
                    <div className="flex items-center justify-between py-3 md:py-4">
                        {/* Left section - Logo */}
                        <div className="flex items-center gap-4">
                            <Link href={route('home')} className="font-bold text-foreground transition-opacity hover:opacity-80">
                                <AppLogoIcon className="size-16" />
                            </Link>
                        </div>

                        {/* Center section - Search bar (desktop) */}
                        <div className="mx-4 hidden flex-1 md:mx-8 md:block" ref={searchContainerRef}>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder={placeholder}
                                    value={value}
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                    onFocus={() => setShowDropdown(true)}
                                    className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pr-12 pl-12 text-sm text-gray-700 placeholder-gray-500 transition-all md:py-3"
                                />
                                <SearchIcon className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                {value && (
                                    <button
                                        type="button"
                                        onClick={handleClear}
                                        className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-gray-500 hover:bg-muted"
                                        aria-label="Clear search"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                                {isLoadingSuggestions && hasQuery && (
                                    <Loader2 className="absolute top-1/2 right-10 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
                                )}
                                {showDropdown && (showRecents || hasQuery) && (
                                    <div className="absolute top-full right-0 left-0 z-50 mt-2">{renderSuggestionsPanel()}</div>
                                )}
                            </div>
                        </div>

                        {/* Right section - Actions */}
                        <div className="flex w-64 items-center gap-2 md:gap-4">
                            <button
                                type="button"
                                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-gray-600 transition hover:bg-muted md:hidden"
                                onClick={() => {
                                    setMobileSearchOpen(true);
                                    setShowDropdown(true);
                                }}
                                aria-label="Open search"
                            >
                                <SearchIcon className="h-5 w-5" />
                            </button>
                            {/* User section */}

                            {auth.user ? (
                                <>
                                    {/* Shopping cart */}
                                    <CartDropdown auth={auth} />
                                    <DropdownMenu>
                                        <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-lg p-2 transition-colors hover:bg-gray-50">
                                            <div className="hidden items-center gap-2 md:flex">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                                                    {getInitials(auth.user.email)}
                                                </div>
                                                <span className="truncate text-sm font-medium text-gray-900 capitalize">
                                                    Hi, {auth.user.email.split('@')[0]}
                                                </span>
                                            </div>
                                            <div className="md:hidden">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                                                    {getInitials(auth.user.email)}
                                                </div>
                                            </div>
                                        </DropdownMenuTrigger>

                                        <DropdownMenuContent align="end" className="w-48">
                                            <UserMenuContent user={auth.user} />
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </>
                            ) : (
                                <>
                                    {/* Shopping cart */}
                                    <CartDropdown auth={auth} />
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={route('login')}
                                            className="hidden rounded-lg px-4 py-2 text-sm font-medium text-foreground capitalize transition-colors hover:bg-muted md:inline-block"
                                        >
                                            {translations.navbar.sign_in}
                                        </Link>
                                        <Link
                                            href={route('register')}
                                            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                                        >
                                            <span className="hidden capitalize md:inline">{translations.navbar.register}</span>
                                            <span className="capitalize md:hidden">{translations.navbar.register}</span>
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="mx-auto max-w-7xl px-4 pb-4">
                        <div className="flex flex-row gap-8 px-2">
                            {NavBottom.map((nav, i) => (
                                <Link key={i} href={nav.url}>
                                    <h1 className={`font-bold uppercase ${page.url === nav.url ? 'opacity-70' : ''}`}>{nav.title}</h1>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            {mobileSearchOpen && (
                <div className="fixed inset-0 z-[60] bg-white/95 backdrop-blur-sm">
                    <div className="mx-auto flex h-full max-w-3xl flex-col px-4 py-6">
                        <div className="mb-4 flex items-center gap-3">
                            <button
                                type="button"
                                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-gray-600 transition hover:bg-muted"
                                onClick={() => {
                                    setMobileSearchOpen(false);
                                    setShowDropdown(false);
                                }}
                                aria-label="Close search"
                            >
                                <X className="h-5 w-5" />
                            </button>
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder={placeholder}
                                    value={value}
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                    onFocus={() => setShowDropdown(true)}
                                    className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pr-12 pl-12 text-sm text-gray-700 placeholder-gray-500 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                                />
                                <SearchIcon className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                {value && (
                                    <button
                                        type="button"
                                        onClick={handleClear}
                                        className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-gray-500 hover:bg-muted"
                                        aria-label="Clear search"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                                {isLoadingSuggestions && hasQuery && (
                                    <Loader2 className="absolute top-1/2 right-10 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
                                )}
                            </div>
                            <button
                                type="button"
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                                onClick={() => handleSubmitSearch('click')}
                            >
                                Search
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto">{renderSuggestionsPanel(true)}</div>
                    </div>
                </div>
            )}
        </>
    );
}
