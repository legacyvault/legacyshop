import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Unit',
        href: '/products/unit',
    },
];

export default function Unit() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products - Unit" />
            <div>ini adalah unit</div>
        </AppLayout>
    );
}
