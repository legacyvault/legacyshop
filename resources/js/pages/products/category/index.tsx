import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Category',
        href: '/products/category',
    },
];

export default function Category() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products - Category" />
            <div>ini adalah category</div>
        </AppLayout>
    );
}
