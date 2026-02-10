interface EmptyProps {
    title: string;
    description: string;
}

export default function Empty({ title, description }: EmptyProps) {
    return (
        <>
            <div className="relative min-h-screen overflow-hidden bg-background flex items-center flex-col py-20">
                <div className="relative mx-auto mb-6 h-24 w-24 transition-transform duration-300 hover:scale-110">
                    <img src="/lc-black.png"/>
                </div>

                <h1 className="mb-4 text-5xl font-bold tracking-tight text-foreground md:text-6xl">{title}</h1>
                <p className="mx-auto max-w-2xl text-xl leading-relaxed text-muted-foreground md:text-2xl">{description}</p>
            </div>
        </>
    );
}
