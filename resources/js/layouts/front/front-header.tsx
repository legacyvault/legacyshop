import AppLogoIcon from '@/components/app-logo-icon';
import { CartDropdown } from '@/components/CartDropdown';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { CommandDialog, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { UserMenuContent } from '@/components/user-menu-content';
import { useSearchBar } from '@/contexts/SearchBarContext';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { IEvents, IRunningText, SharedData } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { Command as CommandPrimitive } from 'cmdk';
import gsap from 'gsap';
import { Boxes, Layers, Loader2, Menu, Newspaper, Search, SearchIcon, Sparkles, Store, Tag } from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

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

const NAV_ICONS: Record<string, React.ReactNode> = {
    home: <Store className="size-5 shrink-0" />,
    products: <Boxes className="size-5 shrink-0" />,
    articles: <Newspaper className="size-5 shrink-0" />,
};

export default function FrontHeader() {
    const page = usePage<SharedData>();
    const { auth, translations } = page.props;
    const searchBar = useSearchBar();
    const searchValue = searchBar?.value;
    const onSearchChange = searchBar?.onChange;
    const searchRoute = searchBar?.route;
    const searchScopeLabel = searchBar?.scopeLabel;
    const searchUnitId = searchBar?.unitId;
    const getInitials = useInitials();
    const [internalQuery, setInternalQuery] = useState('');
    const value = searchValue !== undefined ? searchValue : internalQuery;
    const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
    const [searchOpen, setSearchOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const marqueeRef = useRef<HTMLDivElement | null>(null);
    const marqueeContainerRef = useRef<HTMLDivElement | null>(null);
    const [runningTexts, setRunningTexts] = useState<IRunningText[]>([]);
    const [isRTLoading, setIsRTLoading] = useState(true);
    const [repeatFactor, setRepeatFactor] = useState(1);
    const pageEvents = useMemo(() => {
        const raw = (page.props as { events?: IEvents[] }).events;
        return Array.isArray(raw) ? raw : [];
    }, [page.props]);
    const [activeEvents, setActiveEvents] = useState<IEvents[]>(pageEvents);
    const [isEventsLoading, setIsEventsLoading] = useState(false);
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

    const handleSubmitSearch = () => {
        const q = value.trim();
        if (!q) return;
        addRecentSearch(q);
        const payload = searchUnitId ? { q, unit_id: searchUnitId } : q ? { q } : {};
        router.get(searchRoute ?? '/list-products', payload);
        setSearchOpen(false);
    };

    const handleSuggestionClick = (suggestion: ProductSuggestion) => {
        setSearchOpen(false);

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
        const payload = searchUnitId ? { q: term, unit_id: searchUnitId } : { q: term };
        router.get(searchRoute ?? '/list-products', payload);
        setSearchOpen(false);
    };

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setSearchOpen((open) => !open);
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, []);

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

    const typeLabelMap: Record<string, string> = {
        unit: 'Collection',
        sub_unit: 'Category',
        product: 'Product',
        tags: 'Tags',
    };

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

    // Fetch active events for quick access in the header (use page-provided data when available)
    useEffect(() => {
        if (pageEvents.length > 0) {
            setActiveEvents(pageEvents);
            return;
        }

        let aborted = false;
        const controller = new AbortController();

        const loadEvents = async () => {
            try {
                setIsEventsLoading(true);
                const url = route('public.active-events');
                const res = await fetch(url, { headers: { Accept: 'application/json' }, credentials: 'same-origin', signal: controller.signal });
                if (!res.ok) return;
                const data = await res.json();
                if (aborted) return;
                const list: IEvents[] = Array.isArray(data) ? data : data && typeof data === 'object' ? [data as IEvents] : [];
                setActiveEvents(list);
            } catch (err: any) {
                if (err?.name === 'AbortError') return;
            } finally {
                if (!aborted) setIsEventsLoading(false);
            }
        };

        void loadEvents();
        return () => {
            aborted = true;
            controller.abort();
        };
    }, [pageEvents]);

    const isActive = (url: string) => page.url === url;

    const renderEventBadge = (discount: number) =>
        discount > 0 ? (
            <span className="absolute -top-2 -right-4 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-0.5 text-[8px] leading-none font-semibold text-destructive-foreground">
                {discount}%
            </span>
        ) : null;

    return (
        <>
            {auth.user && auth.user.role === 'admin' && (
                <div className="hidden border-b bg-muted/50 md:block">
                    <div className="mx-auto max-w-7xl px-4">
                        <div className="flex items-center justify-between py-2 text-xs text-muted-foreground">
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
                <div ref={marqueeContainerRef} className="relative overflow-hidden bg-secondary-foreground">
                    <div
                        ref={marqueeRef}
                        className="flex gap-8 py-2 text-[11px] whitespace-nowrap text-secondary uppercase will-change-transform"
                    >
                        {/* sequence A: repeat to ensure adequate width based on computed repeatFactor */}
                        {Array.from({ length: Math.max(1, repeatFactor) }).flatMap((_, repIdx) =>
                            runningTexts.map((t, i) => (
                                <div className="flex" key={`a-${repIdx}-${i}-${t.id}`}>
                                    <img src="/poke-icon.png" className="me-4 h-4 w-4" />
                                    <span className='text-muted'>{t.running_text}</span>
                                </div>
                            )),
                        )}
                        {/* sequence B: duplicate for seamless loop */}
                        {Array.from({ length: Math.max(1, repeatFactor) }).flatMap((_, repIdx) =>
                            runningTexts.map((t, i) => (
                                <div className="flex" key={`b-${repIdx}-${i}-${t.id}`}>
                                    <img src="/poke-icon.png" className="me-4 h-4 w-4" />
                                    <span className='text-muted'>{t.running_text}</span>
                                </div>
                            )),
                        )}
                    </div>
                </div>
            )}

            <header className="relative z-50 w-full border-b border-border/40 bg-background/95 shadow-[0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur supports-[backdrop-filter]:bg-background/80">
                <div className="mx-auto max-w-7xl px-4">
                    <div className="flex items-center justify-between gap-3 py-3 md:gap-6">
                        <div className="flex min-w-0 items-center gap-2">
                            {/* Logo */}
                            <Link href={route('home')} className="shrink-0 font-bold text-foreground transition-opacity hover:opacity-80">
                                <AppLogoIcon className="size-14 md:size-16" />
                            </Link>

                            {/* Desktop navigation */}
                            <NavigationMenu viewport={false} className="hidden lg:flex">
                                <NavigationMenuList className="gap-1">
                                    {NavBottom.map((nav) => (
                                        <NavigationMenuItem key={nav.url}>
                                            <NavigationMenuLink asChild>
                                                <Link
                                                    href={nav.url}
                                                    className={cn(
                                                        'inline-flex h-9 w-max items-center justify-center rounded-full px-4 py-2 text-sm font-bold uppercase transition-colors hover:bg-muted',
                                                        isActive(nav.url) && 'opacity-70',
                                                    )}
                                                >
                                                    {nav.title}
                                                </Link>
                                            </NavigationMenuLink>
                                        </NavigationMenuItem>
                                    ))}

                                    {(activeEvents.length > 0 || isEventsLoading) && (
                                        <NavigationMenuItem>
                                            <NavigationMenuTrigger className="h-9 rounded-full bg-transparent px-4 py-2 text-sm font-bold uppercase transition-colors hover:bg-muted hover:text-foreground focus:bg-transparent focus:text-foreground data-[state=open]:bg-transparent data-[state=open]:text-foreground">
                                                Events
                                            </NavigationMenuTrigger>
                                            <NavigationMenuContent className="z-50 border-0! bg-background! shadow-[0_0_24px_rgba(0,0,0,0.14)]!">
                                                <ul className="flex w-72 flex-col gap-1">
                                                    {isEventsLoading && activeEvents.length === 0 && (
                                                        <li className="flex items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground">
                                                            <Loader2 className="size-4 shrink-0 animate-spin" />
                                                            Loading...
                                                        </li>
                                                    )}
                                                    {activeEvents.map((event) => (
                                                        <li key={event.id} className="relative">
                                                            <NavigationMenuLink asChild>
                                                                <Link
                                                                    href={`/list-product/${event.id}`}
                                                                    className="flex flex-col items-start gap-1 rounded-md px-3 py-2 text-left transition-colors hover:bg-muted"
                                                                >
                                                                    <span className="w-full truncate pr-10 text-sm font-normal uppercase">{event.name}</span>
                                                                    {event.description && (
                                                                        <span className="line-clamp-2 w-full text-xs font-normal text-muted-foreground">
                                                                            {event.description}
                                                                        </span>
                                                                    )}
                                                                </Link>
                                                            </NavigationMenuLink>
                                                            {event.discount > 0 && (
                                                                <span className="absolute top-2 right-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-0.5 text-[8px] leading-none font-semibold text-destructive-foreground">
                                                                    {event.discount}%
                                                                </span>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </NavigationMenuContent>
                                        </NavigationMenuItem>
                                    )}
                                </NavigationMenuList>
                            </NavigationMenu>
                        </div>

                        {/* Actions */}
                        <div className="flex shrink-0 items-center gap-2">
                            {/* Desktop: search affordance that opens the palette */}
                            <button
                                type="button"
                                onClick={() => setSearchOpen(true)}
                                className="hidden h-9 w-56 items-center gap-2 rounded-full border px-3 text-sm text-muted-foreground transition-colors hover:bg-muted lg:flex xl:w-72"
                                aria-label="Open search"
                            >
                                <SearchIcon className="size-4 shrink-0" />
                                <span className="truncate">{placeholder}</span>
                                <kbd className="ml-auto hidden rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground xl:inline">
                                    ⌘K
                                </kbd>
                            </button>

                            {/* Mobile / tablet: icon only */}
                            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSearchOpen(true)} aria-label="Open search">
                                <Search className="size-5" />
                            </Button>

                            <CartDropdown auth={auth} />

                            {auth.user ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-muted">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                                            {getInitials(auth.user.email)}
                                        </div>
                                        <span className="hidden truncate text-sm font-medium capitalize md:inline">
                                            Hi, {auth.user.email.split('@')[0]}
                                        </span>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent align="end" className="w-48">
                                        <UserMenuContent user={auth.user} />
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Button asChild variant="ghost" size="sm" className="hidden capitalize md:inline-flex">
                                        <Link href={route('login')}>{translations.navbar.sign_in}</Link>
                                    </Button>
                                    <Button asChild size="sm" className="capitalize">
                                        <Link href={route('register')}>{translations.navbar.register}</Link>
                                    </Button>
                                </div>
                            )}

                            {/* Mobile drawer */}
                            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                                        <Menu className="size-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent className="overflow-y-auto">
                                    <SheetHeader>
                                        <SheetTitle asChild>
                                            <Link href={route('home')} onClick={() => setMobileMenuOpen(false)}>
                                                <AppLogoIcon className="size-12" />
                                            </Link>
                                        </SheetTitle>
                                    </SheetHeader>

                                    <div className="flex flex-col gap-6 px-4 pb-6">
                                        <Accordion type="single" collapsible className="flex w-full flex-col">
                                            {NavBottom.map((nav) => (
                                                <Link
                                                    key={nav.url}
                                                    href={nav.url}
                                                    onClick={() => setMobileMenuOpen(false)}
                                                    className={cn(
                                                        'flex items-center gap-3 border-b py-4 text-sm font-bold uppercase',
                                                        isActive(nav.url) && 'opacity-70',
                                                    )}
                                                >
                                                    {NAV_ICONS[nav.title]}
                                                    {nav.title}
                                                </Link>
                                            ))}

                                            {activeEvents.length > 0 && (
                                                <AccordionItem value="events">
                                                    <AccordionTrigger className="text-sm font-bold uppercase">
                                                        <span className="flex items-center gap-3">
                                                            <Sparkles className="size-5 shrink-0" />
                                                            Events
                                                        </span>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="flex flex-col">
                                                        {activeEvents.map((event) => (
                                                            <div className="relative w-fit" key={event.id}>
                                                                <Link
                                                                    href={`/list-product/${event.id}`}
                                                                    onClick={() => setMobileMenuOpen(false)}
                                                                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-bold uppercase hover:bg-muted"
                                                                >
                                                                    <Sparkles className="size-4 shrink-0" />
                                                                    <span className="truncate">{event.name}</span>
                                                                </Link>
                                                                {renderEventBadge(event.discount)}
                                                            </div>
                                                        ))}
                                                    </AccordionContent>
                                                </AccordionItem>
                                            )}
                                        </Accordion>

                                        {!auth.user && (
                                            <div className="flex flex-col gap-3">
                                                <Button asChild variant="outline" className="capitalize">
                                                    <Link href={route('login')} onClick={() => setMobileMenuOpen(false)}>
                                                        {translations.navbar.sign_in}
                                                    </Link>
                                                </Button>
                                                <Button asChild className="capitalize">
                                                    <Link href={route('register')} onClick={() => setMobileMenuOpen(false)}>
                                                        {translations.navbar.register}
                                                    </Link>
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>
            </header>

            {/* Search palette — server-driven, so cmdk's own filtering is disabled */}
            <CommandDialog
                open={searchOpen}
                onOpenChange={setSearchOpen}
                title="Search"
                description={placeholder}
                commandProps={{ shouldFilter: false }}
                className="top-[8%] translate-y-0 sm:max-w-2xl"
            >
                <div className="flex h-12 items-center gap-2 border-b px-4" cmdk-input-wrapper="">
                    <SearchIcon className="size-4 shrink-0 opacity-50" />
                    <CommandPrimitive.Input
                        autoFocus
                        value={value}
                        onValueChange={updateQuery}
                        placeholder={placeholder}
                        className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-hidden placeholder:text-muted-foreground"
                    />
                    {isLoadingSuggestions && hasQuery && <Loader2 className="size-4 shrink-0 animate-spin text-primary" />}
                </div>

                <CommandList className="max-h-[60vh]">
                    {noMatches && <CommandEmpty>No results found.</CommandEmpty>}

                    {showRecents && (
                        <CommandGroup heading="Recent searches">
                            {recentSearches.map((item) => (
                                <CommandItem key={item} value={`recent-${item}`} onSelect={() => handleRecentClick(item)}>
                                    <SearchIcon />
                                    <span className="truncate">{item}</span>
                                    <span className="ml-auto text-xs text-primary uppercase">Search</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {hasQuery && (
                        <CommandGroup heading={searchScopeLabel ? `In ${searchScopeLabel}` : 'Suggestions'}>
                            {/* Selected by default, so pressing Enter runs a full search */}
                            <CommandItem value="__search_all__" onSelect={handleSubmitSearch}>
                                <SearchIcon />
                                <span className="truncate">
                                    {value} in <span className="font-semibold">All</span>
                                </span>
                            </CommandItem>

                            {suggestions.map((s) => {
                                const unitName = s.unit?.name ?? '';
                                const subUnitName = s.sub_unit?.name ?? '';
                                return (
                                    <CommandItem
                                        key={`${s.type}-${s.id}`}
                                        value={`${s.type}-${s.id}`}
                                        onSelect={() => handleSuggestionClick(s)}
                                        className="items-start"
                                    >
                                        {s.type === 'tags' ? <Tag /> : s.type === 'product' ? <Boxes /> : <Layers />}
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-sm">
                                                {s.name} in <span className="font-semibold">{typeLabelMap[s.type]}</span>
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
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    );
}
