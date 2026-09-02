import Seo from '@/components/seo';
import { Button } from '@/components/ui/button';
import FrontLayout from '@/layouts/front/front-layout';
import { Link } from '@inertiajs/react';
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
        src: '/about/craft-drawing-0.png',
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
            <Seo
                title="About Us"
                description="How Legacy Vault makes Extended Art: studying the original card art, extending it stroke by stroke by hand, then quality-checking every piece against a real card."
            />

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
                            src="/about/hero.jpg"
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
                                It all started in late 2024. A friend came to me with an idea.. he wanted to display his card collection, but not the way everyone else does. That sent me down a rabbit hole online, where I stumbled on the concept of "extended art." The more I looked into it, the more one question stuck with me: why not build this ourselves, but do it differently from every other extended art brand out there? by making it fully hand-drawn by real illustrators?
                            </p>
                            <p className="text-base text-muted-foreground">
                                So I called up a friend who does exactly that. An illustrator, one of the best I know, someone I'd worked with before who can move between art styles effortlessly. He'd just graduated from one of Indonesia's top universities and asked if I needed his talent. That's where it began. A few meetings, a lot of trial and error, and some test runs on popular Pokémon cards later.. Legacy Vault officially launched in January 2025.
                            </p>
                            <p className="text-base text-muted-foreground">
                                It wasn't an easy start. Our first product line was Acrylic Cases, with three variants. A few months in, after listening to customer feedback and digging into what would actually be convenient, easy to produce, and effortless for any collector to use, we landed on what we sell today, worldwide: the extended art print.
                            </p>
                            <p className="text-base text-muted-foreground">
                                That print became our best-seller, and demand didn't stay local. Word spread from collector to collector, and soon we had friends and customers from Singapore, Thailand, Hong Kong, the US, Italy, Belgium, Korea, Japan, and more, all wanting a piece of what we built.. And that's really just the beginning, our goal now is to keep expanding globally, so Legacy Vault can reach collectors everywhere and add something beautiful to their collections.
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
                        src="/about/sign-off.jpg"
                        alt="Legacy Vault extended art case for Umbreon ex Special Art Rare"
                        className="mx-auto mb-10 w-full max-w-xs rounded-2xl object-cover shadow-lg"
                        loading="lazy"
                    />
                    <p className="text-lg text-foreground italic">
                        "A collection hidden in storage is a story no one gets to see.. Legacy Vault is here to help you display yours the way it was always meant to be seen."
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
