import { MoveRight } from 'lucide-react';
import React from 'react';

export interface CasestudyItem {
    logo?: string;
    company: string;
    tags: string;
    title: string;
    subtitle: string;
    image?: string;
    link?: string;
}

export interface Casestudy5Props {
    featuredCasestudy: CasestudyItem;
    casestudies: CasestudyItem[];
    /** Label for the call-to-action shown on every card. */
    ctaLabel?: string;
    /** Element used for the card links — pass Inertia's `Link` for SPA navigation. */
    linkComponent?: React.ElementType;
    /** Content rendered in the cell following the cards on the bottom row. */
    aside?: React.ReactNode;
    className?: string;
}

export const Casestudy5 = ({
    featuredCasestudy,
    casestudies,
    ctaLabel = 'Read case study',
    linkComponent: LinkTag = 'a',
    aside,
    className,
}: Casestudy5Props) => {
    // Cards and the aside share one row, so their dividers follow the same index-based rules.
    const cellBorders = (idx: number) =>
        `${idx > 0 ? 'border-t lg:border-t-0' : ''} ${idx % 2 === 1 ? 'lg:border-l' : ''} ${idx >= 2 ? 'lg:border-t' : ''}`;

    return (
        <section className={className ?? 'py-32'}>
            <div className="container mx-auto">
                <div className="border border-border">
                    <LinkTag
                        href={featuredCasestudy.link || '#'}
                        className="group grid overflow-hidden transition-colors duration-500 ease-out hover:bg-muted/40 lg:grid-cols-2"
                    >
                        <div className="flex flex-col justify-between gap-3 px-6 pt-6 md:pt-10 lg:pb-10">
                            <div className="flex items-center gap-2 text-base font-medium">
                                {featuredCasestudy.logo && <img src={featuredCasestudy.logo} alt="logo" className="h-6" />}
                                {featuredCasestudy.company}
                            </div>
                            <div>
                                <span className="text-[11px] text-muted-foreground">{featuredCasestudy.tags}</span>
                                <h2 className="mt-2 mb-3 text-lg font-semibold text-balance sm:text-xl sm:leading-7">
                                    {featuredCasestudy.title}
                                    <span className="font-medium text-primary/50 transition-colors duration-500 ease-out group-hover:text-primary/70">
                                        {' '}
                                        {featuredCasestudy.subtitle}
                                    </span>
                                </h2>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    {ctaLabel}
                                    <MoveRight className="h-4 w-4 transition-transform duration-500 ease-out group-hover:translate-x-1" />
                                </div>
                            </div>
                        </div>
                        <div className="relative isolate px-6 pb-6 md:pb-8 lg:py-8">
                            <div className="h-full overflow-hidden">
                                <img
                                    src={featuredCasestudy.image}
                                    alt={featuredCasestudy.title}
                                    className="aspect-[16/9] h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                                    loading="lazy"
                                />
                            </div>
                        </div>
                    </LinkTag>
                    {(casestudies.length > 0 || aside) && (
                        <div className="grid border-t border-border lg:grid-cols-2">
                            {casestudies.map((item, idx) => (
                                <LinkTag
                                    key={`${item.title}-${idx}`}
                                    href={item.link || '#'}
                                    className={`group flex flex-col justify-between gap-5 border-border bg-background px-6 py-6 transition-colors duration-500 ease-out hover:bg-muted/40 md:py-8 lg:pb-8 xl:gap-6 ${cellBorders(idx)}`}
                                >
                                    <div className="flex items-center gap-2 text-base font-medium">
                                        {item.logo && <img src={item.logo} alt="logo" className="h-6" />}
                                        {item.company}
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-muted-foreground">{item.tags}</span>
                                        <h2 className="mt-2 mb-3 text-base font-semibold text-balance sm:text-lg sm:leading-6">
                                            {item.title}
                                            <span className="font-medium text-primary/50 transition-colors duration-500 ease-out group-hover:text-primary/70">
                                                {' '}
                                                {item.subtitle}
                                            </span>
                                        </h2>
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            {ctaLabel}
                                            <MoveRight className="h-4 w-4 transition-transform duration-500 ease-out group-hover:translate-x-1" />
                                        </div>
                                    </div>
                                </LinkTag>
                            ))}
                            {aside && (
                                <div
                                    className={`flex flex-col justify-center border-border px-6 py-6 md:py-8 ${cellBorders(casestudies.length)}`}
                                >
                                    {aside}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};
