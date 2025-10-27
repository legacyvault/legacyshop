import AddDeliveryAddressModal from '@/components/add-delivery-address-modal';
import FrontLayout from '@/layouts/front/front-layout';
import type { SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { useCallback, useState } from 'react';

type DeliveryAddress = {
    id: string;
    name: string;
    contact_name: string;
    contact_phone: string;
    province: string;
    city: string;
    address: string;
    postal_code: string;
    latitude: string | number;
    longitude: string | number;
    is_active: boolean;
};

interface DeliveryAddressPageProps extends SharedData {
    id?: string | null;
    deliveryAddress?: DeliveryAddress | null;
}

export default function AddDeliveryAddress() {
    const { auth, locale, translations, id, deliveryAddress } = usePage<DeliveryAddressPageProps>().props;
    const [isModalOpen, setIsModalOpen] = useState(true);

    const handleModalChange = useCallback(
        (nextOpen: boolean) => {
            setIsModalOpen(nextOpen);

            if (!nextOpen) {
                window.history.back();
            }
        },
        [setIsModalOpen],
    );

    const isEdit = Boolean(id ?? deliveryAddress?.id);

    return (
        <FrontLayout auth={auth} locale={locale} translations={translations}>
            <Head title={`${isEdit ? 'Edit' : 'Add'} Delivery Address`} />

            <AddDeliveryAddressModal
                open={isModalOpen}
                onOpenChange={handleModalChange}
                deliveryAddress={deliveryAddress}
                id={id}
                closeOnSuccess={false}
            />
        </FrontLayout>
    );
}
