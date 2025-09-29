"use client";

import { Check, Loader2 } from "lucide-react";

type StreamingStage =
  | "profiling"
  | "audiences"
  | "channels"
  | "timing"
  | "guardrails";

type StatusChipsProps = {
  currentStage: StreamingStage | null;
  completedStages: StreamingStage[];
  isStreaming: boolean;
};

const STAGES: Array<{
  id: StreamingStage;
  label: string;
  description: string;
}> = [
  {
    id: "profiling",
    label: "Profiling",
    description: "Analyzing data sources and extracting signals",
  },
  {
    id: "audiences",
    label: "Audience",
    description: "Identifying target segments and sizing",
  },
  {
    id: "channels",
    label: "Channels",
    description: "Mapping channels to audiences",
  },
  {
    id: "timing",
    label: "Timing",
    description: "Optimizing schedule and frequency",
  },
  {
    id: "guardrails",
    label: "Guardrails",
    description: "Applying compliance and safety checks",
  },
];

// Helper functions to reduce complexity
const getChipClassName = (status: string) => {
  if (status === "completed") {
    return "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400";
  }
  if (status === "active") {
    return "animate-pulse border-primary bg-primary/10 text-primary";
  }
  return "border-border bg-muted/50 text-muted-foreground";
};

const getProgressLineClassName = (
  completedStages: StreamingStage[],
  currentStage: StreamingStage | null,
  stageId: StreamingStage
) => {
  if (completedStages.includes(stageId)) {
    return "bg-green-400";
  }
  if (currentStage === stageId) {
    return "bg-primary";
  }
  return "bg-border";
};

const renderStageIcon = (status: string) => {
  if (status === "completed") {
    return <Check className="h-4 w-4" />;
  }
  if (status === "active") {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }
  return <div className="h-4 w-4 rounded-full border-2 border-current" />;
};

export const StatusChips = ({
  currentStage,
  completedStages,
  isStreaming,
}: StatusChipsProps) => {
  const getStageStatus = (stageId: StreamingStage) => {
    if (completedStages.includes(stageId)) {
      return "completed";
    }
    if (currentStage === stageId) {
      return "active";
    }
    return "pending";
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-medium text-foreground text-sm">
          Campaign Planning Progress
        </h3>
        {isStreaming && (
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Loader2 className="h-3 w-3 animate-spin" />
            Generating plan...
          </div>
        )}
      </div>

      {/* Status Chips */}
      <div className="grid grid-cols-5 gap-2">
        {STAGES.map((stage, index) => {
          const status = getStageStatus(stage.id);
          const isLast = index === STAGES.length - 1;

          return (
            <div className="relative" key={stage.id}>
              {/* Chip */}
              <output
                aria-label={`${stage.label} stage - ${status}`}
                className={`group relative flex flex-col rounded-lg border px-3 py-2 text-center transition-all duration-300 ${getChipClassName(status)}`}
              >
                {/* Stage Icon */}
                <div className="mb-1 flex justify-center">
                  {renderStageIcon(status)}
                </div>

                {/* Stage Label */}
                <div className="flex-1 font-medium text-xs">{stage.label}</div>
              </output>

              {/* Progress Line */}
              {!isLast && (
                <div className="-translate-y-1/2 absolute top-1/2 left-full z-0 h-0.5 w-2">
                  <div
                    className={`h-full transition-all duration-500 ${getProgressLineClassName(completedStages, currentStage, stage.id)}`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Current Stage Description */}
      {currentStage && isStreaming && (
        <div className="mt-4 rounded-lg bg-primary/5 p-3 text-center">
          <div className="font-medium text-primary text-sm">
            {STAGES.find((s) => s.id === currentStage)?.label}
          </div>
          <div className="mt-1 text-muted-foreground text-xs">
            {STAGES.find((s) => s.id === currentStage)?.description}
          </div>
        </div>
      )}

      {/* Completion Summary */}
      {!isStreaming && completedStages.length === STAGES.length && (
        <div className="mt-4 rounded-lg bg-green-50 p-3 text-center dark:bg-green-900/20">
          <div className="flex items-center justify-center gap-2 font-medium text-green-700 text-sm dark:text-green-400">
            <Check className="h-4 w-4" />
            Campaign plan ready!
          </div>
          <div className="mt-1 text-green-600 text-xs dark:text-green-500">
            Generated {completedStages.length} planning stages successfully
          </div>
        </div>
      )}
    </div>
  );
};
