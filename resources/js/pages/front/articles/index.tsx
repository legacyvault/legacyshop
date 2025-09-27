import FrontLayout from '@/layouts/front/front-layout';
import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function FrontArticles() {
    const { auth, translations, locale, filters, articles } = usePage<SharedData>().props;
    const [search, setSearch] = useState(String((filters as any)?.q || ''));

    console.log(articles);

    return (
        <FrontLayout auth={auth} translations={translations} locale={locale} searchValue={search} onSearchChange={setSearch}>
            <div>ini isiannya adalah article</div>
        </FrontLayout>
    );
}
