// biome-ignore-all lint/style/noMagicNumbers: unnecessary

import type { Audience, ChannelExecution, SourceSignals } from "./types";

// Extract channel processors to reduce complexity
const createEmailExecution = (
  audienceList: Audience[]
): ChannelExecution | null => {
  const emailAudiences = audienceList.filter(
    (audience) =>
      audience.name.includes("Repeat Purchasers") ||
      audience.name.includes("All Customers") ||
      audience.name.includes("New Customer")
  );

  return emailAudiences.length > 0
    ? {
        channel: "email",
        provider: "Klaviyo",
        schedule: { start: "09:00", end: "19:00", timezone: "Asia/Dhaka" },
        frequencyCapPerUserPerWeek: 3,
        variants: [
          {
            name: "Primary",
            subject: "{{first_name}}, your perfect {{top_product}} is waiting",
            bodyHtml:
              "Hi {{first_name}},<br><br>Based on your recent activity, we think you'll love our {{top_product}}. Get {{discount}}% off until {{end_date}}.",
            audience: emailAudiences[0].name,
          },
          {
            name: "Alternative",
            subject: "Limited time: {{discount}}% off {{top_product}}",
            bodyHtml:
              "Don't miss out {{first_name}}! Your {{top_product}} is {{discount}}% off, but only until {{end_date}}.",
            audience: emailAudiences[0].name,
          },
        ],
        audience: emailAudiences[0].name,
        tracking: {
          utmSource: "email",
          utmCampaign: "reactivation_campaign",
          pixelEvents: ["email_open", "email_click"],
        },
      }
    : null;
};

const createSmsExecution = (
  audienceList: Audience[]
): ChannelExecution | null => {
  const smsAudiences = audienceList.filter(
    (audience) =>
      audience.name.includes("Cart Abandoners") ||
      audience.name.includes("At-Risk High-LTV")
  );

  return smsAudiences.length > 0
    ? {
        channel: "sms",
        provider: "Twilio",
        schedule: { start: "10:00", end: "20:00", timezone: "Asia/Dhaka" },
        frequencyCapPerUserPerWeek: 2,
        message:
          "Hi {{first_name}}! Your cart is waiting. Complete your purchase and get {{discount}}% off. Expires {{end_date}}. Reply STOP to opt out.",
        audience: smsAudiences[0].name,
        compliance: {
          requiresOptIn: true,
          includeOptOutText: true,
        },
      }
    : null;
};

const createWhatsappExecution = (
  audienceList: Audience[]
): ChannelExecution | null => {
  const whatsappAudiences = audienceList.filter(
    (audience) =>
      audience.name.includes("High-LTV") ||
      audience.name.includes("Repeat Purchasers")
  );

  return whatsappAudiences.length > 0
    ? {
        channel: "whatsapp",
        provider: "WhatsApp Business API",
        schedule: { start: "09:00", end: "18:00", timezone: "Asia/Dhaka" },
        frequencyCapPerUserPerWeek: 1,
        templateId: "product_recommendation",
        locale: "en",
        parameters: ["{{first_name}}", "{{top_product}}", "{{discount}}"],
        audience: whatsappAudiences[0].name,
      }
    : null;
};

const createPushExecution = (
  audienceList: Audience[]
): ChannelExecution | null => {
  const pushAudiences = audienceList.filter(
    (audience) =>
      audience.name.includes("Engaged") ||
      audience.name.includes("All Customers")
  );

  return pushAudiences.length > 0
    ? {
        channel: "push",
        provider: "OneSignal",
        schedule: { start: "08:00", end: "21:00", timezone: "Asia/Dhaka" },
        frequencyCapPerUserPerWeek: 5,
        message:
          "🔥 {{first_name}}, {{discount}}% off {{top_product}} ends soon!",
        audience: pushAudiences[0].name,
      }
    : null;
};

