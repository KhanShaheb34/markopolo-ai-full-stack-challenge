// Planning types and interfaces

export type Audience = {
  name: string;
  source: string[];
  criteria: Record<string, unknown>;
  sizeEstimate: number;
  exclusions: string[];
};

export type ChannelExecution = {
  channel: string;
  provider: string;
  schedule: {
    start: string;
    end: string;
    timezone: string;
  };
  frequencyCapPerUserPerWeek: number;
  variants?: Array<{
    name: string;
    subject?: string;
    bodyHtml?: string;
    bodyText?: string;
    audience: string;
  }>;
  message?: string;
  audience: string;
  tracking?: {
    utmSource: string;
    utmCampaign: string;
    pixelEvents: string[];
  };
  compliance?: {
    requiresOptIn: boolean;
    includeOptOutText: boolean;
  };
  templateId?: string;
  locale?: string;
  parameters?: string[];
  networks?: Array<{
    name: string;
    placements: string[];
    budgetDaily: number;
    bidStrategy: string;
  }>;
  creativeBriefs?: Array<{
    headline: string;
    primaryText: string;
    assetRefs: string[];
  }>;
  audienceMapping?: Record<string, Record<string, string>>;
};

export type CampaignPlan = {
  campaignId: string;
  objective: "awareness" | "acquisition" | "retention" | "reactivation";
  kpis: {
    roasTarget?: number;
    cpaMax?: number;
    ctrMin?: number;
  };
  timezone: string;
  audiences: Audience[];
  channels: ChannelExecution[];
  globalPacing: {
    start: string;
    end: string;
    dailyMaxImpressionsPerUser: number;
  };
  guardrails: {
    brandSafety: string[];
    blocklistDomains: string[];
  };
  explainability?: Array<{
    decision: string;
    becauseOf: string[];
  }>;
};

export type SourceSignals = {
  websitePixel?: {
    events: Array<{
      event: string;
      productId: string;
      value: number;
      timestamp: string;
    }>;
    topProducts: Array<{
      id: string;
      name: string;
      views: number;
      purchases: number;
    }>;
  };
  shopify?: {
    customers: Array<{
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      lastPurchaseDate: string;
      totalOrders: number;
      totalSpent: number;
      lifetimeValue: number;
      tags: string[];
    }>;
    segments: Record<string, number>;
  };
  facebookPage?: {
    posts: Array<{
      id: string;
      likes: number;
      comments: number;
      engagement: number;
    }>;
    topCommenters: Array<{
      name: string;
      comments: number;
    }>;
  };
  twitter?: {
    tweets: Array<{
      id: string;
      likes: number;
      retweets: number;
      engagement: number;
    }>;
    analytics: {
      avgEngagementRate: number;
      totalImpressions: number;
    };
  };
  reviews?: {
    overallRating: number;
    totalReviews: number;
    topicAnalysis: Record<
      string,
      {
        count: number;
        avgRating: number;
        sentiment: string;
      }
    >;
  };
};

export type PlanningInputs = {
  prompt: string;
  selectedSources: string[];
  selectedChannels: string[];
  timezone: string;
  signals: SourceSignals;
};
