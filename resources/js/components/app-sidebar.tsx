import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { Cable, LayoutGrid, ListOrdered, NotebookPen, PackageOpen, Store, WarehouseIcon } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Products',
        href: '/products/product',
        icon: PackageOpen,
        child: [
            {
                title: 'Unit',
                href: '/products/unit',
            },
            {
                title: 'Category',
                href: '/products/category',
            },
            {
                title: 'Sub Category',
                href: '/products/subcategory',
            },
            {
                title: 'Division',
                href: '/products/division',
            },
            {
                title: 'Variant',
                href: '/products/variant',
            },
            {
                title: 'Tags',
                href: '/products/tags',
            },
            {
                title: 'Product',
                href: '/products/product',
            },
        ],
    },
    {
        title: 'Misc',
        href: '/misc',
        icon: Cable,
        child: [
            {
                title: 'Running Text',
                href: '/misc/view-running-text',
            },
            {
                title: 'Banner',
                href: '/misc/view-banner',
            },
        ],
    },
    {
        title: 'Articles',
        href: '/admin-articles',
        icon: NotebookPen,
    },
    {
        title: 'Warehouse',
        href: '/warehouse',
        icon: WarehouseIcon,
    },
    {
        title: 'Orders',
        href: '/orders',
        icon: ListOrdered,
        child: [
            {
                title: 'Invoice',
                href: '/orders/invoice',
            },
            {
                title: 'Order',
                href: '/orders/order',
            },
        ],
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Storefront',
        href: '/',
        icon: Store,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
