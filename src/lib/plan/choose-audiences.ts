// biome-ignore-all lint/style/noMagicNumbers: unnecessary

import { CAMPAIGN } from "./constants";
import type { Audience, SourceSignals } from "./types";

// Extract audience selection into focused functions
const getAtRiskHighLtvAudience = (signals: SourceSignals): Audience | null => {
  if (!signals.shopify) {
    return null;
  }

  const thirtyDaysAgo = new Date(
    Date.now() - CAMPAIGN.DAYS_30 * CAMPAIGN.MS_PER_DAY
  );
  const sixtyDaysAgo = new Date(
    Date.now() - CAMPAIGN.DAYS_60 * CAMPAIGN.MS_PER_DAY
  );

  const atRiskCustomers = signals.shopify.customers.filter((customer) => {
    const lastPurchase = new Date(customer.lastPurchaseDate);
    return (
      customer.lifetimeValue > CAMPAIGN.LIFETIME_VALUE_THRESHOLD &&
      lastPurchase < thirtyDaysAgo &&
      lastPurchase > sixtyDaysAgo
    );
  });

  return atRiskCustomers.length > 0
    ? {
        name: "At-Risk High-LTV Customers",
        source: ["shopify"],
        criteria: {
          lifetimeValue: { min: 500 },
          daysSinceLastPurchase: { min: 30, max: 60 },
        },
        sizeEstimate: atRiskCustomers.length,
        exclusions: ["recent-refunds", "unsubscribed-email"],
      }
    : null;
};

const getCartAbandonersAudience = (signals: SourceSignals): Audience | null => {
  if (!signals.shopify) {
    return null;
  }

  const cartAbandoners = signals.shopify.customers.filter((customer) =>
    customer.tags.includes("cart-abandoner")
  );

  return cartAbandoners.length > 0
    ? {
        name: "Recent Cart Abandoners",
        source: ["shopify"],
        criteria: {
          tags: ["cart-abandoner"],
          daysSinceCartAbandon: { max: 7 },
        },
        sizeEstimate: cartAbandoners.length,
        exclusions: ["completed-purchase", "unsubscribed-email"],
      }
    : null;
};

const getRepeatPurchasersAudience = (
  signals: SourceSignals
): Audience | null => {
  if (!signals.shopify) {
    return null;
  }

  const repeatPurchasers = signals.shopify.customers.filter(
    (customer) => customer.totalOrders >= 3
  );

  return repeatPurchasers.length > 0
    ? {
        name: "Repeat Purchasers",
        source: ["shopify"],
        criteria: { totalOrders: { min: 3 } },
        sizeEstimate: repeatPurchasers.length,
        exclusions: ["unsubscribed-email"],
      }
    : null;
};

const getEngagedSocialAudience = (signals: SourceSignals): Audience | null => {
  if (!(signals.facebookPage || signals.twitter)) {
    return null;
  }

  let engagedFollowers = 0;
  const sources: string[] = [];

  if (signals.facebookPage) {
    engagedFollowers += signals.facebookPage.topCommenters.length;
    sources.push("facebookPage");
  }

  if (signals.twitter) {
    const recentEngagement = signals.twitter.tweets
      .slice(0, 3)
      .reduce((sum, tweet) => sum + tweet.engagement, 0);
    engagedFollowers += Math.floor(recentEngagement * 0.1);
    sources.push("twitter");
  }

  return engagedFollowers > 0
    ? {
        name: "Engaged Social Followers",
        source: sources,
        criteria: { engagementPeriod: "7d", minInteractions: 1 },
        sizeEstimate: engagedFollowers,
        exclusions: ["blocked-users"],
      }
    : null;
};

const getWebsiteVisitorsAudience = (
  signals: SourceSignals,
  prompt: string
): Audience | null => {
  const promptLower = prompt.toLowerCase();
  if (
    !(
      signals.websitePixel &&
      (promptLower.includes("reach") || promptLower.includes("awareness"))
    )
  ) {
    return null;
  }

  const uniqueUsers = new Set(
    signals.websitePixel.events.map((event) => event.timestamp.split("T")[0])
  ).size;

  return {
    name: "Recent Website Visitors",
    source: ["websitePixel"],
    criteria: { daysSinceVisit: { max: 14 }, minPageViews: 2 },
    sizeEstimate: uniqueUsers * CAMPAIGN.VISITOR_MULTIPLIER,
    exclusions: ["purchased-recently"],
  };
};

const getNewCustomersAudience = (
  signals: SourceSignals,
  prompt: string
): Audience | null => {
  const promptLower = prompt.toLowerCase();
  if (
    !(
      signals.shopify &&
      (promptLower.includes("acquisition") || promptLower.includes("new"))
    )
  ) {
    return null;
  }

  const newCustomers = signals.shopify.customers.filter(
    (customer) => customer.totalOrders === 1
  );

  return newCustomers.length > 0
    ? {
        name: "New Customer Onboarding",
        source: ["shopify"],
        criteria: { totalOrders: 1, daysSinceFirstPurchase: { max: 30 } },
        sizeEstimate: newCustomers.length,
        exclusions: [],
      }
    : null;
};

export const chooseAudiences = (
  signals: SourceSignals,
  prompt: string
): Audience[] => {
  const audienceGetters = [
    () => getAtRiskHighLtvAudience(signals),
    () => getCartAbandonersAudience(signals),
    () => getRepeatPurchasersAudience(signals),
    () => getEngagedSocialAudience(signals),
    () => getWebsiteVisitorsAudience(signals, prompt),
    () => getNewCustomersAudience(signals, prompt),
  ];

  const audiences = audienceGetters
    .map((getter) => getter())
    .filter((audience): audience is Audience => audience !== null);

  // Default fallback if no audiences found
  if (audiences.length === 0) {
    audiences.push({
      name: "All Customers",
      source: ["shopify"],
      criteria: { status: "active" },
      sizeEstimate: signals.shopify?.customers.length || 100,
      exclusions: ["unsubscribed-email"],
    });
  }

  return audiences;
};
