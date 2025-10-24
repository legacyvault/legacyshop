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
    ordersPaginated?: IOrdersPaginated;
    warehouses: IWarehouse[];
    warehouse?: IWarehouse | null;
    provinces: IProvince[];
    deliveryAddresses: IDeliveryAddress[];
    rates?: IRates | null;
}

export interface IRates {
    code: number;
    pricing: IRatePricing[];
}

export interface IRatePricing {
    available_collection_method?: string[];
    available_for_cash_on_delivery?: boolean;
    available_for_instant_waybill_id?: boolean;
    available_for_insurance?: boolean;
    available_for_proof_of_delivery?: boolean;
    company?: string;
    courier_code: string;
    courier_name: string;
    courier_service_code: string;
    courier_service_name: string;
    currency?: string;
    description?: string;
    duration?: string;
    price: number;
    service_type?: string;
    shipment_duration_range?: string;
    shipment_duration_unit?: string;
    shipping_fee?: number;
    shipping_type?: string;
    tax_lines?: unknown;
    type?: string;
}

export interface IDeliveryRate {
    courier_code: string;
    courier_name: string;
    courier_service_code: string;
    courier_service_name: string;
    description?: string;
    service_type?: string;
    shipping_type?: string;
    price: number;
    shipment_duration_range?: string;
    shipment_duration_unit?: string;
    duration?: string;
    duration_unit?: string;
}

export interface IDeliveryAddress {
    id: string;
    name: string;
    contact_name: string;
    contact_phone: string;
    address: string;
    country: string;
    postal_code: string;
    latitude: number;
    longitude: number;
    biteship_destination_id: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    province: string;
    province_code?: string | null;
    city: string;
    city_code?: string | null;
    district?: string | null;
    district_code?: string | null;
    village?: string | null;
    village_code?: string | null;
}

export interface IProvince {
    id: string;
    name: string;
    code: string;
}

export interface ICart {
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
    url: string;
    banner_title: string;
    button_text: string;
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
    country: string;
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

export interface IWarehouse {
    id: string;
    name: string;
    contact_name: string;
    contact_phone: string;
    address: string;
    country: string | null;
    postal_code: string | null;
    latitude: number | string;
    longitude: number | string;
    biteship_location_id: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
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

export interface IOrdersPaginated {
    current_page: number;
    from: number | null;
    last_page: number;
    per_page: number;
    total?: number;
    to?: number;
    data: IRootHistoryOrders[];
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
    is_showcase_top: boolean;
    is_showcase_bottom: boolean;
    product_weight: string;
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

export interface IOrderUser {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
}

export interface IRootHistoryOrders {
    created_at: string;
    grand_total: string;
    id: string;
    items: IItemHistoryOrders[];
    order_number: string;
    paid_at: string | null;
    payment_method: string;
    payment_status: string;
    shipment?: IShipmentHistoryOrders | null;
    shipping_fee: string;
    subtotal: string;
    transaction_expiry_time: string | null;
    transaction_id: string;
    transaction_status: string;
    transaction_time: string | null;
    updated_at: string;
    user?: IOrderUser | null;
    user_id: string;
    status: string;
}

export interface IShipmentHistoryOrders {
    id: string;
    order_id: string;
    courier_code: string;
    courier_name: string;
    courier_service: string;
    courier_service_name: string;
    receiver_name: string;
    receiver_phone: string;
    receiver_address: string;
    receiver_city: string;
    receiver_province: string;
    receiver_postal_code: string;
    shipping_fee: string;
    shipping_duration_range: string;
    shipping_duration_unit: string;
    waybill_number: string | null;
    status: string;
    shipped_at: string | null;
    delivered_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface IItemHistoryOrders {
    id: string;
    order_id: string;
    product_id: string;
    product_name: string;
    product_description: string | null;
    product_image: string;
    variant_id: string | null;
    variant_name: string | null;
    variant_description: string | null;
    category_id: string | null;
    category_name: string | null;
    category_description: string | null;
    sub_category_id: string | null;
    sub_category_name: string | null;
    sub_category_description: string | null;
    division_id: string | null;
    division_name: string | null;
    division_description: string | null;
    price: string;
    quantity: number;
    total: string;
    created_at: string;
    updated_at: string;
}

// ORDER TYPE
export interface IRootCheckoutOrderMidtrans {
    // message: string;
    // order: IDataOrderMidtrans;
    // midtrans_response: MidtransResponse;
    token: string;
    redirect_url: string;
}

export interface IDataOrderMidtrans {
    id: string;
    user_id: string;
    subtotal: number;
    shipping_fee: number;
    grand_total: number;
    payment_method: string;
    payment_status: string;
    status: string;
    order_number: string;
    updated_at: string;
    created_at: string;
    user: IUserDataOrderMidtrans;
    shipment: IShipmentDataOrderMidtrans;
    items: IItemDataOrderMidtrans[];
}

export interface IUserDataOrderMidtrans {
    id: string;
    email: string;
    email_verified_at: any;
    role: string;
}

export interface IShipmentDataOrderMidtrans {
    id: string;
    order_id: string;
    courier_code: string;
    courier_name: string;
    courier_service: string;
    courier_service_name: string;
    shipping_duration_range: string;
    shipping_duration_unit: string;
    shipping_fee: string;
    waybill_number: any;
    receiver_name: string;
    receiver_phone: string;
    receiver_address: string;
    receiver_postal_code: string;
    receiver_city: string;
    receiver_province: string;
    status: string;
    shipped_at: any;
    delivered_at: any;
    created_at: string;
    updated_at: string;
}

export interface IItemDataOrderMidtrans {
    id: string;
    order_id: string;
    product_id: string;
    product_name: string;
    product_description: string;
    category_id: any;
    category_name: any;
    category_description: any;
    sub_category_id: any;
    sub_category_name: any;
    sub_category_description: any;
    division_id: any;
    division_name: any;
    division_description: any;
    variant_id: any;
    variant_name: any;
    variant_description: any;
    quantity: number;
    price: string;
    total: string;
    created_at: string;
    updated_at: string;
}

export interface MidtransResponse {
    status_code: string;
    status_message: string;
    transaction_id: string;
    order_id: string;
    merchant_id: string;
    gross_amount: string;
    currency: string;
    payment_type: string;
    transaction_time: string;
    transaction_status: string;
    fraud_status: string;
    actions: IActionMidtransResponse[];
    acquirer: string;
    qr_string: string;
    expiry_time: string;
}

export interface IActionMidtransResponse {
    name: string;
    method: string;
    url: string;
}

declare global {
    interface Window {
        snap?: {
            embed: (
                token: string,
                options?: {
                    embedId: string;
                    onSuccess?: (r: any) => void;
                    onPending?: (r: any) => void;
                    onError?: (r: any) => void;
                    onClose?: (r: any) => void;
                },
            ) => void;
            hide?: () => void;
        };
    }
}

export {};
