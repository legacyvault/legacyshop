import AppLayout from '@/layouts/app-layout';
import FrontFooter from '@/layouts/front/front-footer';
import FrontHeader from '@/layouts/front/front-header';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import EditProfileForm from './edit-profile';

export default function EditProfile() {
    const { auth, profile, locale, translations } = usePage<SharedData>().props;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Edit Profile',
            href: '/edit-profile',
        },
    ];

    return (
        <>
            {auth.user.role === 'admin' ? (
                <>
                    <AppLayout breadcrumbs={breadcrumbs}>
                        <Head title="Edit Profile" />
                        <EditProfileForm profile={profile} />
                    </AppLayout>
                </>
            ) : (
                <>
                    <FrontHeader auth={auth} locale={locale} translations={translations} />
                    <EditProfileForm profile={profile} />
                    <FrontFooter />
                </>
            )}
        </>
    );
}
