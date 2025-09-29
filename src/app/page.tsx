"use client";

import { ChatComposer } from "@/components/ui/chat-composer";
import { LeftRail } from "@/components/ui/left-rail";

export default function Home() {
  const handleSendMessage = (message: string) => {
    // TODO: Implement streaming API call
    // Will be connected to the streaming endpoint in a later todo
    return message; // Return for future use
  };

  return (
    <div className="min-h-screen bg-background">
      <LeftRail />

      {/* Main content area - offset by left rail */}
      <main className="ml-16 flex min-h-screen flex-col items-center justify-center p-8">
        <div className="w-full max-w-4xl space-y-12">
          {/* Hero Text - Perplexity style */}
          <div className="space-y-4 text-center">
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

          {/* Chat Composer */}
          <ChatComposer onSendMessage={handleSendMessage} />

          {/* Instructions */}
          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              💡 Hover over <strong>Data Sources</strong> or{" "}
              <strong>Channels</strong> icons on the left to configure your
              campaign setup
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
