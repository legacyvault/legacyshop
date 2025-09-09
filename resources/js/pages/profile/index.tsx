import AppLayout from '@/layouts/app-layout';
import FrontLayout from '@/layouts/front/front-layout';
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
                    <FrontLayout auth={auth} locale={locale} translations={translations}>
                        <EditProfileForm profile={profile} />
                    </FrontLayout>
                </>
            )}
        </>
    );
}
