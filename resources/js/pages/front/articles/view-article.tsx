import { formatPublishedDate, getArticleReadTime, getArticleText } from '@/components/articles/article-utils';
import FrontLayout from '@/layouts/front/front-layout';
import { IArticle, SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

const escapeHtml = (value: string): string =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

export default function FrontArticleView() {
    const { auth, translations, locale, article } = usePage<SharedData & { article?: IArticle | null }>().props;

    if (!article) {
        return (
            <FrontLayout auth={auth} translations={translations} locale={locale}>
                <section className="py-24">
                    <div className="mx-auto max-w-3xl px-4 text-center">
                        <h1 className="text-3xl font-bold text-foreground">Article not found</h1>
                        <p className="mt-4 text-muted-foreground">
                            The article you are looking for might have been removed or is temporarily unavailable.
                        </p>
                        <Link href="/articles" className="mt-8 inline-block font-semibold text-primary">
                            Back to Articles
                        </Link>
                    </div>
                </section>
            </FrontLayout>
        );
    }

    const readTime = getArticleReadTime(article);
    const publishedDate = formatPublishedDate(article.published_at);
    const heroImage = article.image_cover ?? '/banner-example.jpg';
    const fallbackHtml = `<p>${escapeHtml(getArticleText(article))}</p>`;
    const articleHtml = article.content_html?.trim().length ? article.content_html : fallbackHtml;

    return (
        <>
            <Head title={article.title ?? 'Article'} />
            <FrontLayout auth={auth} translations={translations} locale={locale}>
                <section className="bg-muted/40">
                    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
                        <div className="mb-10 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <Link href="/articles" className="font-semibold text-primary transition hover:opacity-80">
                                Articles
                            </Link>
                            <span>/</span>
                            <span>{article.title}</span>
                        </div>
                        <h1 className="text-4xl font-bold leading-tight text-foreground sm:text-5xl">{article.title}</h1>
                        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <span>Legacy Vault Team</span>
                            <span>•</span>
                            <span>{publishedDate}</span>
                            {readTime && (
                                <>
                                    <span>•</span>
                                    <span>{readTime}</span>
                                </>
                            )}
                        </div>
                    </div>
                </section>

                <section className="border-y border-muted/50 bg-background">
                    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                        <div className="aspect-[16/7] overflow-hidden">
                            <img src={heroImage} alt={article.title} className="h-full w-full object-cover" loading="lazy" />
                        </div>
                    </div>
                </section>

                <section className="py-16">
                    <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-0">
                        <div
                            className="tiptap-content space-y-6 text-lg leading-relaxed text-muted-foreground"
                            dangerouslySetInnerHTML={{ __html: articleHtml }}
                        />
                    </article>
                </section>
            </FrontLayout>
        </>
    );
}
