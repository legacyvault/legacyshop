interface EmptyProps {
    title: string;
    description: string;
}

export default function Empty({ title, description }: EmptyProps) {
    return (
        <>
            <div className="relative min-h-screen overflow-hidden bg-background">
                {/* Decorative background elements */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    {/* Pokeball patterns */}
                    <div className="absolute top-10 left-44 h-32 w-32 rounded-full border-4 border-muted-foreground opacity-10">
                        <div className="h-1/2 w-full border-b-2 border-muted-foreground"></div>
                        <div className="absolute top-1/2 left-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 transform rounded-full border-4 border-muted-foreground bg-background"></div>
                    </div>

                    <div className="absolute top-1/4 right-20 h-24 w-24 rounded-full border-3 border-muted-foreground opacity-15">
                        <div className="h-1/2 w-full border-b-2 border-muted-foreground"></div>
                        <div className="absolute top-1/2 left-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 transform rounded-full border-3 border-muted-foreground bg-background"></div>
                    </div>

                    <div className="absolute bottom-1/4 left-1/4 h-20 w-20 rounded-full border-2 border-muted-foreground opacity-8">
                        <div className="h-1/2 w-full border-b border-muted-foreground"></div>
                        <div className="absolute top-1/2 left-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 transform rounded-full border-2 border-muted-foreground bg-background"></div>
                    </div>

                    {/* Lightning bolt patterns */}
                    <div className="absolute top-1/3 right-1/4 rotate-12 transform text-6xl text-muted-foreground opacity-8">⚡</div>
                    <div className="absolute bottom-1/3 left-1/3 -rotate-12 transform text-4xl text-muted-foreground opacity-8">⚡</div>

                    {/* Star/sparkle patterns */}
                    <div className="absolute top-1/5 left-2/3 text-3xl text-muted opacity-10">✦</div>
                    <div className="absolute right-1/3 bottom-1/5 text-2xl text-muted opacity-12">✦</div>
                    <div className="absolute top-2/3 left-1/5 text-xl text-muted opacity-8">✦</div>
                </div>

                {/* Main content container */}
                <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-12">
                    {/* Header section */}
                    <div className="mb-12 text-center">
                        <div className="mb-6">
                            {/* Large Pokeball icon */}
                            <div className="relative mx-auto mb-6 h-24 w-24 rounded-full border-4 border-foreground transition-transform duration-300 hover:scale-110">
                                <div className="h-1/2 w-full rounded-t-full bg-foreground"></div>
                                <div className="h-1/2 w-full rounded-b-full border-t-4 border-foreground bg-background"></div>
                                <div className="absolute top-1/2 left-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 transform rounded-full border-4 border-foreground bg-background">
                                    <div className="absolute top-1/2 left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-foreground"></div>
                                </div>
                            </div>

                            <h1 className="mb-4 text-5xl font-bold tracking-tight text-foreground md:text-6xl">{title}</h1>
                            <p className="mx-auto max-w-2xl text-xl leading-relaxed text-muted-foreground md:text-2xl">{description}</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
