"use client";

import { ChevronDown, ChevronRight, Copy, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { CampaignPlan } from "@/lib/schema/plan";

type JsonViewerProps = {
  data: CampaignPlan | null;
  title?: string;
  className?: string;
};

type CollapsedState = Record<string, boolean>;

export const JsonViewer = ({
  data,
  title = "Campaign Plan",
  className = "",
}: JsonViewerProps) => {
  const [collapsed, setCollapsed] = useState<CollapsedState>({});

  if (!data) {
    return (
      <div
        className={`rounded-lg border border-border bg-muted/30 p-8 text-center ${className}`}
      >
        <div className="text-muted-foreground text-sm">
          No campaign plan generated yet
        </div>
        <div className="mt-2 text-muted-foreground text-xs">
          Send a message to generate your campaign plan
        </div>
      </div>
    );
  }

  const toggleCollapsed = (key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      toast.success("Campaign plan copied to clipboard!");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleDownload = () => {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `campaign-plan-${data.campaignId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Campaign plan downloaded successfully!");
    } catch {
      toast.error("Failed to download campaign plan");
    }
  };

  return (
    <div
      className={`w-full rounded-lg border border-border bg-card ${className}`}
    >
      {/* Header */}
      <div className="border-border border-b bg-muted/30 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground text-sm">{title}</h3>
            <p className="text-muted-foreground text-xs">
              Campaign ID: {data.campaignId}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              aria-label="Copy JSON to clipboard"
              className="flex items-center gap-2 rounded-md bg-background px-3 py-1.5 text-foreground text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={handleCopy}
              type="button"
            >
              <Copy className="h-3 w-3" />
              Copy
            </button>

            <button
              aria-label="Download JSON file"
              className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-primary-foreground text-xs transition-colors hover:bg-primary/90"
              onClick={handleDownload}
              type="button"
            >
              <Download className="h-3 w-3" />
              Download
            </button>
          </div>
        </div>
      </div>

      {/* JSON Content */}
      <div className="max-h-96 overflow-y-auto p-4">
        <div className="rounded-md bg-muted/20 p-3 font-mono text-sm">
          <JsonObject
            collapsed={collapsed}
            level={0}
            obj={data}
            onToggleCollapsed={toggleCollapsed}
          />
        </div>
      </div>
    </div>
  );
};

// JSON object renderer component
type JsonObjectProps = {
  obj: unknown;
  level: number;
  collapsed: CollapsedState;
  onToggleCollapsed: (key: string) => void;
  keyName?: string;
};

// Extract JSON type renderers to reduce complexity
const renderPrimitive = (obj: unknown) => {
  if (obj === null) {
    return <span className="text-red-500">null</span>;
  }

  if (typeof obj === "string") {
    return <span className="text-green-600 dark:text-green-400">"{obj}"</span>;
  }

  if (typeof obj === "number") {
    return <span className="text-blue-600 dark:text-blue-400">{obj}</span>;
  }

  if (typeof obj === "boolean") {
    return (
      <span className="text-purple-600 dark:text-purple-400">
        {obj.toString()}
      </span>
    );
  }

  return <span className="text-muted-foreground">Unknown</span>;
};

type RenderContext = {
  keyPath: string;
  isCollapsed: boolean;
  indent: string;
  collapsed: CollapsedState;
  onToggleCollapsed: (key: string) => void;
  level: number;
};

const renderJsonArray = (obj: unknown[], context: RenderContext) => {
  if (obj.length === 0) {
    return <span className="text-muted-foreground">[]</span>;
  }

  return (
    <div>
      <button
        aria-label={`${context.isCollapsed ? "Expand" : "Collapse"} array`}
        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
        onClick={() => context.onToggleCollapsed(context.keyPath)}
        type="button"
      >
        {context.isCollapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
        <span className="text-muted-foreground">[</span>
        {context.isCollapsed && (
          <span className="text-muted-foreground text-xs">
            ... {obj.length} items
          </span>
        )}
      </button>

      {!context.isCollapsed && (
        <div className="ml-4">
          {obj.map((item, index) => (
            <div className="my-1" key={`${context.keyPath}-item-${index}`}>
              <span className="text-muted-foreground">{context.indent} </span>
              <JsonObject
                collapsed={context.collapsed}
                keyName={`${context.keyPath}-${index}`}
                level={context.level + 1}
                obj={item}
                onToggleCollapsed={context.onToggleCollapsed}
              />
              {index < obj.length - 1 && (
                <span className="text-muted-foreground">,</span>
              )}
            </div>
          ))}
          <div>
            <span className="text-muted-foreground">{context.indent}]</span>
          </div>
        </div>
      )}

      {context.isCollapsed && <span className="text-muted-foreground">]</span>}
    </div>
  );
};

const renderJsonObject = (
  obj: Record<string, unknown>,
  context: RenderContext
) => {
  const entries = Object.entries(obj);

  if (entries.length === 0) {
    return <span className="text-muted-foreground">{"{}"}</span>;
  }

  return (
    <div>
      <button
        aria-label={`${context.isCollapsed ? "Expand" : "Collapse"} object`}
        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
        onClick={() => context.onToggleCollapsed(context.keyPath)}
        type="button"
      >
        {context.isCollapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
        <span className="text-muted-foreground">{"{"}</span>
        {context.isCollapsed && (
          <span className="text-muted-foreground text-xs">
            ... {entries.length} props
          </span>
        )}
      </button>

      {!context.isCollapsed && (
        <div className="ml-4">
          {entries.map(([key, value], index) => (
            <div className="my-1" key={key}>
              <span className="text-muted-foreground">{context.indent} </span>
              <span className="text-blue-700 dark:text-blue-300">"{key}"</span>
              <span className="text-muted-foreground">: </span>
              <JsonObject
                collapsed={context.collapsed}
                keyName={`${context.keyPath}-${key}`}
                level={context.level + 1}
                obj={value}
                onToggleCollapsed={context.onToggleCollapsed}
              />
              {index < entries.length - 1 && (
                <span className="text-muted-foreground">,</span>
              )}
            </div>
          ))}
          <div>
            <span className="text-muted-foreground">
              {context.indent}
              {"}"}
            </span>
          </div>
        </div>
      )}

      {context.isCollapsed && (
        <span className="text-muted-foreground">{"}"}</span>
      )}
    </div>
  );
};

// Simplified JSON object renderer using extracted functions
const JsonObject = ({
  obj,
  level,
  collapsed,
  onToggleCollapsed,
  keyName,
}: JsonObjectProps) => {
  const keyPath = keyName ? `${keyName}-${level}` : `root-${level}`;
  const isCollapsed = collapsed[keyPath];
  const indent = "  ".repeat(level);

  const context: RenderContext = {
    keyPath,
    isCollapsed,
    indent,
    collapsed,
    onToggleCollapsed,
    level,
  };

  // Handle primitives
  if (typeof obj !== "object" || obj === null) {
    return renderPrimitive(obj);
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return renderJsonArray(obj, context);
  }

  // Handle objects
  return renderJsonObject(obj as Record<string, unknown>, context);
};
