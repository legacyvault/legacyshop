import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    child?: NavItem[];
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    profile: IProfile;
    sidebarOpen: boolean;
    [key: string]: unknown;
    translations: any;
    locale: string;
    units: IUnit[];
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    role: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

export interface IProfile {
    address: string | null;
    city: string | null;
    country: string | null;
    created_at: string | Date;
    id: string;
    name: string;
    phone: string | null;
    postal_code: string | null;
    province: string | null;
    updated_at: string | Date;
    user_id: string;
}

export interface IUnit {
    id: string;
    name: string;
    description: string;
}
