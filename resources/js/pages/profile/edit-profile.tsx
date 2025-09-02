import { IProfile } from '@/types';
import { useForm } from '@inertiajs/react';
import { Globe, MapPin, Phone, Save, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface Country {
    name: string;
    code: string;
    flag: string;
}

interface Province {
    name: string;
    iso2: string;
}

interface City {
    name: string;
}

interface EditProfileFormProps {
    profile: IProfile;
}

export default function EditProfileForm({ profile }: EditProfileFormProps) {
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
    const [countries, setCountries] = useState<Country[]>([]);
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);

    const { data, setData, post, processing, errors, isDirty } = useForm({
        name: profile?.name || '',
        phone: profile?.phone || '',
        address: profile?.address || '',
        city: profile?.city || '',
        province: profile?.province || '', // Note: using 'provice' as per your interface
        country: profile?.country || '',
        postal_code: profile?.postal_code || '',
    });

    // Fetch countries on component mount
    useEffect(() => {
        fetchCountries();
    }, []);

    // Initialize location data when profile data is available
    useEffect(() => {
        if (data.country && countries.length > 0) {
            const country = countries.find((c) => c.name === data.country);
            if (country) {
                setSelectedCountry(country);
                fetchProvinces(country.code);
            }
        }
    }, [data.country, countries]);

    // Fetch cities when province changes
    useEffect(() => {
        if (data.province && selectedCountry) {
            fetchCities(selectedCountry.code, data.province);
        }
    }, [data.province, selectedCountry]);

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

    const fetchProvinces = async (countryCode: string) => {
        setLoadingProvinces(true);
        try {
            const response = await fetch(`https://api.countrystatecity.in/v1/countries/${countryCode}/states`, {
                headers: {
                    'X-CSCAPI-KEY': 'YOUR_API_KEY_HERE', // You'll need to get this from countrystatecity.in
                },
            });

            if (response.ok) {
                const data = await response.json();
                setProvinces(data);
            } else {
                // Fallback for when API key is not available
                console.log('Province API requires API key. Using fallback data.');
                setProvinces([]);
            }
        } catch (error) {
            console.error('Error fetching provinces:', error);
            setProvinces([]);
        } finally {
            setLoadingProvinces(false);
        }
    };

    const fetchCities = async (countryCode: string, stateCode: string) => {
        setLoadingCities(true);
        try {
            const province = provinces.find((p) => p.name === stateCode);
            if (!province) return;

            const response = await fetch(`https://api.countrystatecity.in/v1/countries/${countryCode}/states/${province.iso2}/cities`, {
                headers: {
                    'X-CSCAPI-KEY': 'YOUR_API_KEY_HERE', // You'll need to get this from countrystatecity.in
                },
            });

            if (response.ok) {
                const data = await response.json();
                setCities(data);
            } else {
                console.log('Cities API requires API key. Using fallback data.');
                setCities([]);
            }
        } catch (error) {
            console.error('Error fetching cities:', error);
            setCities([]);
        } finally {
            setLoadingCities(false);
        }
    };

    const handleCountryChange = (countryName: string) => {
        const country = countries.find((c) => c.name === countryName);
        if (country) {
            setSelectedCountry(country);
            setProvinces([]);
            setCities([]);
            setData((data) => ({
                ...data,
                country: countryName,
                province: '',
                city: '',
            }));

            // Fetch provinces for selected country
            fetchProvinces(country.code);
        }
    };

    const handleProvinceChange = (provinceName: string) => {
        setData((data) => ({
            ...data,
            province: provinceName,
            city: '',
        }));

        // Fetch cities for selected province
        if (selectedCountry) {
            fetchCities(selectedCountry.code, provinceName);
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
            <div className="mx-auto max-w-2xl">
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
                            </div>
                        </div>

                        {/* Address Information Section */}
                        <div>
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-card-foreground">
                                <MapPin className="h-4 w-4" />
                                Address Information
                            </h2>

                            <div className="grid gap-4">
                                {/* Address Field */}
                                <div>
                                    <label htmlFor="address" className="mb-2 block text-sm font-medium text-card-foreground">
                                        Street Address
                                    </label>
                                    <textarea
                                        id="address"
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-ring focus:outline-none"
                                        placeholder="Enter your street address"
                                        rows={3}
                                    />
                                    {errors.address && <p className="mt-1 text-sm text-destructive">{errors.address}</p>}
                                </div>

                                {/* Country Field */}
                                <div>
                                    <label htmlFor="country" className="mb-2 block text-sm font-medium text-card-foreground">
                                        <Globe className="mr-1 inline h-4 w-4" />
                                        Country
                                    </label>
                                    <select
                                        id="country"
                                        value={data.country}
                                        onChange={(e) => handleCountryChange(e.target.value)}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-transparent focus:ring-2 focus:ring-ring focus:outline-none"
                                    >
                                        <option value="">Select Country</option>
                                        {countries.map((country) => (
                                            <option key={country.code} value={country.name}>
                                                {country.flag} {country.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.country && <p className="mt-1 text-sm text-destructive">{errors.country}</p>}
                                </div>

                                {/* Province/State Field */}
                                <div>
                                    <label htmlFor="province" className="mb-2 block text-sm font-medium text-card-foreground">
                                        Province/State
                                    </label>
                                    {/* TODO: ENABLE THIS AFTER API KEY */}
                                    {/* <select
                                        id="province"
                                        value={data.province}
                                        onChange={(e) => handleProvinceChange(e.target.value)}
                                        disabled={!selectedCountry || loadingProvinces}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-transparent focus:ring-2 focus:ring-ring focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="">
                                            {loadingProvinces
                                                ? 'Loading provinces...'
                                                : selectedCountry
                                                  ? 'Select Province/State'
                                                  : 'Select Country First'}
                                        </option>
                                        {provinces.map((province) => (
                                            <option key={province.iso2} value={province.name}>
                                                {province.name}
                                            </option>
                                        ))}
                                    </select> */}
                                    <input
                                        id="province"
                                        type="text"
                                        value={data.province}
                                        onChange={(e) => setData('province', e.target.value)}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-ring focus:outline-none"
                                        placeholder="Enter province/state"
                                        required
                                    />
                                    {errors.province && <p className="mt-1 text-sm text-destructive">{errors.province}</p>}
                                </div>

                                {/* City and Postal Code Row */}
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {/* City Field */}
                                    <div>
                                        <label htmlFor="city" className="mb-2 block text-sm font-medium text-card-foreground">
                                            City
                                        </label>
                                        {/* TODO: enable after got api key */}
                                        {/* <select
                                            id="city"
                                            value={data.city}
                                            onChange={(e) => setData('city', e.target.value)}
                                            disabled={!data.province || loadingCities}
                                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-transparent focus:ring-2 focus:ring-ring focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="">
                                                {loadingCities ? 'Loading cities...' : data.province ? 'Select City' : 'Select Province First'}
                                            </option>
                                            {cities.map((city) => (
                                                <option key={city.name} value={city.name}>
                                                    {city.name}
                                                </option>
                                            ))}
                                        </select> */}
                                        <input
                                            id="city"
                                            type="text"
                                            value={data.city}
                                            onChange={(e) => setData('city', e.target.value)}
                                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-ring focus:outline-none"
                                            placeholder="Enter city"
                                            required
                                        />
                                        {errors.city && <p className="mt-1 text-sm text-destructive">{errors.city}</p>}
                                    </div>

                                    {/* Postal Code Field */}
                                    <div>
                                        <label htmlFor="postal_code" className="mb-2 block text-sm font-medium text-card-foreground">
                                            Postal Code
                                        </label>
                                        <input
                                            id="postal_code"
                                            type="text"
                                            value={data.postal_code}
                                            onChange={(e) => setData('postal_code', e.target.value)}
                                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-ring focus:outline-none"
                                            placeholder="12345"
                                        />
                                        {errors.postal_code && <p className="mt-1 text-sm text-destructive">{errors.postal_code}</p>}
                                    </div>
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
