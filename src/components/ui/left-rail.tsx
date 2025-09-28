"use client";

import { Disc, Home, Plus, Search, Users } from "lucide-react";

const railItems = [
  {
    id: "logo",
    icon: Disc,
    label: "Marketing Orchestration",
    isLogo: true,
  },
  {
    id: "new",
    icon: Plus,
    label: "New",
    isLogo: false,
  },
  {
    id: "home",
    icon: Home,
    label: "Home",
    isLogo: false,
  },
  {
    id: "discover",
    icon: Search,
    label: "Discover",
    isLogo: false,
  },
  {
    id: "spaces",
    icon: Users,
    label: "Spaces",
    isLogo: false,
  },
] as const;

export const LeftRail = () => {
  return (
    <div className="fixed top-0 left-0 z-50 flex h-full w-16 flex-col border-border border-r bg-background/80 backdrop-blur-md">
      <div className="flex flex-col gap-2 p-2">
        {railItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              aria-label={item.label}
              className={`group relative flex h-12 w-12 items-center justify-center rounded-lg transition-all duration-200 ease-in-out hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring ${item.isLogo ? "text-primary" : "text-muted-foreground hover:text-foreground"}
              `}
              key={item.id}
              tabIndex={0}
              type="button"
            >
              <Icon
                className={`h-5 w-5 transition-transform group-hover:scale-110 ${
                  item.isLogo ? "animate-pulse" : ""
                }`}
              />

              {/* Tooltip */}
              <div className="absolute left-full z-10 ml-2 hidden group-hover:block">
                <div className="rounded-md border border-border bg-popover px-2 py-1 text-popover-foreground text-sm shadow-md">
                  {item.label}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
