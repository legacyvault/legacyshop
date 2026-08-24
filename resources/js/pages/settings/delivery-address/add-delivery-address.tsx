import AddDeliveryAddressModal from '@/components/add-delivery-address-modal';
import FrontLayout from '@/layouts/front/front-layout';
import type { SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { ReactNode, useCallback, useState } from 'react';

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

function AddDeliveryAddress() {
    const { id, deliveryAddress, countryCode } = usePage<DeliveryAddressPageProps>().props;
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
        <>
            <Head title={`${isEdit ? 'Edit' : 'Add'} Delivery Address`} />

            <AddDeliveryAddressModal
                open={isModalOpen}
                onOpenChange={handleModalChange}
                deliveryAddress={deliveryAddress}
                id={id}
                countryCode={countryCode ?? 'ID'}
                closeOnSuccess={false}
            />
        </>
    );
}

AddDeliveryAddress.layout = (page: ReactNode) => <FrontLayout>{page}</FrontLayout>;

export default AddDeliveryAddress;
