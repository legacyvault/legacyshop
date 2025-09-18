import AppLogoIcon from '@/components/app-logo-icon';
import { CartDropdown } from '@/components/CartDropdown';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { Auth } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { SearchIcon } from 'lucide-react';

interface IPropsHeader {
    auth: Auth;
    locale: string;
    translations: any;
}

const NavBottom = [
    {
        title: 'home',
        url: '/',
    },
    {
        title: 'products',
        url: '/list-products',
    },
];

export default function FrontHeader({ auth, locale, translations }: IPropsHeader) {
    const page = usePage();
    const getInitials = useInitials();

    return (
        <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
            <Link href={route('locale.switch', locale === 'en' ? 'id' : 'en')} className="rounded bg-gray-200 px-4 py-2">
                Switch to {locale === 'en' ? 'Bahasa' : 'English'}
            </Link>
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
            {/* Main header */}
            <div className="mx-auto max-w-7xl px-4">
                <div className="flex items-center justify-between py-3 md:py-4">
                    {/* Left section - Logo */}
                    <div className="flex items-center gap-4">
                        <Link href={route('home')} className="font-bold text-foreground transition-opacity hover:opacity-80">
                            <AppLogoIcon className="size-16" />
                        </Link>
                    </div>

                    {/* Center section - Search bar */}
                    <div className="mx-4 flex-1 md:mx-8">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder={translations.navbar.search}
                                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pr-4 pl-12 text-sm text-gray-700 placeholder-gray-500 transition-all md:py-3"
                            />
                            <SearchIcon className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>

                    {/* Right section - Actions */}
                    <div className="flex w-64 items-center gap-2 md:gap-4">
                        {/* User section */}
                        {auth.user ? (
                            <>
                                {/* Shopping cart */}
                                <CartDropdown />
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
                        )}
                    </div>
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

            {/* Mobile search bar */}
            <div className="px-4 pb-4 md:hidden">
                <div className="relative">
                    <input
                        type="text"
                        placeholder={translations.navbar.search}
                        className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pr-4 pl-12 text-sm text-gray-700 placeholder-gray-500 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    />
                    <SearchIcon className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
            </div>
        </header>
    );
}
