import { Button } from '@/components/ui/button';
import FrontLayout from '@/layouts/front/front-layout';
import { Head, Link } from '@inertiajs/react';
import { ReactNode } from 'react';

const craftSteps = [
    {
        step: 'I.',
        title: 'Reference',
        description:
            'We study the original card art frame by frame. Line weight, light source, color palette, illustrator art-style, until we understand it well enough to continue it by hand.',
    },
    {
        step: 'II.',
        title: 'Hand-Drawn Extension',
        description:
            "The artwork is extended stroke by stroke, matching the original artist's linework so the transition feels seamless. We have a team of talented illustrators that specialize in specific art styles, so we can deliver our extended arts perfectly.",
    },
    {
        step: 'III.',
        title: 'Quality Check',
        description:
            "Every Extended Art is checked by hand against an actual card. We match the card's color and texture, then finish it with a fine glitter coat - so the piece doesn't just look premium next to your card. It feels like it too.",
    },
];

const values = [
    {
        title: 'Hand-Drawn, Always',
        description: 'No AI extensions, no filters - every Extended Art is drawn by our talented team of illustrators.',
    },
    {
        title: 'Quality First',
        description: 'Our Extended Art goes through multiple quality checks, made with premium materials that complement your collection perfectly.',
    },
    {
        title: 'Community First',
        description: 'We do amazing collaborations with card shows, KOLs, and many partnerships across the globe.',
    },
];

const SectionHead = ({ label, title }: { label: string; title: string }) => (
    <div className="mb-10">
        <div className="flex items-center gap-4">
            <span className="text-xs font-bold tracking-widest text-muted-foreground">{label}</span>
            <h2 className="font-pixel text-2xl font-bold text-primary md:text-3xl">{title}</h2>
        </div>
        <div className="mt-6 h-px w-full bg-border" />
    </div>
);

const craftPhotos = [
    {
        src: '/about/image-case-2-1.webp',
        alt: 'Legacy Vault illustrator drawing an extended art on a pen display at a card show',
    },
    {
        src: '/about/craft-drawing-1.jpeg',
        alt: 'Close-up of an illustrator extending card artwork stroke by stroke',
    },
    {
        src: '/about/craft-drawing-3.jpeg',
        alt: 'Close-up of an illustrator extending card artwork stroke by stroke',
    },
];

