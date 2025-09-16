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
    categories: ICategories[];
    tags: ITags[];
    subcats: ISubcats[];
    divisions: IDivisions[];
    variants: IVariants[];
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
    country: string | null;
    created_at: string | Date;
    id: string;
    name: string;
    phone: string | null;
    updated_at: string | Date;
    user_id: string;
    date_of_birth: string;
    delivery_address: string;
}

export interface IUnit {
    id: string;
    name: string;
    description: string;
    categories: ICategories[];
}

export interface ICategories {
    id: string;
    name: string;
    description: string;
    unit_id: string;
    unit: IUnit;
    sub_categories: ISubcats[];
}

export interface ITags {
    id: string;
    name: string;
    description: string;
}

export interface ISubcats {
    category_id: string;
    description: string;
    discount: number;
    id: string;
    name: string;
    price: number;
    total_stock: number;
    category: ICategories;
    stocks: IStocks[];
    divisions: IDivisions[];
}

export interface IStocks {
    id: string;
    quantity: number;
    remarks: string;
    created_at: string;
    sub_category_id: string;
}

export interface IDivisions {
    description: string;
    discount: number;
    id: string;
    name: string;
    price: number;
    sub_category: ISubcats;
    sub_category_id: string;
    total_stock: number;
    stocks: IStocks[];
    variants: IVariants[];
}

export interface IVariants {
    color: string | null;
    description: string;
    discount: number;
    division: IDivisions;
    division_id: string;
    id: string;
    name: string;
    price: number;
    stocks: IStocks[];
    total_stock: number;
    type: 'text' | 'color' | '';
}
