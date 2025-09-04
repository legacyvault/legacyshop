import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

export default function Subcategory() {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Sub Category',
            href: '/products/subcategory',
        },
    ];
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products - Sub Category" />
            <span>ini adalah sub category</span>
        </AppLayout>
    );
}
