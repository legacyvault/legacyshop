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
    unitsPaginated: IRootUnits;
    categories: ICategories[];
    categoriesPaginated?: IRootCategories;
    tags: ITags[];
    tagsPaginated?: IRootTags;
    subcats: ISubcats[];
    subcatsPaginated?: IRootSubcats;
    divisions: IDivisions[];
    divisionsPaginated?: IRootDivisions;
    variants: IVariants[];
    variantsPaginated?: IRootVariants;
    products: IRootProducts;
    runningText: IRunningText[];
    banner: IBanner[];
    article: IArticle;
    articles: IArticle[];
    carts: ICart[];
}

export interface ICart{
    category: ICategories[] | null;
    category_id: string | null;
    division: IDivisions[] | null;
    division_id: string | null;
    id: string;
    price_per_product: number;
    product: IProducts;
    product_id: string;
    quantity: number;
    sub_category: ISubcats[] | null;
    sub_category_id: string | null;
    updated_at: string | Date;
    created_at: string | Date;
    user_id: string;
    variant: IVariants[] | null;
    variant_id: string | null;
}

export interface IBanner {
    id: string;
    banner_text: string;
    is_active: boolean;
    picture_url: string;
}

export interface IRunningText {
    id: string;
    running_text: string;
    is_active: boolean;
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
    picture_url?: string;
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
    usd_price: number;
}

export interface IStocks {
    id: string;
    quantity: number;
    remarks: string;
    created_at: string;
    sub_category_id: string;
    usd_price: number;
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
    usd_price: number;
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
    usd_price: number;
}

export interface IArticle {
    id: string;
    title: string;
    slug: string;
    content: any[];
    content_html: string | null;
    is_published: boolean;
    published_at: string | null;
    created_at?: string;
    updated_at?: string;
    image_cover: string | null;
}

export interface IRootProducts {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    total?: number;
    to?: number;
    data: IProducts[];
}

export interface IRootUnits {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    total?: number;
    to?: number;
    data: IUnit[];
}

export interface IRootCategories {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    total?: number;
    to?: number;
    data: ICategories[];
}

export interface IRootTags {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    total?: number;
    to?: number;
    data: ITags[];
}

export interface IRootSubcats {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    total?: number;
    to?: number;
    data: ISubcats[];
}

export interface IRootDivisions {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    total?: number;
    to?: number;
    data: IDivisions[];
}

export interface IRootVariants {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    total?: number;
    to?: number;
    data: IVariants[];
}

export interface IProducts {
    categories: ICategories[];
    created_at: string;
    description: string;
    divisions: (IDivisions & { pivot: IPivotDivisionProd })[];
    id: string;
    pictures: {
        created_at: string;
        id: string;
        product_id: string;
        updated_at: string;
        url: string;
    }[];
    product_discount: number;
    product_name: string;
    product_price: number;
    stocks: IStocks[];
    subcategories: (ISubcats & { pivot: IPivotSubcatProd })[];
    tags: ITags[];
    total_stock: number;
    unit: IUnit;
    unit_id: string;
    updated_at: string;
    variants: (IVariants & { pivot: IPivotVariantProd })[];
    product_sku: string;
    product_usd_price: number;
    is_showcase: boolean;
}

export interface IPivotDivisionProd {
    created_at: string;
    division_id: string;
    manual_discount: number;
    product_id: string;
    stock: number | null;
    updated_at: string;
    use_division_discount: number;
}

export interface IPivotSubcatProd {
    created_at: string;
    sub_category_id: string;
    manual_discount: number;
    product_id: string;
    stock: number | null;
    updated_at: string;
    use_subcategory_discount: number;
}

export interface IPivotVariantProd {
    created_at: string;
    variant_id: string;
    manual_discount: number;
    product_id: string;
    stock: number | null;
    updated_at: string;
    use_variant_discount: number;
}
