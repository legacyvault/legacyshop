import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Product',
        href: '/products/product',
    },
];

export default function Product() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products - Product" />
            <span>ini adalah product</span>
        </AppLayout>
    );
}
