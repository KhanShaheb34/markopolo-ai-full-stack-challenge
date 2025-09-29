"use client";

import { useAtomValue, useSetAtom } from "jotai";
import {
  Clock,
  Facebook,
  Globe,
  Mail,
  MessageCircle,
  Mic,
  Send,
  ShoppingBag,
  Smartphone,
  Star,
  Target,
  Trash2,
  X,
} from "lucide-react";
import {
  chatSessionsAtom,
  selectedChannelsAtom,
  selectedSourcesAtom,
  toggleChannelAtom,
  toggleSourceAtom,
} from "@/lib/store/atoms";
import { formatRelativeTime } from "@/lib/store/chat-storage";

// Data Sources from spec
const dataSources = [
  {
    id: "website-pixel",
    name: "Website Pixel",
    description: "GTM/FB Pixel/Google Ads Tag",
    icon: Globe,
    lastSync: "2 hours ago",
    recordCount: 1247,
  },
  {
    id: "shopify",
    name: "Shopify",
    description: "Orders & Customer Data",
    icon: ShoppingBag,
    lastSync: "5 minutes ago",
    recordCount: 892,
  },
  {
    id: "facebook-page",
    name: "Facebook Page",
    description: "Posts & Engagement",
    icon: Facebook,
    lastSync: "Never",
    recordCount: 0,
  },
  {
    id: "reviews",
    name: "Review Sites",
    description: "Ratings & Feedback",
    icon: Star,
    lastSync: "Never",
    recordCount: 0,
  },
  {
    id: "twitter",
    name: "Twitter/X Page",
    description: "Followers & Engagement",
    icon: X,
    lastSync: "1 hour ago",
    recordCount: 456,
  },
] as const;

// Channels from spec
const channels = [
  {
    id: "email",
    name: "Email",
    icon: Mail,
    selected: true,
  },
  {
    id: "sms",
    name: "SMS",
    icon: Smartphone,
    selected: true,
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: MessageCircle,
    selected: true,
  },
  {
    id: "push",
    name: "Push",
    icon: Send,
    selected: false,
  },
  {
    id: "voice",
    name: "Voice",
    icon: Mic,
    selected: false,
  },
  {
    id: "messenger",
    name: "Messenger",
    icon: MessageCircle,
    selected: false,
  },
  {
    id: "ads",
    name: "Ads",
    icon: Target,
    selected: true,
  },
] as const;

// Requirements from spec
const MIN_DATA_SOURCES = 3;
const MIN_CHANNELS = 4;
const TOTAL_DATA_SOURCES = 5;
const TOTAL_CHANNELS = 7;

type HoverRailProps = {
  isVisible: boolean;
  activeSection: "sources" | "channels" | "history" | null;
  onChatSelect?: (chatId: string) => void;
  onChatDelete?: (chatId: string) => void;
};

// Helper functions to reduce complexity
const getHeaderTitle = (
  activeSection: "sources" | "channels" | "history" | null
): string => {
  switch (activeSection) {
    case "sources":
      return "Data Sources";
    case "channels":
      return "Channels";
    case "history":
      return "Chat History";
    default:
      return "";
  }
};

const getHeaderDescription = (
  activeSection: "sources" | "channels" | "history" | null,
  sourcesCount: number,
  channelsCount: number,
  chatsCount: number
): string => {
  switch (activeSection) {
    case "sources":
      return `Select 3+ sources to continue (${sourcesCount}/${TOTAL_DATA_SOURCES} selected)`;
    case "channels":
      return `Select 4+ channels to continue (${channelsCount}/${TOTAL_CHANNELS} selected)`;
    case "history":
      return `${chatsCount} saved conversations`;
    default:
      return "";
  }
};

