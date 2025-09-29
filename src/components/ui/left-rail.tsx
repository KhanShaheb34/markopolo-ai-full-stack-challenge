"use client";

import { Database, Disc, MessageSquare, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { HoverRail } from "./hover-rail";
import { ThemeSwitcher } from "./theme-switcher";

const railItems = [
  {
    id: "logo",
    icon: Disc,
    label: "Marketing Orchestration",
    isLogo: true,
    hasHover: false,
  },
  {
    id: "history",
    icon: MessageSquare,
    label: "Chat History",
    isLogo: false,
    hasHover: true,
    hoverType: "history" as const,
  },
  {
    id: "sources",
    icon: Database,
    label: "Data Sources",
    isLogo: false,
    hasHover: true,
    hoverType: "sources" as const,
  },
  {
    id: "channels",
    icon: Send,
    label: "Channels",
    isLogo: false,
    hasHover: true,
    hoverType: "channels" as const,
  },
] as const;

type HoverType = "sources" | "channels" | "history" | null;

// Delay before hiding hover rail to allow smooth mouse movement
const HOVER_HIDE_DELAY = 200;

type LeftRailProps = {
  onChatSelect?: (chatId: string) => void;
  onChatDelete?: (chatId: string) => void;
};

export const LeftRail = ({ onChatSelect, onChatDelete }: LeftRailProps) => {
  const [activeHoverType, setActiveHoverType] = useState<HoverType>(null);
  const [hideTimeout, setHideTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleItemMouseEnter = (hoverType: HoverType) => {
    // Clear any pending hide timeout
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }

    if (hoverType) {
      setActiveHoverType(hoverType);
    }
  };

  const handleItemMouseLeave = () => {
    // Add a delay before hiding to allow mouse to reach hover rail
    const timeout = setTimeout(() => {
      setActiveHoverType(null);
    }, HOVER_HIDE_DELAY);
    setHideTimeout(timeout);
  };

  const handleHoverRailMouseEnter = () => {
    // Clear any pending hide timeout when mouse enters hover rail
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }
  };

  const handleHoverRailMouseLeave = () => {
    setActiveHoverType(null);
    // Clear timeout if any
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }
  };

  // Cleanup timeout on unmount
  useEffect(
    () => () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
    },
    [hideTimeout]
  );

  return (
    <>
      <nav className="fixed top-0 left-0 z-50 flex h-full w-16 flex-col border-border border-r bg-background/80 backdrop-blur-md">
        <div className="flex flex-1 flex-col gap-2 p-2">
          {railItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                aria-label={item.label}
                className={`group relative flex h-12 w-12 items-center justify-center rounded-lg transition-all duration-200 ease-in-out hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring ${item.isLogo ? "text-primary" : "text-muted-foreground hover:text-foreground"}
                `}
                key={item.id}
                onMouseEnter={() =>
                  handleItemMouseEnter(item.hasHover ? item.hoverType : null)
                }
                onMouseLeave={item.hasHover ? handleItemMouseLeave : undefined}
                tabIndex={0}
                title={item.label}
                type="button"
              >
                <Icon
                  className={`h-5 w-5 transition-transform group-hover:scale-110 ${
                    item.isLogo ? "animate-pulse" : ""
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Theme Switcher at bottom */}
        <div className="p-2">
          <ThemeSwitcher />
        </div>
      </nav>

      {/* Bridge area to prevent hover loss when moving to hover rail */}
      {activeHoverType && (
        <div
          aria-hidden
          className="fixed top-0 left-16 z-30 h-full w-4"
          onMouseEnter={handleHoverRailMouseEnter}
          onMouseLeave={handleHoverRailMouseLeave}
          role="presentation"
        />
      )}

      {/* Hover Rail */}
      <aside
        aria-hidden
        onMouseEnter={handleHoverRailMouseEnter}
        onMouseLeave={handleHoverRailMouseLeave}
        role="presentation"
      >
        <HoverRail
          activeSection={activeHoverType}
          isVisible={activeHoverType !== null}
          onChatDelete={onChatDelete}
          onChatSelect={onChatSelect}
        />
      </aside>
    </>
  );
};