function AboutUs() {
    return (
        <>
            <Head title="About Us" />

            {/* Hero */}
            <section className="py-16">
                <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:px-8">
                    <div>
                        <div className="mb-6 flex items-center gap-3">
                            <span className="h-px w-7 bg-primary" />
                            <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                                Legacy Vault - Hand-Drawn Extended Art
                            </span>
                        </div>
                        <h1 className="font-pixel text-3xl leading-snug font-black text-balance text-primary md:text-4xl">
                            Every card deserves to break its frame.
                        </h1>
                        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
                            We hand-draw extended art that lets your favorite cards extend past the edges. Your collection needs the upgrade they
                            deserve.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link href="/list-products">
                                <Button>Browse Extended Art</Button>
                            </Link>
                            <Link href="/articles">
                                <Button variant="outline">Read Our Articles</Button>
                            </Link>
                        </div>
                    </div>
                    <div className="flex justify-center lg:justify-end">
                        <img
                            src="/about/image-case-2-1.webp"
                            alt="Umbreon ex Special Art Rare in a Legacy Vault extended art display case"
                            className="w-full max-w-md rounded-2xl object-cover shadow-xl"
                            loading="eager"
                        />
                    </div>
                </div>
            </section>

            {/* Our Story */}
            <section className="py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <SectionHead label="01" title="OUR STORY" />

                    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
                        <div className="space-y-5">
                            <p className="text-xl leading-relaxed font-semibold text-foreground italic">
                                We didn't set out to start a brand. It started the way most collections do… one card we couldn't stop looking at.
                            </p>
                            <p className="text-base text-muted-foreground">
                                I can still remember the pull: Umbreon ex SAR from Terastal Festival, the kind of card that you photograph a dozen
                                times and show to your friends.
                            </p>
                            <p className="text-base text-muted-foreground">
                                But somewhere between the sleeve, the toploader, and the binder page, something always felt unfinished. The art was
                                the reason we fell for the card in the first place… and there we were, thinking about what if we extend the card
                                artwork? But in a world full of AI extended arts, we drew.
                            </p>
                            <p className="text-base text-muted-foreground">
                                Every piece from Legacy Vault starts the same way: by hand-drawn. We study the card's original artwork, then keep
                                drawing, past the border, past the frame, until the extended artwork finishes the story.
                            </p>
                            <p className="text-base text-muted-foreground">
                                That's where Legacy Vault stands. At its core, a hand-drawn continuation of the art you already love. Made to
                                complement your cards and give them the spotlight they deserve.
                            </p>
                        </div>

                        <figure className="m-0">
                            <img
                                src="/about/image-case-1.jpg"
                                alt="Beckett Pristine 10 graded Umbreon ex SAR from Terastal Festival in an extended art case"
                                className="w-full rounded-2xl object-cover shadow-lg"
                                loading="lazy"
                            />
                            <figcaption className="mt-4 text-sm text-muted-foreground">
                                Umbreon ex SAR - Terastal Festival. The card that started all of this.
                            </figcaption>
                        </figure>
                    </div>
                </div>
            </section>

            {/* The Craft */}
            <section className="py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <SectionHead label="02" title="THE CRAFT" />

                    <div className="mb-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                        {craftPhotos.map((photo) => (
                            <img
                                key={photo.src}
                                src={photo.src}
                                alt={photo.alt}
                                className="aspect-[4/3] w-full rounded-2xl object-cover shadow-lg"
                                loading="lazy"
                            />
                        ))}
                    </div>

                    <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3">
                        {craftSteps.map((item) => (
                            <div key={item.step} className="border-t border-border pt-5">
                                <span className="block text-xl font-bold text-primary italic">{item.step}</span>
                                <h3 className="mt-3 text-lg font-semibold text-foreground">{item.title}</h3>
                                <p className="mt-3 text-sm text-muted-foreground">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-10 rounded-3xl items-end bg-card p-8 text-card-foreground sm:p-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-16">
                        <div>
                            <h2 className="font-pixel text-2xl leading-relaxed font-bold text-primary md:text-3xl">WHAT WE'RE ALL ABOUT</h2>
                            <div className="mt-8 flex flex-row items-stretch gap-4 sm:gap-6">
                                <img
                                    src="/about/value-1.jpeg"
                                    alt="Collector holding a Legacy Vault extended art case out in the city"
                                    className="aspect-[4/5] min-w-0 flex-1 rounded-2xl object-cover shadow-lg"
                                    loading="lazy"
                                />
                                <img
                                    src="/about/value-2.jpeg"
                                    alt="Collector holding a Legacy Vault extended art case out in the city"
                                    className="aspect-[4/5] min-w-0 flex-1 rounded-2xl object-cover shadow-lg"
                                    loading="lazy"
                                />
                            </div>
                        </div>

                        <ul className="divide-y divide-border">
                            {values.map((value) => (
                                <li key={value.title} className="grid gap-2 py-5 first:pt-0 last:pb-0 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-6">
                                    <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">{value.title}</span>
                                    <p className="text-base text-foreground">{value.description}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* Sign off */}
            <section className="pt-8 pb-24">
                <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
                    <img
                        src="/about/instagram-case-3.jpg"
                        alt="Legacy Vault extended art case for Umbreon ex Special Art Rare"
                        className="mx-auto mb-10 w-full max-w-xs rounded-2xl object-cover shadow-lg"
                        loading="lazy"
                    />
                    <p className="text-lg text-foreground italic">
                        "Whether you're here for a specific extended art or just browsing to feed the same TCG addiction that we have… we welcome you
                        to Legacy Vault."
                    </p>
                    <p className="mt-4 text-base text-muted-foreground">Thank you for trusting us with your collection.</p>
                    <span className="mt-8 block text-xs font-bold tracking-widest text-muted-foreground uppercase">Founder, Legacy Vault</span>
                </div>
            </section>
        </>
    );
}

AboutUs.layout = (page: ReactNode) => <FrontLayout>{page}</FrontLayout>;

export default AboutUs;
