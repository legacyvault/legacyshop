import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';

export default function AuthLayout({
    children,
    title,
    description,
    showBackToHome,
    ...props
}: {
    children: React.ReactNode;
    title: string;
    description: string;
    showBackToHome?: boolean;
}) {
    return (
        <AuthLayoutTemplate title={title} description={description} showBackToHome={showBackToHome} {...props}>
            {children}
        </AuthLayoutTemplate>
    );
}
