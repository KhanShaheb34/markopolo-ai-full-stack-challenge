"use client";

import { useAtomValue } from "jotai";
import { ArrowUp, Globe, Mic, Paperclip } from "lucide-react";
import { useState } from "react";
import {
  selectedChannelsCountAtom,
  selectedSourcesCountAtom,
} from "@/lib/store/atoms";

type ChatComposerProps = {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
};

const MIN_SOURCES = 3;
const MIN_CHANNELS = 4;

export const ChatComposer = ({
  onSendMessage,
  disabled = false,
}: ChatComposerProps) => {
  const selectedSourcesCount = useAtomValue(selectedSourcesCountAtom);
  const selectedChannelsCount = useAtomValue(selectedChannelsCountAtom);
  const [message, setMessage] = useState("");

  const hasMinimumRequirements =
    selectedSourcesCount >= MIN_SOURCES &&
    selectedChannelsCount >= MIN_CHANNELS;
  const isDisabled =
    disabled || !hasMinimumRequirements || message.trim().length === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDisabled && message.trim()) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const getDisabledReason = () => {
    if (
      selectedSourcesCount < MIN_SOURCES &&
      selectedChannelsCount < MIN_CHANNELS
    ) {
      return `Connect ${MIN_SOURCES - selectedSourcesCount} more sources and ${MIN_CHANNELS - selectedChannelsCount} more channels to start planning`;
    }
    if (selectedSourcesCount < MIN_SOURCES) {
      return `Connect ${MIN_SOURCES - selectedSourcesCount} more data sources to start planning`;
    }
    if (selectedChannelsCount < MIN_CHANNELS) {
      return `Select ${MIN_CHANNELS - selectedChannelsCount} more channels to start planning`;
    }
    if (message.trim().length === 0) {
      return "Enter your campaign planning request";
    }
    return "";
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Requirements Status Bar */}
      <div className="mb-4 flex items-center justify-center gap-6 text-sm">
        <div
          className={`flex items-center gap-2 ${selectedSourcesCount >= MIN_SOURCES ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}
        >
          <div
            className={`h-2 w-2 rounded-full ${selectedSourcesCount >= MIN_SOURCES ? "bg-green-500" : "bg-muted-foreground"}`}
          />
          Data Sources: {selectedSourcesCount}/{MIN_SOURCES}+
        </div>
        <div
          className={`flex items-center gap-2 ${selectedChannelsCount >= MIN_CHANNELS ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}
        >
          <div
            className={`h-2 w-2 rounded-full ${selectedChannelsCount >= MIN_CHANNELS ? "bg-green-500" : "bg-muted-foreground"}`}
          />
          Channels: {selectedChannelsCount}/{MIN_CHANNELS}+
        </div>
      </div>

      {/* Chat Composer */}
      <form className="relative" onSubmit={handleSubmit}>
        <div className="group relative rounded-2xl border border-border bg-card/50 backdrop-blur-sm transition-all focus-within:border-primary focus-within:bg-card/80 hover:bg-card/80">
          {/* Input Area */}
          <div className="flex items-end gap-3 p-4">
            {/* Text Input */}
            <div className="flex-1">
              <textarea
                className="w-full resize-none border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
                onChange={(e) => setMessage(e.target.value)}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "24px";
                  target.style.height = `${target.scrollHeight}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything. Type @ for mentions and / for shortcuts."
                rows={1}
                style={{
                  minHeight: "24px",
                  height: "auto",
                  maxHeight: "120px",
                }}
                value={message}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Mock Buttons */}
              <button
                aria-label="Add link or reference"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                disabled={isDisabled}
                type="button"
              >
                <Globe className="h-4 w-4" />
              </button>

              <button
                aria-label="Attach file"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                disabled={isDisabled}
                type="button"
              >
                <Paperclip className="h-4 w-4" />
              </button>

              <button
                aria-label="Voice input"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                disabled={isDisabled}
                type="button"
              >
                <Mic className="h-4 w-4" />
              </button>

              {/* Send Button */}
              <div className="group/send relative">
                <button
                  aria-label={isDisabled ? getDisabledReason() : "Send message"}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                    isDisabled
                      ? "cursor-not-allowed bg-muted text-muted-foreground"
                      : "bg-primary text-primary-foreground hover:scale-105 hover:bg-primary/90"
                  }`}
                  disabled={isDisabled}
                  type="submit"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>

                {/* Tooltip for disabled state */}
                {isDisabled && getDisabledReason() && (
                  <div className="absolute right-0 bottom-full z-10 mb-2 hidden group-hover/send:block">
                    <div className="max-w-xs rounded-md border border-border bg-popover px-3 py-2 text-popover-foreground text-sm shadow-md">
                      {getDisabledReason()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Helper Text */}
        <div className="mt-2 text-center text-muted-foreground text-xs">
          {hasMinimumRequirements
            ? "Press Enter to send, Shift+Enter for new line"
            : "Configure sources and channels above to start planning"}
        </div>
      </form>
    </div>
  );
};
