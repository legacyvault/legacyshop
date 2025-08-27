import { Auth } from '@/types';
import { Link } from '@inertiajs/react';
import { SearchIcon } from 'lucide-react';

interface IPropsHeader {
    auth: Auth;
}

export default function FrontHeader({ auth }: IPropsHeader) {
    return (
        <header className="mb-6 w-full shadow-md">
            <nav className="mx-auto grid max-w-[335px] grid-cols-4 items-center justify-between gap-4 py-6 md:max-w-7xl">
                {auth.user ? (
                    <Link
                        href={route('dashboard')}
                        className="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-foreground hover:border-[#1915014a]"
                    >
                        Dashboard
                    </Link>
                ) : (
                    <>
                        <div className="col-span-3 flex w-full items-center gap-4">
                            <Link
                                href={route('home')}
                                className="inline-block rounded-sm border border-transparent py-1.5 text-xl leading-normal font-bold text-foreground hover:border-[#19140035]"
                            >
                                LOGO
                            </Link>

                            <div className="relative hidden w-full md:block">
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="w-full rounded-md border border-gray-300 bg-white py-2 pr-4 pl-10 text-sm text-gray-700 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none"
                                />
                                <SearchIcon className="absolute top-1/2 left-3 -translate-y-1/2 text-foreground" />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span>Cart</span>|
                            <Link
                                href={route('login')}
                                className="inline-block rounded-sm border border-transparent px-5 py-1.5 text-sm leading-normal font-medium text-foreground hover:border-[#19140035]"
                            >
                                Log in
                            </Link>
                            <Link
                                href={route('register')}
                                className="inline-block rounded-sm border border-transparent px-5 py-1.5 text-sm leading-normal font-medium text-foreground hover:border-[#1915014a]"
                            >
                                Register
                            </Link>
                        </div>
                    </>
                )}
            </nav>
        </header>
    );
}
