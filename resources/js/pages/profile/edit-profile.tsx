import { IProfile } from '@/types';
import { useForm } from '@inertiajs/react';
import { Calendar, Globe, Phone, Save, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface Country {
    name: string;
    code: string;
    flag: string;
}

interface EditProfileFormProps {
    profile: IProfile;
}

export default function EditProfileForm({ profile }: EditProfileFormProps) {
    const [countries, setCountries] = useState<Country[]>([]);

    const { data, setData, post, processing, errors, isDirty } = useForm({
        name: profile?.name || '',
        phone: profile?.phone || '',
        date_of_birth: profile?.date_of_birth || '',
    });

    // Fetch countries on component mount
    useEffect(() => {
        fetchCountries();
    }, []);

    const fetchCountries = async () => {
        try {
            const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,flag');
            const data = await response.json();

            const formattedCountries: Country[] = data
                .map((country: any) => ({
                    name: country.name.common,
                    code: country.cca2,
                    flag: country.flag,
                }))
                .sort((a: Country, b: Country) => a.name.localeCompare(b.name));

            setCountries(formattedCountries);
        } catch (error) {
            console.error('Error fetching countries:', error);
            // Fallback to basic countries if API fails
            setCountries([
                { name: 'Indonesia', code: 'ID', flag: '🇮🇩' },
                { name: 'United States', code: 'US', flag: '🇺🇸' },
                { name: 'Singapore', code: 'SG', flag: '🇸🇬' },
            ]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('profile.edit'), {
            preserveState: true,
            onSuccess: () => {
                // Handle success (show toast, redirect, etc.)
                console.log('Profile updated successfully');
            },
            onError: (errors) => {
                console.log('Update failed:', errors);
            },
        });
    };

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <div className="mb-2 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-foreground">Edit Profile</h1>
                            <p className="text-sm text-muted-foreground">Update your personal information</p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                        {/* Personal Information Section */}
                        <div className="mb-6">
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-card-foreground">
                                <User className="h-4 w-4" />
                                Personal Information
                            </h2>

                            <div className="grid gap-4">
                                {/* Name Field */}
                                <div>
                                    <label htmlFor="name" className="mb-2 block text-sm font-medium text-card-foreground">
                                        Full Name *
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-ring focus:outline-none"
                                        placeholder="Enter your full name"
                                        required
                                    />
                                    {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name}</p>}
                                </div>

                                {/* Phone Field */}
                                <div>
                                    <label htmlFor="phone" className="mb-2 block text-sm font-medium text-card-foreground">
                                        <Phone className="mr-1 inline h-4 w-4" />
                                        Phone Number
                                    </label>
                                    <input
                                        id="phone"
                                        type="tel"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-ring focus:outline-none"
                                        placeholder="ex: 08227188219"
                                    />
                                    {errors.phone && <p className="mt-1 text-sm text-destructive">{errors.phone}</p>}
                                </div>

                                <div>
                                    <label htmlFor="date_of_birth" className="mb-2 block text-sm font-medium text-card-foreground">
                                        <Calendar className="mr-1 inline h-4 w-4" />
                                        Date of Birth
                                    </label>
                                    <input
                                        id="date_of_birth"
                                        type="date"
                                        value={data.date_of_birth}
                                        onChange={(e) => setData('date_of_birth', e.target.value)}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-ring focus:outline-none"
                                        max={new Date().toISOString().split('T')[0]} // Prevent future dates
                                    />
                                    {errors.date_of_birth && <p className="mt-1 text-sm text-destructive">{errors.date_of_birth}</p>}
                                </div>

                                <div>
                                    <label htmlFor="country" className="mb-2 block text-sm font-medium text-card-foreground">
                                        <Globe className="mr-1 inline h-4 w-4" />
                                        Country
                                    </label>
                                    <select
                                        id="country"
                                        value={profile.country!}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-transparent focus:ring-2 focus:ring-ring focus:outline-none"
                                        disabled={true}
                                    >
                                        <option value="">Select Country</option>
                                        {countries.map((country) => (
                                            <option key={country.code} value={country.code}>
                                                {country.flag} {country.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row">
                        <button
                            type="submit"
                            disabled={processing || !isDirty}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {processing ? 'Saving...' : 'Save Changes'}
                        </button>

                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="flex-1 rounded-md border border-border px-6 py-3 font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none sm:flex-none"
                        >
                            Cancel
                        </button>
                    </div>

                    {/* Dirty State Indicator */}
                    {isDirty && (
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">You have unsaved changes</p>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
