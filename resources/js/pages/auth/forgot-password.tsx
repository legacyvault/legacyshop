import { Head, router } from '@inertiajs/react';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

type Step = 'email' | 'verify' | 'reset';

type DialogState = {
    open: boolean;
    type: 'success' | 'error';
    message: string;
};

function getCsrf(): string {
    return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
}

async function cognitoPost(routeName: string, body: Record<string, string>) {
    const res = await fetch(route(routeName), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': getCsrf(),
            Accept: 'application/json',
        },
        body: JSON.stringify(body),
    });
    return res.json();
}

export default function ForgotPassword() {
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [dialog, setDialog] = useState<DialogState>({ open: false, type: 'success', message: '' });
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const clearErrors = () => setErrors({});

    const sendCode = async () => {
        clearErrors();
        setProcessing(true);
        try {
            const json = await cognitoPost('cognito.send-code', { email });
            if (json?.meta?.status_code === 200) {
                setStep('verify');
            } else {
                setErrors({ email: json?.meta?.message ?? 'Something went wrong.' });
            }
        } catch {
            setErrors({ email: 'Network error. Please try again.' });
        } finally {
            setProcessing(false);
        }
    };

    const submitEmail: FormEventHandler = (e) => {
        e.preventDefault();
        sendCode();
    };

    const submitVerify: FormEventHandler = async (e) => {
        e.preventDefault();
        clearErrors();
        setProcessing(true);
        try {
            const json = await cognitoPost('cognito.verify', { email, code });
            if (json?.meta?.status_code === 200) {
                setStep('reset');
            } else {
                setErrors({ code: json?.meta?.message ?? 'Invalid or expired code.' });
            }
        } catch {
            setErrors({ code: 'Network error. Please try again.' });
        } finally {
            setProcessing(false);
        }
    };

    const submitReset: FormEventHandler = async (e) => {
        e.preventDefault();
        clearErrors();

        if (newPassword !== confirmPassword) {
            setErrors({ confirm_new_password: 'Passwords do not match.' });
            return;
        }

        setProcessing(true);
        try {
            const json = await cognitoPost('cognito.reset', {
                new_password: newPassword,
                confirm_new_password: confirmPassword,
            });
            if (json?.meta?.status_code === 200) {
                setDialog({ open: true, type: 'success', message: json.meta.message });
            } else {
                setErrors({ new_password: json?.meta?.message ?? 'Failed to reset password.' });
            }
        } catch {
            setErrors({ new_password: 'Network error. Please try again.' });
        } finally {
            setProcessing(false);
        }
    };

    const handleDialogClose = (open: boolean) => {
        setDialog((d) => ({ ...d, open }));
        if (!open && dialog.type === 'success') {
            router.visit(route('login'));
        }
    };

    const stepConfig = {
        email: { title: 'Forgot password', description: 'Enter your email address to receive a verification code' },
        verify: { title: 'Enter verification code', description: `We sent a 6-digit code to ${email}` },
        reset: { title: 'Reset your password', description: 'Enter a new password to complete the reset' },
    };

    return (
        <>
            <Dialog open={dialog.open} onOpenChange={handleDialogClose}>
                <DialogOverlay />
                <DialogContent>
                    <DialogTitle>{dialog.type === 'success' ? 'Success' : 'Error'}</DialogTitle>
                    <DialogDescription>{dialog.message}</DialogDescription>
                    <DialogClose asChild>
                        <Button>Okay</Button>
                    </DialogClose>
                </DialogContent>
            </Dialog>

            <AuthLayout title={stepConfig[step].title} description={stepConfig[step].description}>
                <Head title="Forgot password" />

                <div className="space-y-6">
                    {step === 'email' && (
                        <form method="POST" onSubmit={submitEmail}>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="email"
                                    autoFocus
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="my-6">
                                <Button type="submit" className="w-full" disabled={processing}>
                                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                    Send verification code
                                </Button>
                            </div>
                        </form>
                    )}

                    {step === 'verify' && (
                        <form method="POST" onSubmit={submitVerify}>
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label>Email address</Label>
                                    <p className="text-sm text-muted-foreground">{email}</p>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="code">Verification code</Label>
                                    <Input
                                        id="code"
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        autoFocus
                                        required
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                        placeholder="123456"
                                    />
                                    <InputError message={errors.code} />
                                </div>
                            </div>

                            <div className="my-6 grid gap-3">
                                <Button type="submit" className="w-full" disabled={processing}>
                                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                    Verify code
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full text-sm"
                                    disabled={processing}
                                    onClick={sendCode}
                                >
                                    Resend code
                                </Button>
                            </div>
                        </form>
                    )}

                    {step === 'reset' && (
                        <form method="POST" onSubmit={submitReset}>
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="new_password">New password</Label>
                                    <div className="relative">
                                        <Input
                                            id="new_password"
                                            type={showNewPassword ? 'text' : 'password'}
                                            autoFocus
                                            required
                                            autoComplete="new-password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="New password"
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword((v) => !v)}
                                            className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                                            tabIndex={-1}
                                        >
                                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    <InputError message={errors.new_password} />
                                    <p className="text-xs text-muted-foreground">
                                        Must be at least 8 characters with at least one number and one special character.
                                    </p>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="confirm_new_password">Confirm new password</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirm_new_password"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            required
                                            autoComplete="new-password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm new password"
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword((v) => !v)}
                                            className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                                            tabIndex={-1}
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    <InputError message={errors.confirm_new_password} />
                                </div>
                            </div>

                            <div className="my-6">
                                <Button type="submit" className="w-full" disabled={processing}>
                                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                    Reset password
                                </Button>
                            </div>
                        </form>
                    )}

                    <div className="space-x-1 text-center text-sm text-muted-foreground">
                        <span>Or, return to</span>
                        <TextLink href={route('login')}>log in</TextLink>
                    </div>
                </div>
            </AuthLayout>
        </>
    );
}
