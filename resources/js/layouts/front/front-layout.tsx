import DialogHandler from '@/components/dialog-handler';
import { Auth } from '@/types';
import { PropsWithChildren } from 'react';
import FrontFooter from './front-footer';
import FrontHeader from './front-header';

interface IPropsHeader {
    auth: Auth;
    locale: string;
    translations: any;
}

export default function FrontLayout({ children, auth, locale, translations }: PropsWithChildren<IPropsHeader>) {
    return (
        <>
            <DialogHandler />
            <FrontHeader auth={auth} locale={locale} translations={translations} />
            {children}
            <FrontFooter />
        </>
    );
}
