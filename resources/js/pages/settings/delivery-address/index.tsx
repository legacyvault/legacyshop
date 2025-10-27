import AddDeliveryAddressModal from '@/components/add-delivery-address-modal';
import { Button } from '@/components/ui/button';
import FrontLayout from '@/layouts/front/front-layout';
import { IDeliveryAddress, SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { useCallback, useState } from 'react';

export default function DeliveryAddress() {
    const { auth, locale, translations, profile } = usePage<SharedData>().props;

    const [isModalOpen, setIsModalOpen] = useState(false);

    const deliveryAddresses = profile.delivery_address;

    const handleModalChange = useCallback(
        (nextOpen: boolean) => {
            setIsModalOpen(nextOpen);

            if (!nextOpen) {
                route('profile.deliveryaddress.view');
            }
        },
        [setIsModalOpen],
    );

    const [selectedId, setSelectedId] = useState('');
    const [selectedAddress, setSelectedAddress] = useState<IDeliveryAddress | null>(null);

    const editAddressHandler = (addr: IDeliveryAddress) => {
        setSelectedId(addr.id);
        setSelectedAddress(addr);
        setIsModalOpen(true);
    };

    return (
        <FrontLayout auth={auth} locale={locale} translations={translations}>
            <Button onClick={() => setIsModalOpen(true)} className="mb-4">
                Add Delivery Address
            </Button>

            {deliveryAddresses.length > 0 ? (
                <>
                    {deliveryAddresses.map((addr, i) => (
                        <div
                            className={`mb-6 rounded-3xl border px-12 py-6 shadow ${Number(addr.is_active) === 0 ? 'border-accent' : 'border-primary'}`}
                            key={addr.id}
                        >
                            <div className="mb-12">
                                {Number(addr.is_active) === 1 && (
                                    <div className="mb-2">
                                        <span className="w-auto rounded-full bg-accent p-1.5 text-[10px]">Main Address</span>
                                    </div>
                                )}

                                <h3 className="text-md">{addr.name}</h3>
                                <h3 className="text-md">{addr.contact_phone}</h3>
                                <h2 className="font-medium">{addr.address}</h2>
                                <h2 className="font-medium">{addr.postal_code}</h2>
                            </div>
                            <Button onClick={() => editAddressHandler(addr)} className="pl-0" variant={'link'}>
                                Edit Address
                            </Button>
                        </div>
                    ))}
                </>
            ) : (
                <>
                    <br />
                    No Delivery Address
                </>
            )}

            <AddDeliveryAddressModal
                open={isModalOpen}
                onOpenChange={handleModalChange}
                deliveryAddress={selectedAddress}
                id={selectedId}
                closeOnSuccess={false}
            />
        </FrontLayout>
    );
}
