import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';

export default function AdminArticle() {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Articles',
            href: '/admin-articles',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products" />
            <div className="p-4">
                <Button>
                    <Link href={'/admin-articles/add-articles'}>Add Articles</Link>
                </Button>
            </div>
        </AppLayout>
    );
}
