// biome-ignore-all lint/suspicious/noExplicitAny: unnecessary
// biome-ignore-all lint/style/noMagicNumbers: unnecessary

import facebookData from "@/lib/fixtures/facebook_page.json" with {
  type: "json",
};
import reviewsData from "@/lib/fixtures/reviews.json" with { type: "json" };
import shopifyData from "@/lib/fixtures/shopify.json" with { type: "json" };
import twitterData from "@/lib/fixtures/twitter.json" with { type: "json" };
import webPixelData from "@/lib/fixtures/web_pixel.json" with { type: "json" };
import type { SourceSignals } from "./types";

const _fixtureMap = {
  "website-pixel": webPixelData,
  shopify: shopifyData,
  "facebook-page": facebookData,
  twitter: twitterData,
  reviews: reviewsData,
};

// Extract data processors for each source
const processWebsitePixel = (): SourceSignals["websitePixel"] => {
  const data = webPixelData as any;
  return data.events && data.topProducts
    ? {
        events: data.events.map((event: any) => ({
          event: event.event,
          productId: event.productId,
          value: event.value,
          timestamp: event.timestamp,
        })),
        topProducts: data.topProducts,
      }
    : undefined;
};

const processShopify = (): SourceSignals["shopify"] => {
  const data = shopifyData as any;
  return data.customers && data.segments
    ? {
        customers: data.customers.map((customer: any) => ({
          id: customer.id,
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          lastPurchaseDate: customer.lastPurchaseDate,
          totalOrders: customer.totalOrders,
          totalSpent: customer.totalSpent,
          lifetimeValue: customer.lifetimeValue,
          tags: customer.tags,
        })),
        segments: data.segments,
      }
    : undefined;
};

const processFacebookPage = (): SourceSignals["facebookPage"] => {
  const data = facebookData as any;
  return data.posts && data.topCommenters
    ? {
        posts: data.posts.map((post: any) => ({
          id: post.id,
          likes: post.likes,
          comments: post.comments,
          engagement: post.engagement,
        })),
        topCommenters: data.topCommenters,
      }
    : undefined;
};

const processTwitter = (): SourceSignals["twitter"] => {
  const data = twitterData as any;
  return data.tweets && data.analytics
    ? {
        tweets: data.tweets.map((tweet: any) => ({
          id: tweet.id,
          likes: tweet.likes,
          retweets: tweet.retweets,
          engagement: tweet.engagement,
        })),
        analytics: {
          avgEngagementRate: data.analytics.avgEngagementRate,
          totalImpressions: data.analytics.totalImpressions,
        },
      }
    : undefined;
};

const processReviews = (): SourceSignals["reviews"] => {
  const data = reviewsData as any;
  return data.overallRating && data.totalReviews && data.topicAnalysis
    ? {
        overallRating: data.overallRating,
        totalReviews: data.totalReviews,
        topicAnalysis: data.topicAnalysis,
      }
    : undefined;
};

export const summarizeSources = (selectedSources: string[]): SourceSignals => {
  const processors: Record<string, () => any> = {
    "website-pixel": processWebsitePixel,
    shopify: processShopify,
    "facebook-page": processFacebookPage,
    twitter: processTwitter,
    reviews: processReviews,
  };

  const signals: SourceSignals = {};

  const keyMapping: Record<string, keyof SourceSignals> = {
    "website-pixel": "websitePixel",
    "facebook-page": "facebookPage",
    shopify: "shopify",
    twitter: "twitter",
    reviews: "reviews",
  };

  for (const sourceId of selectedSources) {
    const processor = processors[sourceId];
    if (processor) {
      const result = processor();
      if (result) {
        const key = keyMapping[sourceId];
        (signals as any)[key] = result;
      }
    }
  }

  return signals;
};

// Helper to get signal strength indicators
export const getSignalStrength = (signals: SourceSignals) => {
  const indicators = {
    hasRecentActivity: false,
    hasHighValueCustomers: false,
    hasEngagedAudience: false,
    hasCartAbandoners: false,
    totalCustomers: 0,
    avgEngagement: 0,
  };

  // Website pixel signals
  if (signals.websitePixel) {
    const recentEvents = signals.websitePixel.events.filter(
      (event) =>
        new Date(event.timestamp) >
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    indicators.hasRecentActivity = recentEvents.length > 0;
  }

  // Shopify signals
  if (signals.shopify) {
    indicators.totalCustomers = signals.shopify.customers.length;
    indicators.hasHighValueCustomers = signals.shopify.customers.some(
      (customer) => customer.lifetimeValue > 500
    );
    indicators.hasCartAbandoners = signals.shopify.customers.some((customer) =>
      customer.tags.includes("cart-abandoner")
    );
  }

  // Social engagement signals
  if (signals.facebookPage) {
    const avgEngagement =
      signals.facebookPage.posts.reduce(
        (sum, post) => sum + post.engagement,
        0
      ) / signals.facebookPage.posts.length;
    indicators.avgEngagement = Math.max(
      indicators.avgEngagement,
      avgEngagement
    );
    indicators.hasEngagedAudience = avgEngagement > 100;
  }

  if (signals.twitter) {
    indicators.avgEngagement = Math.max(
      indicators.avgEngagement,
      signals.twitter.analytics.avgEngagementRate
    );
  }

  return indicators;
};
