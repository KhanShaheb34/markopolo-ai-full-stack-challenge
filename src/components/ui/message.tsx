"use client";

import { Bot, User } from "lucide-react";
import type { CampaignPlan } from "@/lib/schema/plan";
import { JsonViewer } from "./json-viewer";
import { StatusChips } from "./status-chips";

type StreamingStage =
  | "profiling"
  | "audiences"
  | "channels"
  | "timing"
  | "guardrails";

type MessageProps = {
  type: "user" | "assistant";
  content?: string;
  isStreaming?: boolean;
  currentStage?: StreamingStage | null;
  completedStages?: StreamingStage[];
  partialPlan?: Partial<CampaignPlan>;
  finalPlan?: CampaignPlan | null;
  error?: string | null;
  timestamp?: Date;
};

export const Message = ({
  type,
  content,
  isStreaming = false,
  currentStage = null,
  completedStages = [],
  partialPlan = {},
  finalPlan = null,
  error = null,
  timestamp = new Date(),
}: MessageProps) => {
  return (
    <div
      className={`flex gap-4 ${type === "user" ? "justify-end" : "justify-start"}`}
    >
      {/* Avatar */}
      {type === "assistant" && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Bot className="h-4 w-4" />
        </div>
      )}

      {/* Message Content */}
      <div className={`max-w-3xl ${type === "user" ? "order-first" : ""}`}>
        {/* User Message */}
        {type === "user" && content && (
          <div className="rounded-2xl bg-primary px-4 py-3 text-primary-foreground">
            <p className="text-sm">{content}</p>
            <div className="mt-1 text-primary-foreground/70 text-xs">
              {timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        )}

        {/* Assistant Message */}
        {type === "assistant" && (
          <div className="space-y-4">
            {/* Status Chips - show when streaming, has completed stages, or message is completed */}
            {(isStreaming || completedStages.length > 0 || finalPlan) && (
              <div className="rounded-lg border border-border bg-card/50 p-4">
                <StatusChips
                  completedStages={
                    finalPlan
                      ? [
                          "profiling",
                          "audiences",
                          "channels",
                          "timing",
                          "guardrails",
                        ]
                      : completedStages
                  }
                  currentStage={finalPlan ? null : currentStage}
                  isStreaming={finalPlan ? false : isStreaming}
                />
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="font-medium text-sm">Planning Error</span>
                </div>
                <p className="mt-2 text-red-600 text-sm dark:text-red-300">
                  {error}
                </p>
              </div>
            )}

            {/* JSON Viewer - show when plan is complete */}
            {finalPlan && (
              <JsonViewer data={finalPlan} title="Generated Campaign Plan" />
            )}

            {/* Partial Plan Preview - show during streaming */}
            {isStreaming && Object.keys(partialPlan).length > 0 && (
              <div className="rounded-lg border border-border bg-card/30 p-4">
                <h4 className="mb-3 font-medium text-foreground text-sm">
                  Building Plan...
                </h4>
                <div className="max-h-48 overflow-y-auto rounded-md bg-muted/20 p-3 font-mono text-xs">
                  <pre className="text-muted-foreground">
                    {JSON.stringify(partialPlan, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Timestamp */}
            <div className="text-muted-foreground text-xs">
              {timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        )}
      </div>

      {/* User Avatar */}
      {type === "user" && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
};
