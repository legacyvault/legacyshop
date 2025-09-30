import { formatPublishedDate, getArticleExcerpt, getArticleLink, getArticleReadTime } from '@/components/articles/article-utils';
import FrontLayout from '@/layouts/front/front-layout';
import { IArticle, SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export default function FrontArticles() {
    const { auth, translations, locale, filters, articles } = usePage<SharedData>().props;
    const [search, setSearch] = useState(String((filters as any)?.q || ''));
    const allArticles = useMemo(() => (Array.isArray(articles) ? (articles as IArticle[]) : []), [articles]);
    const featuredArticle = allArticles[0];
    const remainingArticles = allArticles.slice(1);
    const featuredReadTime = featuredArticle ? getArticleReadTime(featuredArticle) : null;

    return (
        <>
            <Head title="Articles" />
            <FrontLayout auth={auth} translations={translations} locale={locale} searchValue={search} onSearchChange={setSearch}>
                <section className="py-16">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <header className="mb-12 text-left">
                            <h1 className="mb-4 text-5xl font-bold text-primary">News & Articles</h1>
                            <p className="max-w-2xl text-xl text-muted-foreground">
                                Explore product highlights, collecting tips, and the latest updates from the Legacy Vault team.
                            </p>
                        </header>

                        {featuredArticle ? (
                            <Link href={getArticleLink(featuredArticle)}>
                                <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                                    <div
                                        className="group relative block overflow-hidden bg-muted"
                                        aria-label={`Read article ${featuredArticle.title}`}
                                    >
                                        <div className="aspect-[16/11] w-full overflow-hidden">
                                            <img
                                                src={featuredArticle.image_cover ?? '/banner-example.jpg'}
                                                alt={featuredArticle.title}
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                loading="lazy"
                                            />
                                        </div>
                                    </div>

                                    <article className="flex flex-col justify-center">
                                        <span className="inline-flex w-fit items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                                            Featured
                                        </span>
                                        <div className="mt-4 block">
                                            <h2 className="text-3xl leading-tight font-bold text-foreground transition hover:text-primary">
                                                {featuredArticle.title}
                                            </h2>
                                        </div>
                                        <p className="mt-4 text-lg text-muted-foreground">{getArticleExcerpt(featuredArticle, 220)}</p>
                                        <div className="mt-8 flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                                                {featuredArticle.title?.slice(0, 1).toUpperCase() ?? 'L'}
                                            </div>
                                            <div className="text-sm">
                                                <p className="font-semibold text-foreground">Legacy Vault Team</p>
                                                <p className="text-muted-foreground">
                                                    {formatPublishedDate(featuredArticle.published_at)}
                                                    {featuredReadTime ? ` • ${featuredReadTime}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                    </article>
                                </div>
                            </Link>
                        ) : (
                            <div className="bg-muted/30 p-12 text-center text-muted-foreground">
                                No articles published yet. Please check back soon.
                            </div>
                        )}

                        {remainingArticles.length > 0 && (
                            <div className="mt-16 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                                {remainingArticles.map((article) => {
                                    const readTime = getArticleReadTime(article);

                                    return (
                                        <article
                                            key={article.id}
                                            className="group flex h-full flex-col overflow-hidden bg-background transition hover:-translate-y-1 hover:shadow-xl"
                                        >
                                            <Link
                                                href={getArticleLink(article)}
                                                className="relative block aspect-[16/10] overflow-hidden bg-muted"
                                                aria-label={`Read article ${article.title}`}
                                            >
                                                <img
                                                    src={article.image_cover ?? '/banner-example.jpg'}
                                                    alt={article.title}
                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    loading="lazy"
                                                />
                                            </Link>
                                            <div className="flex flex-1 flex-col px-6 pt-5 pb-6">
                                                <span className="inline-flex w-fit items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary uppercase">
                                                    Article
                                                </span>
                                                <Link href={getArticleLink(article)} className="mt-4 block">
                                                    <h3 className="text-xl leading-tight font-semibold text-foreground transition group-hover:text-primary">
                                                        {article.title}
                                                    </h3>
                                                </Link>
                                                <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{getArticleExcerpt(article)}</p>
                                                <div className="mt-auto flex items-center justify-between pt-6 text-sm text-muted-foreground">
                                                    <div>
                                                        {formatPublishedDate(article.published_at)}
                                                        {readTime ? ` • ${readTime}` : ''}
                                                    </div>
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="1.8"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        className="h-5 w-5 transition group-hover:translate-x-1"
                                                    >
                                                        <path d="M5 12h14" />
                                                        <path d="M13 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>
            </FrontLayout>
        </>
    );
}
