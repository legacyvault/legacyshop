import DialogHandler from '@/components/dialog-handler';
import { CartProvider, useCart } from '@/contexts/CartContext';
import { Auth } from '@/types';
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
    return (
        <>
            <DialogHandler />
            <FrontHeader auth={auth} locale={locale} translations={translations} searchValue={searchValue} onSearchChange={onSearchChange} />
            <div className="relative min-h-screen">
                <div
                    className={`absolute inset-0 z-10 bg-foreground transition-opacity ${
                        isCartOpen ? 'opacity-75 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                ></div>
                {children}
                <FrontFooter />
            </div>
        </>
    );
}