const createAdsExecution = (audienceList: Audience[]): ChannelExecution => {
  const adsAudience = audienceList[0] || {
    name: "All Customers",
    source: ["shopify"],
    criteria: {},
    sizeEstimate: 1000,
    exclusions: [],
  };

  return {
    channel: "ads",
    provider: "Meta Ads Manager",
    schedule: { start: "00:00", end: "23:59", timezone: "Asia/Dhaka" },
    frequencyCapPerUserPerWeek: 7,
    networks: [
      {
        name: "meta",
        placements: ["feed", "stories", "reels"],
        budgetDaily: 50,
        bidStrategy: "lowest_cost",
      },
      {
        name: "google",
        placements: ["search", "display", "youtube"],
        budgetDaily: 30,
        bidStrategy: "target_cpa",
      },
    ],
    creativeBriefs: [
      {
        headline: "{{discount}}% Off {{top_product}}",
        primaryText:
          "Limited time offer for {{first_name}}. Get your favorite {{top_product}} at an amazing price!",
        assetRefs: ["image_1", "video_1"],
      },
    ],
    audience: adsAudience.name,
    audienceMapping: {
      [adsAudience.name]: {
        meta: "custom_audience_001",
        google: "remarketing_list_001",
      },
    },
  };
};

const createVoiceExecution = (
  audienceList: Audience[]
): ChannelExecution | null => {
  const voiceAudiences = audienceList.filter((audience) =>
    audience.name.includes("High-LTV")
  );

  return voiceAudiences.length > 0
    ? {
        channel: "voice",
        provider: "Twilio Voice",
        schedule: { start: "10:00", end: "17:00", timezone: "Asia/Dhaka" },
        frequencyCapPerUserPerWeek: 1,
        message:
          "Hello {{first_name}}, this is a personal call from our team about an exclusive offer on {{top_product}}.",
        audience: voiceAudiences[0].name,
      }
    : null;
};

const createMessengerExecution = (
  audienceList: Audience[]
): ChannelExecution | null => {
  const messengerAudiences = audienceList.filter((audience) =>
    audience.name.includes("Engaged Social")
  );

  return messengerAudiences.length > 0
    ? {
        channel: "messenger",
        provider: "Facebook Messenger API",
        schedule: { start: "09:00", end: "18:00", timezone: "Asia/Dhaka" },
        frequencyCapPerUserPerWeek: 2,
        message:
          "Hi {{first_name}}! Thanks for engaging with our content. Here's a special {{discount}}% discount on {{top_product}}!",
        audience: messengerAudiences[0].name,
      }
    : null;
};

const createDefaultExecution = (
  channelId: string,
  audienceList: Audience[]
): ChannelExecution => ({
  channel: channelId,
  provider: `Default ${channelId} Provider`,
  schedule: { start: "09:00", end: "18:00", timezone: "Asia/Dhaka" },
  frequencyCapPerUserPerWeek: 3,
  message:
    "Hi {{first_name}}! Check out our latest {{top_product}} with {{discount}}% off!",
  audience: audienceList[0].name,
});

export const chooseChannels = (
  selectedChannels: string[],
  audiences: Audience[],
  _signals: SourceSignals,
  _prompt: string
): ChannelExecution[] => {
  const channelProcessors: Record<
    string,
    (audienceList: Audience[]) => ChannelExecution | null
  > = {
    email: createEmailExecution,
    sms: createSmsExecution,
    whatsapp: createWhatsappExecution,
    push: createPushExecution,
    ads: createAdsExecution,
    voice: createVoiceExecution,
    messenger: createMessengerExecution,
  };

  const executions: ChannelExecution[] = [];

  // Process each selected channel
  for (const channelId of selectedChannels) {
    const processor = channelProcessors[channelId];
    if (processor) {
      const execution = processor(audiences);
      if (execution) {
        executions.push(execution);
      }
    }
  }

  // Ensure every selected channel has at least one execution
  for (const channelId of selectedChannels) {
    const hasExecution = executions.some((exec) => exec.channel === channelId);
    if (!hasExecution && audiences.length > 0) {
      executions.push(createDefaultExecution(channelId, audiences));
    }
  }

  return executions;
};

// Helper to determine channel priority based on intent
export const getChannelPriority = (
  prompt: string,
  _signals: SourceSignals
): Record<string, number> => {
  const priorities: Record<string, number> = {
    email: 3,
    sms: 2,
    whatsapp: 2,
    push: 4,
    voice: 1,
    messenger: 3,
    ads: 5,
  };

  const promptLower = prompt.toLowerCase();

  // Boost SMS/WhatsApp for urgent campaigns
  if (promptLower.includes("urgent") || promptLower.includes("flash")) {
    priorities.sms = 5;
    priorities.whatsapp = 5;
  }

  // Boost ads for reach campaigns
  if (promptLower.includes("reach") || promptLower.includes("awareness")) {
    priorities.ads = 7;
  }

  // Boost email for nurture campaigns
  if (promptLower.includes("nurture") || promptLower.includes("relationship")) {
    priorities.email = 6;
  }

  return priorities;
};
