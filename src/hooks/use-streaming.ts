"use client";

import { useCallback, useRef, useState } from "react";
import type { CampaignPlan } from "@/lib/schema/plan";

// Constants
const SSE_DATA_PREFIX_LENGTH = 6; // "data: ".length
const TOTAL_STAGES = 5;

type StreamingStage =
  | "profiling"
  | "audiences"
  | "channels"
  | "timing"
  | "guardrails";

type StreamingState = {
  isStreaming: boolean;
  currentStage: StreamingStage | null;
  completedStages: StreamingStage[];
  partialPlan: Partial<CampaignPlan>;
  finalPlan: CampaignPlan | null;
  error: string | null;
};

type StreamResponse =
  | { status: { stage: StreamingStage } }
  | { partial: Partial<CampaignPlan> }
  | { final: CampaignPlan }
  | { error: { message: string } };

// Extract complex logic to reduce cognitive complexity
const processStreamData = (
  data: StreamResponse,
  updateState: React.Dispatch<React.SetStateAction<StreamingState>>
): boolean => {
  if ("status" in data) {
    updateState((prev) => ({
      ...prev,
      currentStage: data.status.stage,
      completedStages: prev.currentStage
        ? [...prev.completedStages, prev.currentStage]
        : prev.completedStages,
    }));
    return false;
  }

  if ("partial" in data) {
    updateState((prev) => ({
      ...prev,
      partialPlan: { ...prev.partialPlan, ...data.partial },
    }));
    return false;
  }

  if ("final" in data) {
    updateState((prev) => ({
      ...prev,
      finalPlan: data.final,
      isStreaming: false,
      currentStage: null,
      completedStages: [
        ...prev.completedStages,
        ...(prev.currentStage ? [prev.currentStage] : []),
      ],
    }));
    return true;
  }

  if ("error" in data) {
    updateState((prev) => ({
      ...prev,
      error: data.error.message,
      isStreaming: false,
      currentStage: null,
    }));
    return true;
  }

  return false;
};

const handleFetchError = (
  error: unknown,
  updateState: React.Dispatch<React.SetStateAction<StreamingState>>
) => {
  if (error instanceof Error && error.name === "AbortError") {
    updateState((prev) => ({
      ...prev,
      isStreaming: false,
      currentStage: null,
      error: "Stream cancelled",
    }));
  } else {
    updateState((prev) => ({
      ...prev,
      isStreaming: false,
      currentStage: null,
      error: error instanceof Error ? error.message : "Streaming failed",
    }));
  }
};

export const useStreaming = () => {
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    currentStage: null,
    completedStages: [],
    partialPlan: {},
    finalPlan: null,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const resetState = useCallback(() => {
    setState({
      isStreaming: false,
      currentStage: null,
      completedStages: [],
      partialPlan: {},
      finalPlan: null,
      error: null,
    });
  }, []);

  // Extract line processing to reduce complexity
  const processSseLine = useCallback(
    (
      line: string,
      updateState: React.Dispatch<React.SetStateAction<StreamingState>>
    ): boolean => {
      if (!line.startsWith("data: ")) {
        return false;
      }

      try {
        const data: StreamResponse = JSON.parse(
          line.slice(SSE_DATA_PREFIX_LENGTH)
        );
        return processStreamData(data, updateState);
      } catch {
        return false;
      }
    },
    []
  );

  const processSseStream = useCallback(
    async (
      response: Response,
      updateState: React.Dispatch<React.SetStateAction<StreamingState>>
    ) => {
      const reader = response.body?.getReader();
      if (!reader) {
        return;
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          const shouldStop = processSseLine(line, updateState);
          if (shouldStop) {
            return;
          }
        }
      }
    },
    [processSseLine]
  );

  const startStreaming = useCallback(
    async (
      prompt: string,
      selectedSources: string[],
      selectedChannels: string[],
      timezone = "Asia/Dhaka"
    ) => {
      resetState();
      setState((prev) => ({ ...prev, isStreaming: true, error: null }));
      abortControllerRef.current = new AbortController();

      try {
        const params = new URLSearchParams({
          prompt,
          sources: selectedSources.join(","),
          channels: selectedChannels.join(","),
          timezone,
        });

        const response = await fetch(`/api/stream?${params}`, {
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error("No response body received");
        }

        await processSseStream(response, setState);
      } catch (error) {
        handleFetchError(error, setState);
      }
    },
    [resetState, processSseStream]
  );

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState((prev) => ({
      ...prev,
      isStreaming: false,
      currentStage: null,
      error: "Stream cancelled by user",
    }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    isStreaming: state.isStreaming,
    currentStage: state.currentStage,
    completedStages: state.completedStages,
    partialPlan: state.partialPlan,
    finalPlan: state.finalPlan,
    error: state.error,

    // Actions
    startStreaming,
    cancelStream,
    resetState,
    clearError,

    // Computed
    isComplete: state.finalPlan !== null,
    progress: state.completedStages.length / TOTAL_STAGES,
  };
};
