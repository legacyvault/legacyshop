import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, IArticle } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Articles', href: '/admin-articles' },
    { title: 'View Article', href: '#' },
];

export default function ViewArticle() {
    const page = usePage<{ article: IArticle | null }>();
    const article = page.props.article;

    const formatDateTime = (value?: string | null) => {
        if (!value) return '-';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '-';
        return new Intl.DateTimeFormat('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(date);
    };

    const pageTitle = article ? `Articles - ${article.title}` : 'Article Not Found';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={pageTitle} />
            <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                    <div>
                        <h1 className="text-xl font-semibold">{article?.title ?? 'Article not found'}</h1>
                        {article?.slug && <p className="text-sm text-muted-foreground">Slug: {article.slug}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/admin-articles">Back to list</Link>
                        </Button>
                        {article && (
                            <Button asChild>
                                <Link href={`/admin-articles/add-articles/${article.id}`}>Edit Article</Link>
                            </Button>
                        )}
                    </div>
                </div>

                {article ? (
                    <div className="mt-6 space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="rounded border border-border p-4">
                                <p className="text-sm text-muted-foreground">Status</p>
                                <Badge variant={article.is_published ? 'default' : 'secondary'} className="mt-2 w-max">
                                    {article.is_published ? 'Published' : 'Draft'}
                                </Badge>
                            </div>
                            <div className="rounded border border-border p-4">
                                <p className="text-sm text-muted-foreground">Published At</p>
                                <p className="mt-2 text-sm font-medium">{formatDateTime(article.published_at)}</p>
                            </div>
                            <div className="rounded border border-border p-4">
                                <p className="text-sm text-muted-foreground">Last Updated</p>
                                <p className="mt-2 text-sm font-medium">{formatDateTime(article.updated_at)}</p>
                            </div>
                        </div>

                        <div className="rounded border border-border">
                            <div className="border-b border-border px-4 py-3">
                                <h2 className="text-base font-semibold">Content</h2>
                            </div>
                            <div
                                className="tiptap-content min-h-[200px] px-4 py-6"
                                dangerouslySetInnerHTML={{ __html: article.content_html ?? '' }}
                            />
                            {!article.content_html && (
                                <p className="px-4 pb-6 text-sm text-muted-foreground">No content available.</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="mt-6 rounded border border-border bg-muted/40 p-6 text-sm text-muted-foreground">
                        We could not find the requested article. Try returning to the list view.
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
