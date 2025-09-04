import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Division',
        href: '/products/division',
    },
];

export default function Division() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products - Division" />
            <span>ini adalah division</span>
        </AppLayout>
    );
}
