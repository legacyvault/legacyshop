import AppLayout from '@/layouts/app-layout';
import FrontLayout from '@/layouts/front/front-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { ReactNode } from 'react';
import EditProfileForm from './edit-profile';

function EditProfile() {
    const { profile } = usePage<SharedData>().props;

    return <EditProfileForm profile={profile} />;
}

// This page is shared by the admin dashboard and the storefront: admins get
// the dashboard chrome (AppLayout), everyone else gets the storefront chrome
// (FrontLayout, persistent across storefront navigation). Which one applies
// depends on the logged-in user's role, which isn't known until render time,
// so the choice lives inside this small wrapper (read via usePage) rather
// than in the page component itself.
function RoleAwareProfileLayout({ children }: { children: ReactNode }) {
    const { auth } = usePage<SharedData>().props;

    if (auth.user.role === 'admin') {
        const breadcrumbs: BreadcrumbItem[] = [
            {
                title: 'Edit Profile',
                href: '/edit-profile',
            },
        ];

        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Edit Profile" />
                {children}
            </AppLayout>
        );
    }

    return <FrontLayout>{children}</FrontLayout>;
}

EditProfile.layout = (page: ReactNode) => <RoleAwareProfileLayout>{page}</RoleAwareProfileLayout>;

export default EditProfile;
