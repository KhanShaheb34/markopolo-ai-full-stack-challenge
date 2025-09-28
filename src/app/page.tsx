import { LeftRail } from "@/components/ui/left-rail";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <LeftRail />

      {/* Main content area - offset by left rail */}
      <main className="ml-16 flex min-h-screen flex-col items-center justify-center p-8">
        <div className="w-full max-w-2xl space-y-8 text-center">
          {/* Hero Text - Perplexity style */}
          <div className="space-y-4">
            <h1 className="font-bold text-4xl text-foreground tracking-tight sm:text-6xl">
              Marketing
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {" "}
                Orchestration
              </span>
            </h1>
            <p className="mx-auto max-w-lg text-lg text-muted-foreground">
              Plan multi-channel campaigns with AI-powered audience insights,
              message optimization, and perfect timing.
            </p>
          </div>

          {/* Placeholder for chat composer - will be added in next todo */}
          <div className="mx-auto w-full max-w-xl">
            <div className="rounded-xl border border-border bg-card/50 p-6 backdrop-blur-sm">
              <div className="text-muted-foreground text-sm">
                Chat composer will be added next...
              </div>
              <div className="mt-4 text-muted-foreground/60 text-xs">
                Connect 3+ data sources • Select 4+ channels • Ask anything
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
