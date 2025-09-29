"use client";

import { useAtomValue, useSetAtom } from "jotai";
import {
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
  X,
} from "lucide-react";
import {
  selectedChannelsAtom,
  selectedSourcesAtom,
  toggleChannelAtom,
  toggleSourceAtom,
} from "@/lib/store/atoms";

// Data Sources from spec
const dataSources = [
  {
    id: "website-pixel",
    name: "Website Pixel",
    description: "GTM/FB Pixel/Google Ads Tag",
    icon: Globe,
    connected: true,
    lastSync: "2 hours ago",
    recordCount: 1247,
  },
  {
    id: "shopify",
    name: "Shopify",
    description: "Orders & Customer Data",
    icon: ShoppingBag,
    connected: true,
    lastSync: "5 minutes ago",
    recordCount: 892,
  },
  {
    id: "facebook-page",
    name: "Facebook Page",
    description: "Posts & Engagement",
    icon: Facebook,
    connected: false,
    lastSync: "Never",
    recordCount: 0,
  },
  {
    id: "reviews",
    name: "Review Sites",
    description: "Ratings & Feedback",
    icon: Star,
    connected: false,
    lastSync: "Never",
    recordCount: 0,
  },
  {
    id: "twitter",
    name: "Twitter/X Page",
    description: "Followers & Engagement",
    icon: X,
    connected: true,
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

type HoverRailProps = {
  isVisible: boolean;
  activeSection: "sources" | "channels" | null;
};

export const HoverRail = ({ isVisible, activeSection }: HoverRailProps) => {
  const selectedSources = useAtomValue(selectedSourcesAtom);
  const selectedChannels = useAtomValue(selectedChannelsAtom);
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
            {activeSection === "sources" ? "Data Sources" : "Channels"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {activeSection === "sources"
              ? `Select 3+ sources to continue (${selectedSources.length}/5 selected)`
              : `Select 4+ channels to continue (${selectedChannels.length}/7 selected)`}
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
                const isConnected = source.connected;

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
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          isConnected
                            ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-foreground text-sm">
                            {source.name}
                          </h4>
                          <span
                            className={`rounded-full px-2 py-1 text-xs ${
                              isConnected
                                ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {isConnected ? "Connected" : "Not Connected"}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {source.description}
                        </p>
                        {isConnected && (
                          <div className="mt-1 flex gap-4 text-muted-foreground text-xs">
                            <span>Last sync: {source.lastSync}</span>
                            <span>
                              {source.recordCount.toLocaleString()} records
                            </span>
                          </div>
                        )}
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
          </div>
        </div>
      </div>
    </div>
  );
};
