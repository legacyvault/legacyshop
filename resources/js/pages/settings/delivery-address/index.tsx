import { Button } from '@/components/ui/button';
import FrontLayout from '@/layouts/front/front-layout';
import { SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';

export default function DeliveryAddress() {
    const { auth, locale, translations, deliveryAddresses } = usePage<SharedData>().props;

    console.log(deliveryAddresses);

    return (
        <FrontLayout auth={auth} locale={locale} translations={translations}>
            <Link href={'/settings/add-delivery-address-profile'}>
                <Button className="mb-4">Add Delivery Address</Button>
            </Link>

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
                            <Link href={`/settings/add-delivery-address-profile/${addr.id}`}>
                                <Button className="pl-0" variant={'link'}>
                                    Edit Address
                                </Button>
                            </Link>
                        </div>
                    ))}
                </>
            ) : (
                <>No Delivery Address</>
            )}
        </FrontLayout>
    );
}
