"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ChatComposer } from "@/components/ui/chat-composer";
import { LeftRail } from "@/components/ui/left-rail";
import { Message } from "@/components/ui/message";
import { useStreaming } from "@/hooks/use-streaming";
import type { CampaignPlan } from "@/lib/schema/plan";
import {
  addChatSessionAtom,
  chatSessionsAtom,
  currentChatIdAtom,
  deleteChatSessionAtom,
  restoreChatStateAtom,
  selectedChannelsAtom,
  selectedSourcesAtom,
  updateChatSessionAtom,
} from "@/lib/store/atoms";
import {
  createChatSession,
  generateChatId,
  type StoredChatMessage,
} from "@/lib/store/chat-storage";

// Constants
const SCROLL_DELAY_MS = 100;
const SAVE_DELAY_MS = 100;
const COMPLETION_SAVE_DELAY_MS = 500;

type ChatMessage = {
  id: string;
  type: "user" | "assistant";
  content?: string;
  timestamp: Date;
  // Store final results with each assistant message
  finalPlan?: CampaignPlan | null;
  error?: string | null;
  isCompleted?: boolean;
};

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedSources = useAtomValue(selectedSourcesAtom);
  const selectedChannels = useAtomValue(selectedChannelsAtom);
  const [currentChatId, setCurrentChatId] = useAtom(currentChatIdAtom);
  const _chatSessions = useAtomValue(chatSessionsAtom);
  const _addChatSession = useSetAtom(addChatSessionAtom);
  const _updateChatSession = useSetAtom(updateChatSessionAtom);
  const _deleteChatSession = useSetAtom(deleteChatSessionAtom);
  const _restoreChatState = useSetAtom(restoreChatStateAtom);

  const {
    isStreaming,
    currentStage,
    completedStages,
    partialPlan,
    finalPlan,
    error,
    startStreaming,
    resetState,
  } = useStreaming();

  // Auto-scroll to bottom when messages change or streaming updates
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom]);

  // Also scroll when streaming completes
  useEffect(() => {
    if (finalPlan) {
      scrollToBottom();
    }
  }, [finalPlan, scrollToBottom]);

  // Helper functions to get message props
  const getActiveMessageProps = (message: ChatMessage) => ({
    isStreaming,
    currentStage,
    completedStages,
    partialPlan,
    finalPlan: finalPlan || message.finalPlan,
    error: error || message.error,
  });

  const getCompletedMessageProps = (message: ChatMessage) => ({
    isStreaming: false,
    currentStage: null,
    completedStages: [],
    partialPlan: null,
    finalPlan: message.finalPlan,
    error: message.error,
  });

  const getMessageProps = (message: ChatMessage) => {
    if (message.type !== "assistant") {
      return {};
    }

    const isActiveMessage = message.id === activeMessageId;
    return isActiveMessage
      ? getActiveMessageProps(message)
      : getCompletedMessageProps(message);
  };

  // Save chat to localStorage when streaming completes
  const saveChatToStorage = useCallback(() => {
    if (currentChatId && messages.length > 0) {
      const storedMessages: StoredChatMessage[] = messages.map((msg) => ({
        id: msg.id,
        type: msg.type,
        content: msg.content,
        timestamp: msg.timestamp,
        finalPlan: msg.finalPlan,
        error: msg.error,
        isCompleted: msg.isCompleted,
      }));

      const session = createChatSession(
        currentChatId,
        storedMessages,
        selectedSources,
        selectedChannels
      );

      const sessions = _chatSessions;
      const existingIndex = sessions.findIndex((s) => s.id === currentChatId);

      if (existingIndex >= 0) {
        _updateChatSession(session);
      } else {
        _addChatSession(session);
      }
    }
  }, [
    currentChatId,
    messages,
    selectedSources,
    selectedChannels,
    _chatSessions,
    _updateChatSession,
    _addChatSession,
  ]);

  // Update the active message when streaming completes
  useEffect(() => {
    if (activeMessageId && (finalPlan || error) && !isStreaming) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === activeMessageId
            ? { ...msg, finalPlan, error, isCompleted: true }
            : msg
        )
      );
      setActiveMessageId(null);

      // Save chat after completion
      setTimeout(saveChatToStorage, COMPLETION_SAVE_DELAY_MS);
    }
  }, [activeMessageId, finalPlan, error, isStreaming, saveChatToStorage]);

  const handleSendMessage = async (message: string) => {
    // Create new chat if this is the first message or no active chat
    if (!currentChatId) {
      const newChatId = generateChatId();
      setCurrentChatId(newChatId);
    }

    // Reset streaming state for new message
    resetState();

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      content: message,
      timestamp: new Date(),
    };

    const assistantId = `assistant-${Date.now()}`;
    const assistantMessage: ChatMessage = {
      id: assistantId,
      type: "assistant",
      timestamp: new Date(),
      isCompleted: false,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setActiveMessageId(assistantId);

    // Save the initial messages (user message + empty assistant message)
    setTimeout(() => {
      saveChatToStorage();
    }, SAVE_DELAY_MS);

    // Scroll to bottom immediately after adding messages
    setTimeout(scrollToBottom, SCROLL_DELAY_MS);

    // Start streaming campaign plan generation
    await startStreaming(message, selectedSources, selectedChannels);
  };

  // Chat management handlers
  const handleChatSelect = useCallback(
    (chatId: string) => {
      // Save current chat before switching
      saveChatToStorage();

      const session = _chatSessions.find((s) => s.id === chatId);
      if (!session) {
        toast.error("Chat not found");
        return;
      }

      // Restore chat state
      _restoreChatState(session);

      // Convert stored messages back to ChatMessage format
      const chatMessages: ChatMessage[] = session.messages.map((msg) => ({
        id: msg.id,
        type: msg.type,
        content: msg.content,
        timestamp: msg.timestamp,
        finalPlan: msg.finalPlan,
        error: msg.error,
        isCompleted: msg.isCompleted,
      }));

      setMessages(chatMessages);
      setActiveMessageId(null);
      resetState();

      // Scroll to bottom after messages load
      setTimeout(scrollToBottom, SCROLL_DELAY_MS);
    },
    [
      saveChatToStorage,
      _chatSessions,
      _restoreChatState,
      resetState,
      scrollToBottom,
    ]
  );

  const handleChatDelete = useCallback(
    (chatId: string) => {
      const session = _chatSessions.find((s) => s.id === chatId);
      if (!session) {
        return;
      }

      _deleteChatSession(chatId);

      // If deleting current chat, start a new one
      if (currentChatId === chatId) {
        setMessages([]);
        setActiveMessageId(null);
        setCurrentChatId(null);
        resetState();
      }

      toast.success(`Deleted chat: ${session.title}`);
    },
    [
      _chatSessions,
      _deleteChatSession,
      currentChatId,
      setCurrentChatId,
      resetState,
    ]
  );

  const handleNewChat = () => {
    // Save current chat before starting new one
    saveChatToStorage();

    setMessages([]);
    setActiveMessageId(null);
    setCurrentChatId(null);
    resetState();
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <LeftRail
        onChatDelete={handleChatDelete}
        onChatSelect={handleChatSelect}
      />

      {/* Main content area - offset by left rail */}
      <main className="ml-16 min-h-screen">
        {hasMessages ? (
          /* Chat Interface */
          <div className="flex h-screen flex-col">
            {/* Chat Header */}
            <div className="border-border border-b bg-background/80 px-6 py-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-foreground">
                    Campaign Planning
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {selectedSources.length} sources • {selectedChannels.length}{" "}
                    channels
                  </p>
                </div>

                <button
                  className="rounded-md bg-accent px-3 py-1.5 text-accent-foreground text-sm transition-colors hover:bg-accent/80"
                  onClick={handleNewChat}
                  type="button"
                >
                  New Chat
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mx-auto max-w-4xl space-y-6">
                {messages.map((message) => (
                  <Message
                    content={message.content}
                    key={message.id}
                    timestamp={message.timestamp}
                    type={message.type}
                    {...getMessageProps(message)}
                  />
                ))}
                {/* Invisible div for auto-scrolling */}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Chat Input - Fixed at bottom */}
            <div className="border-border border-t bg-background/80 p-6 backdrop-blur-sm">
              <div className="mx-auto max-w-4xl">
                <ChatComposer
                  disabled={isStreaming}
                  onSendMessage={handleSendMessage}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Landing Page */
          <div className="flex min-h-screen flex-col items-center justify-center p-8">
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
                  Plan multi-channel campaigns with AI-powered audience
                  insights, message optimization, and perfect timing.
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
          </div>
        )}
      </main>
    </div>
  );
}
