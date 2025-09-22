import FrontLayout from '@/layouts/front/front-layout';
import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function Carts() {
    const { auth, translations, locale, carts, filters } = usePage<SharedData>().props;
    const [search, setSearch] = useState(String((filters as any)?.q || ''));

    console.log(carts);

    return (
        <FrontLayout auth={auth} translations={translations} locale={locale} searchValue={search} onSearchChange={setSearch}>
            <div>ini adalah cart detail</div>
        </FrontLayout>
    );
}
