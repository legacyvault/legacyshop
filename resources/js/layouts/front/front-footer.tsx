import AppLogoIcon from '@/components/app-logo-icon';
import { Link, usePage } from '@inertiajs/react';
import { Building2, Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Twitter } from 'lucide-react';

export default function FrontFooter() {
    const page = usePage();
    const currentYear = new Date().getFullYear();

    const socials = [
        { label: 'Instagram', icon: Instagram, url: '#' },
        { label: 'Facebook', icon: Facebook, url: '#' },
        { label: 'Twitter', icon: Twitter, url: '#' },
        { label: 'LinkedIn', icon: Linkedin, url: '#' },
    ];

    const columns = [
        {
            title: 'Shop',
            links: [
                { title: 'All Products', url: '/list-products' },
                { title: 'Cart', url: '/view-cart' },
                { title: 'Checkout', url: '/checkout' },
            ],
        },
        {
            title: 'Company',
            links: [
                { title: 'Home', url: '/' },
                { title: 'About Us', url: '/about-us' },
                { title: 'Articles', url: '/articles' },
            ],
        },
        {
            title: 'Account',
            links: [
                { title: 'Login', url: '/login' },
                { title: 'Register', url: '/register' },
                { title: 'My Purchases', url: '/settings/purchases' },
            ],
        },
    ];

    const contacts = [
        {
            icon: MapPin,
            label: 'Address',
            content: (
                <>
                    Jakarta Indonesia
                </>
            ),
        },
        {
            icon: Mail,
            label: 'Email',
            content: (
                <a href="mailto:hello@legacyvault.com" className="transition-colors duration-200 hover:text-white">
                    hello@legacyvault.com
                </a>
            ),
        },
        {
            icon: Phone,
            label: 'Phone',
            content: (
                <a href="tel:+622112345678" className="transition-colors duration-200 hover:text-white">
                    +62 21 1234 5678
                </a>
            ),
        },
        {
            icon: Building2,
            label: 'Company No.',
            content: <>PT Legacy Vault Indonesia</>,
        },
    ];

    const legal = [
        { title: 'Terms and Conditions', url: '#' },
        { title: 'Privacy Policy', url: '#' },
    ];

    return (
        <footer className="bg-foreground py-16">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid grid-cols-2 gap-10 md:grid-cols-3 lg:grid-cols-12 lg:gap-12">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-3 lg:col-span-3">
                        <Link href={route('home')} className="flex items-center gap-3 transition-opacity hover:opacity-80">
                            <AppLogoIcon className="size-10" />
                            <span className="text-2xl font-bold tracking-tight text-white">Legacy Vault</span>
                        </Link>

                        <p className="mt-6 max-w-sm leading-relaxed text-gray-300">
                            Premium hand-drawn extended art display cases, made to show off your collection while keeping every card protected.
                        </p>

                        <div className="mt-8 flex items-center gap-6">
                            {socials.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.url}
                                    aria-label={social.label}
                                    className="text-gray-300 transition-colors duration-200 hover:text-white"
                                >
                                    <social.icon className="size-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Link columns */}
                    {columns.map((column) => (
                        <div key={column.title} className="lg:col-span-2">
                            <h3 className="mb-6 font-semibold text-white">{column.title}</h3>
                            <ul className="space-y-4">
                                {column.links.map((link) => (
                                    <li key={link.title}>
                                        <Link
                                            href={link.url}
                                            className={`text-gray-300 transition-colors duration-200 hover:text-white ${
                                                page.url === link.url ? 'text-white' : ''
                                            }`}
                                        >
                                            {link.title}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    {/* Contact */}
                    <div className="col-span-2 md:col-span-3 lg:col-span-3">
                        <h3 className="mb-6 font-semibold text-white">Contact</h3>
                        <ul className="space-y-4">
                            {contacts.map((contact) => (
                                <li key={contact.label} className="flex items-center gap-3 text-gray-300">
                                    <contact.icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                    <div>
                                        <span className="sr-only">{contact.label}: </span>
                                        <span className="text-sm leading-relaxed">{contact.content}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-16 flex flex-col gap-4 border-t border-background pt-8 text-sm text-gray-400 md:flex-row md:items-center md:justify-between">
                    <p>© {currentYear} Legacy Vault. All rights reserved.</p>

                    {/* <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
                        {legal.map((item) => (
                            <li key={item.title}>
                                <Link href={item.url} className="transition-colors duration-200 hover:text-white">
                                    {item.title}
                                </Link>
                            </li>
                        ))}
                    </ul> */}
                </div>
            </div>
        </footer>
    );
}