export const HoverRail = ({
  isVisible,
  activeSection,
  onChatSelect,
  onChatDelete,
}: HoverRailProps) => {
  const selectedSources = useAtomValue(selectedSourcesAtom);
  const selectedChannels = useAtomValue(selectedChannelsAtom);
  const chatSessions = useAtomValue(chatSessionsAtom);
  const toggleSource = useSetAtom(toggleSourceAtom);
  const toggleChannel = useSetAtom(toggleChannelAtom);
  return (
    <div
      className={`fixed top-0 left-16 z-40 h-full w-80 transform border-border border-r bg-background/95 backdrop-blur-md transition-transform duration-300 ease-in-out ${
        isVisible ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header */}
        <div className="border-border border-b p-4">
          <h2 className="font-semibold text-foreground text-lg">
            {getHeaderTitle(activeSection)}
          </h2>
          <p className="text-muted-foreground text-sm">
            {getHeaderDescription(
              activeSection,
              selectedSources.length,
              selectedChannels.length,
              chatSessions.length
            )}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Data Sources Section */}
          {activeSection === "sources" && (
            <div className="space-y-2 p-4">
              {dataSources.map((source) => {
                const Icon = source.icon;
                const isSelected = selectedSources.includes(source.id);

                return (
                  <button
                    aria-label={`Toggle ${source.name} data source`}
                    className={`group w-full rounded-lg border p-3 text-left transition-all hover:shadow-md ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:bg-accent"
                    }`}
                    key={source.id}
                    onClick={() => toggleSource(source.id)}
                    type="button"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={
                          "flex h-10 w-10 items-center justify-center rounded-lg"
                        }
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-foreground text-sm">
                            {source.name}
                          </h4>
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {source.description}
                        </p>
                        <div className="mt-1 flex justify-between gap-4 text-muted-foreground text-xs">
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {source.lastSync}
                          </span>
                          <span>
                            {source.recordCount.toLocaleString()} records
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Channels Section */}
          {activeSection === "channels" && (
            <div className="grid grid-cols-2 gap-2 p-4">
              {channels.map((channel) => {
                const Icon = channel.icon;
                const isSelected = selectedChannels.includes(channel.id);

                return (
                  <button
                    aria-label={`Toggle ${channel.name} channel`}
                    className={`group flex flex-col items-center gap-2 rounded-lg border p-4 transition-all hover:shadow-md ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:bg-accent"
                    }`}
                    key={channel.id}
                    onClick={() => toggleChannel(channel.id)}
                    type="button"
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground group-hover:bg-accent-foreground/10"
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="font-medium text-foreground text-sm">
                      {channel.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Chat History Section */}
          {activeSection === "history" && (
            <div className="space-y-2 p-4">
              {chatSessions.length === 0 ? (
                <div className="rounded-lg border border-border border-dashed p-8 text-center">
                  <Clock className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-muted-foreground text-sm">
                    No chat history yet
                  </p>
                  <p className="mt-1 text-muted-foreground text-xs">
                    Start a conversation to see it here
                  </p>
                </div>
              ) : (
                chatSessions.map((session) => (
                  <div
                    className="group rounded-lg border border-border bg-card p-3 transition-all hover:bg-accent hover:shadow-md"
                    key={session.id}
                  >
                    <div className="flex items-start justify-between">
                      <button
                        aria-label={`Open chat: ${session.title}`}
                        className="min-w-0 flex-1 text-left"
                        onClick={() => onChatSelect?.(session.id)}
                        type="button"
                      >
                        <h4 className="line-clamp-2 font-medium text-foreground text-sm">
                          {session.title}
                        </h4>
                        <div className="mt-1 flex items-center gap-2 text-muted-foreground text-xs">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(session.updatedAt)}
                        </div>
                        <div className="mt-1 text-muted-foreground text-xs">
                          {session.messages.length} messages •{" "}
                          {session.selectedSources.length} sources •{" "}
                          {session.selectedChannels.length} channels
                        </div>
                      </button>

                      <button
                        aria-label={`Delete chat: ${session.title}`}
                        className="rounded p-1 text-muted-foreground opacity-0 transition-all hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          onChatDelete?.(session.id);
                        }}
                        type="button"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer Summary */}
        <div className="border-border border-t bg-background/95 p-4">
          <div className="space-y-2 text-center">
            {activeSection === "sources" && (
              <>
                <div className="text-muted-foreground text-sm">
                  Sources:{" "}
                  {selectedSources.length >= MIN_DATA_SOURCES ? "✓" : "✗"}
                </div>
                <div className="text-muted-foreground text-xs">
                  Need {Math.max(0, MIN_DATA_SOURCES - selectedSources.length)}{" "}
                  more sources
                </div>
              </>
            )}
            {activeSection === "channels" && (
              <>
                <div className="text-muted-foreground text-sm">
                  Channels:{" "}
                  {selectedChannels.length >= MIN_CHANNELS ? "✓" : "✗"}
                </div>
                <div className="text-muted-foreground text-xs">
                  Need {Math.max(0, MIN_CHANNELS - selectedChannels.length)}{" "}
                  more channels
                </div>
              </>
            )}
            {activeSection === "history" && (
              <div className="text-muted-foreground text-sm">
                Total: {chatSessions.length} conversations
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
