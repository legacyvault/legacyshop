import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';

export default function Warehouse() {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Warehouse',
            href: '/warehouse',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Warehouse" />

            <Link href={'/warehouse/add-warehouse'}>
                <Button>Add Warehouse</Button>
            </Link>
        </AppLayout>
    );
}
