import { Head, useForm } from '@inertiajs/react';
import { CheckCircle, Circle, LoaderCircle } from 'lucide-react';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

import DialogHandler from '@/components/dialog-handler';

type RegisterForm = {
    name: string;
    email: string;
    password: string;
    confirm_password: string;
};

type LoginFormErrors = RegisterForm & {
    register?: string;
};

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm<Required<RegisterForm>>({
        name: '',
        email: '',
        password: '',
        confirm_password: '',
    });

    const typedErrors = errors as Partial<LoginFormErrors>;

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('cognito.register'), {
            onFinish: () => reset('password', 'confirm_password'),
        });
    };

    const [errorAlert, setErrorAlert] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (typedErrors.register) {
            setErrorMsg(typedErrors.register);
            setErrorAlert(true);
        }
    }, [typedErrors]);

    const passwordChecks = useMemo(() => {
        const password = data.password;
        const hasLowercase = /[a-z]/.test(password);
        const hasUppercase = /[A-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[^A-Za-z0-9]/.test(password);
        const metCategories = [hasLowercase, hasUppercase, hasNumber, hasSpecial].filter(Boolean).length;

        return {
            hasLowercase,
            hasUppercase,
            hasNumber,
            hasSpecial,
            hasMinimumLength: password.length >= 8,
            meetsCategoryCount: metCategories >= 3,
        };
    }, [data.password]);

    const showPasswordChecklist = data.password.length > 0;

    const RequirementRow = ({ met, label }: { met: boolean; label: string }) => (
        <div className="flex items-start gap-2">
            {met ? (
                <CheckCircle className="mt-0.5 h-4 w-4 text-emerald-500" aria-hidden />
            ) : (
                <Circle className="mt-0.5 h-4 w-4 text-muted-foreground" aria-hidden />
            )}
            <span className={`text-sm ${met ? 'text-emerald-600' : 'text-muted-foreground'}`}>{label}</span>
        </div>
    );

    return (
        <>
            <DialogHandler />
            <AuthLayout title="Create an account" description="Enter your details below to create your account">
                <Head title="Register" />
                <form method="POST" className="flex flex-col gap-6" onSubmit={submit}>
                    <div className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                type="text"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                disabled={processing}
                                placeholder="Full name"
                            />
                            <InputError message={errors.name} className="mt-2" />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">Email address</Label>
                            <Input
                                id="email"
                                type="email"
                                required
                                tabIndex={2}
                                autoComplete="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                disabled={processing}
                                placeholder="email@example.com"
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                tabIndex={3}
                                autoComplete="new-password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                disabled={processing}
                                placeholder="Password"
                            />
                            <InputError message={errors.password} />
                            {showPasswordChecklist && (
                                <div className="rounded-md border border-emerald-100 bg-emerald-50/50 p-4">
                                    <p className="text-sm font-medium text-emerald-700">Your password must contain:</p>
                                    <div className="mt-3 space-y-2">
                                        <RequirementRow met={passwordChecks.hasMinimumLength} label="At least 8 characters" />
                                        <div className="space-y-1.5">
                                            <RequirementRow
                                                met={passwordChecks.meetsCategoryCount}
                                                label="At least 3 of the following:"
                                            />
                                            <div className="ml-6 space-y-1">
                                                <RequirementRow
                                                    met={passwordChecks.hasLowercase}
                                                    label="Lowercase letters (a-z)"
                                                />
                                                <RequirementRow
                                                    met={passwordChecks.hasUppercase}
                                                    label="Uppercase letters (A-Z)"
                                                />
                                                <RequirementRow met={passwordChecks.hasNumber} label="Numbers (0-9)" />
                                                <RequirementRow
                                                    met={passwordChecks.hasSpecial}
                                                    label="Special characters (e.g. !@#$%^&*)"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="confirm_password">Confirm password</Label>
                            <Input
                                id="confirm_password"
                                type="password"
                                required
                                tabIndex={4}
                                autoComplete="new-password"
                                value={data.confirm_password}
                                onChange={(e) => setData('confirm_password', e.target.value)}
                                disabled={processing}
                                placeholder="Confirm password"
                            />
                            <InputError message={errors.confirm_password} />
                        </div>

                        <Button type="submit" className="mt-2 w-full" tabIndex={5} disabled={processing}>
                            {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                            Create account
                        </Button>
                    </div>

                    <div className="text-center text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <TextLink href={route('login')} tabIndex={6}>
                            Log in
                        </TextLink>
                    </div>
                </form>
            </AuthLayout>
        </>
    );
}
