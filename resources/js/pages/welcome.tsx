import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { SearchIcon } from 'lucide-react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            <div className="">
            <header className="w-full shadow-md mb-6">
            <nav className="grid grid-cols-4 items-center justify-between gap-4 py-6 max-w-[335px] md:max-w-7xl mx-auto">
                {auth.user ? (
                    <Link
                        href={route('dashboard')}
                        className="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-foreground hover:border-[#1915014a]"
                    >
                        Dashboard
                    </Link>
                ) : (
                    <>
                        <div className='col-span-3 flex w-full items-center gap-4'>
                            <Link
                                href={route('home')}
                                className="inline-block rounded-sm border border-transparent py-1.5 text-xl leading-normal text-foreground hover:border-[#19140035] font-bold"
                            >
                                LOGO
                            </Link>

                            <div className="relative w-full hidden md:block">
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-700 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                                />
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground" />
                            </div>
                        </div>

                        <div className="flex gap-2 items-center">
                            <span>Cart</span>
                            |
                            <Link
                                href={route('login')}
                                className="inline-block rounded-sm border border-transparent px-5 py-1.5 text-sm leading-normal text-foreground hover:border-[#19140035] font-medium"
                            >
                                Log in
                            </Link>
                            <Link
                                href={route('register')}
                                className="inline-block rounded-sm border border-transparent px-5 py-1.5 text-sm leading-normal text-foreground hover:border-[#1915014a] font-medium"
                            >
                                Register
                            </Link>
                        </div>
                    </>
                )}
            </nav>
        </header>
                

                {/* HERO SECTION */}

                <div className='md:max-w-7xl mx-auto mb-16'>
                    <h1 className='text-5xl font-black mb-10 text-center text-primary'>Welcome to LegacyVault</h1>
                    <p className='text-center mb-4'>
                        Here at LegacyVault, we're all about the details. And when we say "custom," we mean it! Our super talented squad crafts these extended backgrounds with so much love and care, it would make a Jigglypuff jealous! We're talking mind-blowingly gorgeous custom artwork tailored to your favourite cards.
                    </p>
                    <p className='text-center'>
                    We totally get it. Your Pokémon cards are more than just cardboard - they're a piece of you, a part of your story. That's why we're here to not just protect 'em but also to glam 'em up. We create stellar protective cases with insane, customized extended backgrounds that will make your collection the envy of all.
                    </p>
                </div>

                {/* 3D SECTION */}
                <div className='h-[1200px] bg-amber-600'>
                    <span>3 nya di mulai dari sini</span>
                </div>
            </div>
        </>
    );
}
