import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, IArticle, SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Articles',
        href: '/admin-articles',
    },
];

export default function AdminArticle() {
    const page = usePage<SharedData>();
    const articles = (page.props.articles as IArticle[] | undefined) ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Articles" />
            <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                    <div className="text-sm text-muted-foreground">
                        {articles.length > 0 ? `Total articles: ${articles.length}` : 'No articles available yet.'}
                    </div>
                    <Button>
                        <Link href={'/admin-articles/add-articles'}>Add Article</Link>
                    </Button>
                </div>
                <ArticlesTable articles={articles} />
            </div>
        </AppLayout>
    );
}

function ArticlesTable({ articles }: { articles: IArticle[] }) {
    const formatDateTime = (value?: string | null) => {
        if (!value) return '-';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '-';
        return new Intl.DateTimeFormat('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(date);
    };

    return (
        <table className="mt-4 w-full table-fixed border-collapse text-sm">
            <thead>
                <tr className="bg-sidebar-accent">
                    <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">#</th>
                    <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Title</th>
                    <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Slug</th>
                    <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Published</th>
                    <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Published At</th>
                    <th className="border border-popover px-4 py-3 text-left font-medium text-primary-foreground">Created At</th>
                    <th className="border border-popover px-4 py-3 text-right font-medium text-primary-foreground">Actions</th>
                </tr>
            </thead>
            <tbody>
                {articles.length > 0 ? (
                    articles.map((article, index) => (
                        <tr key={article.id} className="hover:bg-gray-50">
                            <td className="border border-popover px-4 py-3">{index + 1}</td>
                            <td className="border border-popover px-4 py-3 break-words whitespace-normal">{article.title}</td>
                            <td className="border border-popover px-4 py-3 break-all text-muted-foreground">{article.slug || '-'}</td>
                            <td className="border border-popover px-4 py-3">{article.is_published ? 'Yes' : 'No'}</td>
                            <td className="border border-popover px-4 py-3">{formatDateTime(article.published_at)}</td>
                            <td className="border border-popover px-4 py-3">{formatDateTime(article.created_at)}</td>
                            <td className="border border-popover px-4 py-3 text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100">⋮</DropdownMenuTrigger>
                                    <DropdownMenuContent className="rounded-md border bg-white shadow-md">
                                        <Link href={`/admin-articles/view-articles/${article.id}`}>
                                            <DropdownMenuItem className="cursor-pointer px-3 py-1 hover:bg-gray-100">View</DropdownMenuItem>
                                        </Link>
                                        <Link href={`/admin-articles/add-articles/${article.id}`}>
                                            <DropdownMenuItem className="cursor-pointer px-3 py-1 hover:bg-gray-100">Edit</DropdownMenuItem>
                                        </Link>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={7} className="border border-popover px-4 py-6 text-center text-sm text-muted-foreground">
                            No articles found. Try creating one from the Add Article button.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );
}
