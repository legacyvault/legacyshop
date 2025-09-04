import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Variant',
        href: '/products/variant',
    },
];

export default function Variant() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products - Variant" />
            <span>ini adalah variant</span>
        </AppLayout>
    );
}
