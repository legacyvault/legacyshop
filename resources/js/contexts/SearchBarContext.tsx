import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export interface SearchBarConfig {
    value: string;
    onChange: (value: string) => void;
    route?: string;
    scopeLabel?: string;
    unitId?: string;
}

interface SearchBarContextValue {
    config: SearchBarConfig | null;
    register: (config: SearchBarConfig) => void;
    unregister: () => void;
}

const SearchBarContext = createContext<SearchBarContextValue | null>(null);

/**
 * Backs the storefront search box that lives in the persistent FrontHeader.
 *
 * FrontLayout is now a persistent Inertia layout, so it (and FrontHeader
 * inside it) only mounts once per storefront session instead of once per
 * page visit. That means a page can no longer hand its local search state
 * to FrontLayout as props the way it used to — the layout is instantiated
 * outside the page's render tree. Instead, pages that want to drive the
 * header's search box call `usePageSearchBar(...)` to publish their local
 * state into this context, and FrontHeader reads it back out.
 *
 * Pages that don't call `usePageSearchBar` leave the header's search box in
 * its default (uncontrolled, posts to /list-products) mode.
 */
export function SearchBarProvider({ children }: PropsWithChildren) {
    const [config, setConfig] = useState<SearchBarConfig | null>(null);

    const register = useCallback((next: SearchBarConfig) => setConfig(next), []);
    const unregister = useCallback(() => setConfig(null), []);

    const value = useMemo(() => ({ config, register, unregister }), [config, register, unregister]);

    return <SearchBarContext.Provider value={value}>{children}</SearchBarContext.Provider>;
}

function useSearchBarContext() {
    const ctx = useContext(SearchBarContext);
    if (!ctx) {
        throw new Error('useSearchBarContext must be used within a SearchBarProvider');
    }
    return ctx;
}

/** Used by FrontHeader to read whichever page is currently driving the search box (if any). */
export function useSearchBar() {
    return useSearchBarContext().config;
}

/** Used by storefront pages to drive the header's search box with their own local state. */
export function usePageSearchBar(config: SearchBarConfig) {
    const { register, unregister } = useSearchBarContext();

    useEffect(() => {
        register(config);
        return unregister;
        // Re-register whenever the values the header needs actually change; `register`/`unregister`
        // are stable (useCallback with no deps) so they're safe to omit here.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [config.value, config.onChange, config.route, config.scopeLabel, config.unitId]);
}
