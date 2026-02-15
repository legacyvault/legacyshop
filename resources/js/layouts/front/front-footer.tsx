import AppLogoIcon from '@/components/app-logo-icon';
import { Link, usePage } from '@inertiajs/react';

export default function FrontFooter() {
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

    const page = usePage();
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-foreground py-16">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-16">
                    <div>
                        <Link href={route('home')} className="font-bold text-foreground transition-opacity hover:opacity-80">
                            <AppLogoIcon className="size-16" />
                        </Link>
                        <h1 className="mt-2 pl-2 text-2xl font-semibold text-white">Legacy Vault</h1>
                    </div>

                    {/* Information Section */}
                    <div>
                        <h3 className="mb-6 text-lg font-semibold tracking-wide text-white">INFORMATION</h3>
                        <ul className="space-y-4">
                            {NavBottom.map((nav, i) => (
                                <li>
                                    <Link
                                        key={i}
                                        href={nav.url}
                                        className={`text-background capitalize transition-colors duration-200 hover:text-muted-foreground ${page.url === nav.url ? 'opacity-70' : ''}`}
                                    >
                                        {nav.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Mission Section */}
                    <div>
                        <h3 className="mb-6 text-lg font-semibold tracking-wide text-white">ABOUT</h3>
                        <p className="leading-relaxed text-gray-300">
                            Introducing our Premium Hand-drawn Extended Art Display Case, the perfect solution to show off your collection more
                            elegantly while ensuring the safety and protection of your cards. Enjoy exclusive Hand-drawn Extended Art Backgrounds from
                            the Legacy Vault. Made with high-quality materials, our display cases promise excellent durability and clarity, allowing
                            you to admire every detail without exception.
                        </p>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="mt-16 flex flex-col items-center justify-between border-t border-gray-800 pt-8 lg:flex-row">
                    <div className="mb-6 text-sm text-gray-400 lg:mb-0">© {currentYear} Legacy Vault - All Rights Reserved</div>

                    {/* Payment Icons */}
                    {/* <div className="flex space-x-3">
                        <div className="rounded bg-white p-2">
                            <svg className="h-5 w-8" viewBox="0 0 32 20" fill="none">
                                <rect width="32" height="20" rx="4" fill="white" />
                                <path d="M13.5 7.5v5h-2v-5h2zm4.5 0l-1.5 3.5L15 7.5h-2.5l2.5 5h2l2.5-5H17z" fill="#1A1F71" />
                                <path d="M21.5 7.5v5h-2v-5h2z" fill="#EB001B" />
                            </svg>
                        </div>
                        <div className="rounded bg-white p-2">
                            <svg className="h-5 w-8" viewBox="0 0 32 20" fill="none">
                                <rect width="32" height="20" rx="4" fill="white" />
                                <circle cx="12" cy="10" r="6" fill="#EB001B" />
                                <circle cx="20" cy="10" r="6" fill="#F79E1B" />
                                <path d="M16 6.5c-1.5 1.2-2.5 3-2.5 5s1 3.8 2.5 5c1.5-1.2 2.5-3 2.5-5s-1-3.8-2.5-5z" fill="#FF5F00" />
                            </svg>
                        </div>
                        <div className="rounded bg-white p-2">
                            <svg className="h-5 w-8" viewBox="0 0 32 20" fill="none">
                                <rect width="32" height="20" rx="4" fill="white" />
                                <circle cx="12" cy="10" r="6" fill="#0099DF" />
                                <circle cx="20" cy="10" r="6" fill="#DC143C" />
                                <path d="M16 6.5c-1.5 1.2-2.5 3-2.5 5s1 3.8 2.5 5c1.5-1.2 2.5-3 2.5-5s-1-3.8-2.5-5z" fill="#9C2AAE" />
                            </svg>
                        </div>
                        <div className="rounded bg-blue-600 p-2">
                            <svg className="h-5 w-8" viewBox="0 0 32 20" fill="none">
                                <rect width="32" height="20" rx="4" fill="#006FCF" />
                                <path d="M6 8h4v4H6V8zm6-2h4v8h-4V6zm6 1h4v6h-4V7z" fill="white" />
                            </svg>
                        </div>
                        <div className="rounded bg-black p-2">
                            <svg className="h-5 w-8" viewBox="0 0 32 20" fill="none">
                                <rect width="32" height="20" rx="4" fill="black" />
                                <path d="M8 6h3v8H8V6zm5 0h6v2h-6V6zm0 3h5v2h-5V9zm0 3h6v2h-6v-2z" fill="white" />
                            </svg>
                        </div>
                        <div className="rounded bg-orange-500 p-2">
                            <svg className="h-5 w-8" viewBox="0 0 32 20" fill="none">
                                <rect width="32" height="20" rx="4" fill="#FF9500" />
                                <circle cx="16" cy="10" r="4" fill="white" />
                                <path d="M14 8h4v4h-4V8z" fill="#FF9500" />
                            </svg>
                        </div>
                    </div> */}
                </div>
            </div>
        </footer>
    );
}
