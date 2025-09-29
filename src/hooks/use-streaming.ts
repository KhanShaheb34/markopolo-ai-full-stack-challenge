"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import type { CampaignPlan } from "@/lib/schema/plan";

// Constants
const SSE_DATA_PREFIX_LENGTH = 6; // "data: ".length
const TOTAL_STAGES = 5;
const HTTP_STATUS_TOO_MANY_REQUESTS = 429;
const HTTP_STATUS_SERVER_ERROR = 500;

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
    toast.dismiss("planning-start");
    toast.success("Campaign plan generated successfully!");
    return true;
  }

  if ("error" in data) {
    updateState((prev) => ({
      ...prev,
      error: data.error.message,
      isStreaming: false,
      currentStage: null,
    }));
    toast.dismiss("planning-start");
    toast.error(`Planning error: ${data.error.message}`);
    return true;
  }

  return false;
};

const handleFetchError = (
  error: unknown,
  updateState: React.Dispatch<React.SetStateAction<StreamingState>>
) => {
  toast.dismiss("planning-start");

  if (error instanceof Error && error.name === "AbortError") {
    updateState((prev) => ({
      ...prev,
      isStreaming: false,
      currentStage: null,
      error: "Stream cancelled",
    }));
    toast.info("Campaign planning cancelled");
  } else {
    const errorMessage =
      error instanceof Error ? error.message : "Streaming failed";
    updateState((prev) => ({
      ...prev,
      isStreaming: false,
      currentStage: null,
      error: errorMessage,
    }));
    toast.error(`Planning failed: ${errorMessage}`);
  }
};

// Validation helper to reduce complexity
const validateStreamingInputs = (
  prompt: string,
  selectedSources: string[],
  selectedChannels: string[]
): boolean => {
  if (!prompt.trim()) {
    toast.error("Please enter a campaign description");
    return false;
  }

  if (selectedSources.length === 0) {
    toast.error("Please select at least one data source");
    return false;
  }

  if (selectedChannels.length === 0) {
    toast.error("Please select at least one marketing channel");
    return false;
  }

  return true;
};

// Network helper to reduce complexity
const createStreamRequest = (
  prompt: string,
  selectedSources: string[],
  selectedChannels: string[],
  timezone: string
) => {
  const params = new URLSearchParams({
    prompt,
    sources: selectedSources.join(","),
    channels: selectedChannels.join(","),
    timezone,
  });
  return `/api/stream?${params}`;
};

const validateResponse = (response: Response) => {
  if (!response.ok) {
    const errorMsg = `Server error ${response.status}: ${response.statusText}`;
    if (response.status === HTTP_STATUS_TOO_MANY_REQUESTS) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    if (response.status >= HTTP_STATUS_SERVER_ERROR) {
      throw new Error("Server is temporarily unavailable. Please try again.");
    }
    throw new Error(errorMsg);
  }

  if (!response.body) {
    throw new Error("No response body received from server");
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
      // Validation checks
      if (!validateStreamingInputs(prompt, selectedSources, selectedChannels)) {
        return;
      }

      resetState();
      setState((prev) => ({ ...prev, isStreaming: true, error: null }));
      abortControllerRef.current = new AbortController();

      // Check network connectivity
      if (!navigator.onLine) {
        toast.error("No internet connection. Please check your network.");
        setState((prev) => ({ ...prev, isStreaming: false }));
        return;
      }

      try {
        const streamUrl = createStreamRequest(
          prompt,
          selectedSources,
          selectedChannels,
          timezone
        );
        const response = await fetch(streamUrl, {
          signal: abortControllerRef.current.signal,
        });

        validateResponse(response);
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
