import type { CampaignPlan } from "@/lib/schema/plan";

// Chat message type for storage
export type StoredChatMessage = {
  id: string;
  type: "user" | "assistant";
  content?: string;
  timestamp: Date;
  finalPlan?: CampaignPlan | null;
  error?: string | null;
  isCompleted?: boolean;
};

// Complete chat session data
export type ChatSession = {
  id: string;
  title: string;
  messages: StoredChatMessage[];
  selectedSources: string[];
  selectedChannels: string[];
  createdAt: Date;
  updatedAt: Date;
};

// Constants
const CHAT_TITLE_MAX_LENGTH = 50;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DAYS_PER_WEEK = 7;
const DAYS_PER_MONTH = 30;
const MILLISECONDS_PER_MINUTE = 60_000;
const MILLISECONDS_PER_HOUR = 3_600_000;
const MILLISECONDS_PER_DAY = 86_400_000;
const RANDOM_STRING_START_INDEX = 2;
const RANDOM_STRING_END_INDEX = 9;
const BASE_36 = 36;

// Generate random chat ID
export const generateChatId = (): string =>
  `chat_${Date.now()}_${Math.random().toString(BASE_36).substring(RANDOM_STRING_START_INDEX, RANDOM_STRING_END_INDEX)}`;

// Get title from first user message
export const getChatTitle = (messages: StoredChatMessage[]): string => {
  const firstUserMessage = messages.find(
    (msg) => msg.type === "user" && msg.content
  );
  if (firstUserMessage?.content) {
    // Truncate to 50 characters and add ellipsis if needed
    return firstUserMessage.content.length > CHAT_TITLE_MAX_LENGTH
      ? `${firstUserMessage.content.substring(0, CHAT_TITLE_MAX_LENGTH)}...`
      : firstUserMessage.content;
  }
  return "New Chat";
};

// Create a chat session from current state
export const createChatSession = (
  id: string,
  messages: StoredChatMessage[],
  selectedSources: string[],
  selectedChannels: string[]
): ChatSession => {
  const now = new Date();
  return {
    id,
    title: getChatTitle(messages),
    messages,
    selectedSources,
    selectedChannels,
    createdAt: now,
    updatedAt: now,
  };
};

// Format relative time for chat display
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / MILLISECONDS_PER_MINUTE);
  const diffHours = Math.floor(diffMs / MILLISECONDS_PER_HOUR);
  const diffDays = Math.floor(diffMs / MILLISECONDS_PER_DAY);

  if (diffMins < 1) {
    return "Just now";
  }
  if (diffMins < MINUTES_PER_HOUR) {
    return `${diffMins}m ago`;
  }
  if (diffHours < HOURS_PER_DAY) {
    return `${diffHours}h ago`;
  }
  if (diffDays < DAYS_PER_WEEK) {
    return `${diffDays}d ago`;
  }
  if (diffDays < DAYS_PER_MONTH) {
    return `${Math.floor(diffDays / DAYS_PER_WEEK)}w ago`;
  }
  return date.toLocaleDateString();
};
