import DialogHandler from '@/components/dialog-handler';
import { CartProvider, useCart } from '@/contexts/CartContext';
import { Auth } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight, TruckIcon, User } from 'lucide-react';
import { PropsWithChildren } from 'react';
import FrontFooter from './front-footer';
import FrontHeader from './front-header';

interface IPropsHeader {
    auth: Auth;
    locale: string;
    translations: any;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
}

export default function FrontLayout({ auth, locale, translations, children, searchValue, onSearchChange }: PropsWithChildren<IPropsHeader>) {
    return (
        <>
            <CartProvider auth={auth}>
                <FrontChildLayout
                    children={children}
                    auth={auth}
                    locale={locale}
                    translations={translations}
                    searchValue={searchValue}
                    onSearchChange={onSearchChange}
                />
            </CartProvider>
        </>
    );
}

function FrontChildLayout({ children, auth, locale, translations, searchValue, onSearchChange }: PropsWithChildren<IPropsHeader>) {
    const { isCartOpen } = useCart();
    const page = usePage();
    const isSettings = page.url.startsWith('/settings');
    const currentPath = page.url.split('?')[0];
    return (
        <>
            <DialogHandler />
            <FrontHeader auth={auth} locale={locale} translations={translations} searchValue={searchValue} onSearchChange={onSearchChange} />
            <div className="relative min-h-screen bg-background">
                <div
                    className={`absolute inset-0 z-10 bg-foreground transition-opacity ${
                        isCartOpen ? 'pointer-events-auto opacity-75' : 'pointer-events-none opacity-0'
                    }`}
                ></div>
                <div className="relative z-20 flex min-h-screen flex-col">
                    <main className="flex-1">
                        {isSettings ? <FrontSettingsShell currentPath={currentPath}>{children}</FrontSettingsShell> : children}
                    </main>
                    <FrontFooter />
                </div>
            </div>
        </>
    );
}

type SettingsNavItem = {
    title: string;
    href: string;
    icon: LucideIcon;
};

const settingsNavItems: SettingsNavItem[] = [
    {
        title: 'Profile',
        href: '/settings/profile',
        icon: User,
    },
    {
        title: 'Delivery Address',
        href: '/settings/delivery-address-profile',
        icon: TruckIcon,
    },
];

function FrontSettingsShell({ children, currentPath }: PropsWithChildren<{ currentPath: string }>) {
    return (
        <section className="bg-muted/30 py-10 sm:py-12 lg:py-16">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:flex-row lg:items-start lg:gap-12">
                <FrontSettingsSidebar currentPath={currentPath} />
                <div className="flex-1 lg:max-w-3xl">{children}</div>
            </div>
        </section>
    );
}

function FrontSettingsSidebar({ currentPath }: { currentPath: string }) {
    return (
        <aside className="lg:w-72">
            <div className="space-y-4 rounded-3xl border border-border bg-card text-card-foreground shadow-sm lg:sticky lg:top-28">
                <nav className="flex flex-col gap-1 px-3 py-4">
                    {settingsNavItems.map((item) => {
                        const isActive = currentPath === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                prefetch
                                className={`group flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors ${
                                    isActive
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                            >
                                <item.icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-primary-foreground' : 'text-foreground/80'}`} />
                                <div className="flex-1 text-left">
                                    <span className={`block text-sm font-semibold ${isActive ? 'text-primary-foreground' : 'text-foreground'}`}>
                                        {item.title}
                                    </span>
                                </div>
                                <ChevronRight
                                    className={`h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1 ${
                                        isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                                    }`}
                                />
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
}
