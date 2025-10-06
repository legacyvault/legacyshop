import { Button } from '@/components/ui/button';
import FrontLayout from '@/layouts/front/front-layout';
import { SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';

export default function DeliveryAddress() {
    const { auth, locale, translations } = usePage<SharedData>().props;

    return (
        <FrontLayout auth={auth} locale={locale} translations={translations}>
            <Link href={'/settings/add-delivery-address-profile'}>
                <Button>Add Delivery Address</Button>
            </Link>

            <div>ini adalah delivery address</div>
        </FrontLayout>
    );
}
