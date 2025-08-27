import { Button } from '@/components/ui/button';
import React, { useState } from 'react';

export default function FrontFooter() {
    const [email, setEmail] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle newsletter signup
        console.log('Newsletter signup:', email);
        setEmail('');
    };

    return (
        <footer className="bg-gray-900 py-16 text-white">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-16">
                    {/* Information Section */}
                    <div>
                        <h3 className="mb-6 text-lg font-semibold tracking-wide">INFORMATION</h3>
                        <ul className="space-y-4">
                            <li>
                                <a href="/home" className="text-gray-300 transition-colors duration-200 hover:text-white">
                                    Home
                                </a>
                            </li>
                            <li>
                                <a href="/products" className="text-gray-300 transition-colors duration-200 hover:text-white">
                                    Products
                                </a>
                            </li>
                            <li>
                                <a href="/contact" className="text-gray-300 transition-colors duration-200 hover:text-white">
                                    Contact
                                </a>
                            </li>
                            <li>
                                <a href="/wholesale" className="text-gray-300 transition-colors duration-200 hover:text-white">
                                    Wholesale
                                </a>
                            </li>
                            <li>
                                <a href="/affiliates" className="text-gray-300 transition-colors duration-200 hover:text-white">
                                    Affiliates
                                </a>
                            </li>
                            <li>
                                <a href="/faqs" className="text-gray-300 transition-colors duration-200 hover:text-white">
                                    FAQ's
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter Section */}
                    <div>
                        <h3 className="mb-6 text-lg font-semibold tracking-wide">KANTOFORGE NEWSLETTER</h3>
                        <p className="mb-6 text-gray-300">Sign-up for exclusive offers and new product releases!</p>
                        <form onSubmit={handleSubmit} className="flex">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="enter your email address"
                                className="flex-1 border border-gray-600 bg-transparent px-4 py-3 text-white placeholder-gray-400 transition-colors duration-200 focus:border-white focus:outline-none"
                                required
                            />
                            <Button
                                type="submit"
                                className="border-0 bg-white px-6 py-3 font-semibold text-gray-900 transition-colors duration-200 hover:bg-gray-100"
                            >
                                SUBMIT
                            </Button>
                        </form>
                    </div>

                    {/* Mission Section */}
                    <div>
                        <h3 className="mb-6 text-lg font-semibold tracking-wide">OUR MISSION</h3>
                        <p className="leading-relaxed text-gray-300">
                            We craft high-quality, unique protective cases that elevate your Pokémon card display game. We're passionate about helping
                            you celebrate your collection in an eye-popping, personal style. So, get ready to showcase your cards in a way that
                            screams "YOU" with our crafty skills and attention to detail. KantoForge - your ultimate Pokémon card display partner!
                        </p>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="mt-16 flex flex-col items-center justify-between border-t border-gray-800 pt-8 lg:flex-row">
                    <div className="mb-6 text-sm text-gray-400 lg:mb-0">© 2024 KANTOFORGE LTD - All Rights Reserved - Company Number: 14592116</div>

                    {/* Payment Icons */}
                    <div className="flex space-x-3">
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
                    </div>
                </div>
            </div>
        </footer>
    );
}
