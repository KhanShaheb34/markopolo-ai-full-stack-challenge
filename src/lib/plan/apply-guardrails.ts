import { CAMPAIGN, FREQUENCY_LIMITS, HOURS, MESSAGE_LIMITS } from "./constants";
import type { CampaignPlan, ChannelExecution } from "./types";

// Brand safety keywords to block
const BRAND_SAFETY_KEYWORDS = [
  "political",
  "election",
  "vote",
  "campaign",
  "candidate",
  "democrat",
  "republican",
  "liberal",
  "conservative",
  "protest",
  "controversial",
  "scandal",
  "crisis",
];

// Domains to blocklist for brand safety
const BLOCKLIST_DOMAINS = [
  "political-site.com",
  "controversy-news.com",
  "scandal-blog.com",
  "hate-speech-platform.com",
  "inappropriate-content.com",
];

type Issue = {
  issue: string;
  severity: "warning" | "error";
  suggestion: string;
};

type Rules = {
  timeWindow: string;
  channels: string[];
  maxContacts: number;
};

export const applyGuardrails = (plan: CampaignPlan): CampaignPlan => {
  const updatedPlan = { ...plan };

  // Apply brand safety guardrails
  updatedPlan.guardrails = {
    brandSafety: BRAND_SAFETY_KEYWORDS,
    blocklistDomains: BLOCKLIST_DOMAINS,
  };

  // Apply quiet hours for SMS and Voice channels
  updatedPlan.channels = updatedPlan.channels.map((channel) => {
    if (channel.channel === "sms" || channel.channel === "voice") {
      return enforceQuietHours(channel);
    }
    return channel;
  });

  // Apply contact deduplication rules
  updatedPlan.globalPacing = {
    ...updatedPlan.globalPacing,
    dailyMaxImpressionsPerUser: calculateMaxImpressions(updatedPlan.channels),
  };

  return updatedPlan;
};

// Enforce quiet hours (21:00–08:00) for SMS/Voice
const enforceQuietHours = (execution: ChannelExecution): ChannelExecution => {
  const updatedExecution = { ...execution };

  const startHour = Number.parseInt(execution.schedule.start.split(":")[0], 10);
  const endHour = Number.parseInt(execution.schedule.end.split(":")[0], 10);

  // Ensure no communication during quiet hours
  if (startHour < HOURS.QUIET_START) {
    updatedExecution.schedule.start = "08:00";
  }

  if (endHour > HOURS.QUIET_END) {
    updatedExecution.schedule.end = "21:00";
  }

  return updatedExecution;
};

// Calculate max impressions to prevent overload
const calculateMaxImpressions = (channels: ChannelExecution[]): number => {
  const totalFrequency = channels.reduce(
    (sum, channel) => sum + channel.frequencyCapPerUserPerWeek,
    0
  );

  // Daily max = weekly total / 7, with a reasonable cap
  return Math.min(
    Math.ceil(totalFrequency / CAMPAIGN.DAYS_IN_WEEK),
    FREQUENCY_LIMITS.MAX_DAILY_CONTACTS
  );
};

// Check if content passes brand safety
export const checkBrandSafety = (content: string): boolean => {
  const contentLower = content.toLowerCase();

  return !BRAND_SAFETY_KEYWORDS.some((keyword) =>
    contentLower.includes(keyword)
  );
};

// Generate contact deduplication rules
export const generateDedupeRules = (
  channels: ChannelExecution[]
): Array<{
  timeWindow: string;
  channels: string[];
  maxContacts: number;
}> => {
  const rules: Rules[] = [];

  // Daily dedupe rule across all channels
  rules.push({
    timeWindow: "24h",
    channels: channels.map((ch) => ch.channel),
    maxContacts: 1,
  });

  // Hourly dedupe for high-frequency channels
  const highFreqChannels = channels
    .filter((ch) => ["sms", "push", "voice"].includes(ch.channel))
    .map((ch) => ch.channel);

  if (highFreqChannels.length > 0) {
    rules.push({
      timeWindow: "1h",
      channels: highFreqChannels,
      maxContacts: 1,
    });
  }

  return rules;
};

// Validate channel compliance
export const validateCompliance = (execution: ChannelExecution): Issue[] => {
  const issues: Issue[] = [];

  // SMS compliance checks
  if (execution.channel === "sms") {
    if (!execution.compliance?.requiresOptIn) {
      issues.push({
        issue: "SMS requires explicit opt-in",
        severity: "error" as const,
        suggestion: "Add opt-in requirement to compliance settings",
      });
    }

    if (!execution.compliance?.includeOptOutText) {
      issues.push({
        issue: "SMS must include opt-out instructions",
        severity: "error" as const,
        suggestion: "Add 'Reply STOP to opt out' to message",
      });
    }

    if (
      execution.message &&
      execution.message.length > MESSAGE_LIMITS.SMS_MAX_LENGTH
    ) {
      issues.push({
        issue: "SMS message exceeds 160 characters",
        severity: "warning" as const,
        suggestion: "Shorten message for better deliverability",
      });
    }
  }

  // Voice compliance checks
  if (execution.channel === "voice") {
    const startHour = Number.parseInt(
      execution.schedule.start.split(":")[0],
      10
    );
    const endHour = Number.parseInt(execution.schedule.end.split(":")[0], 10);

    if (startHour < HOURS.VOICE_START || endHour > HOURS.VOICE_END) {
      issues.push({
        issue: "Voice calls outside recommended business hours",
        severity: "warning" as const,
        suggestion: "Limit voice calls to 10:00-17:00 for better reception",
      });
    }
  }

  // Email compliance checks
  if (
    execution.channel === "email" &&
    execution.frequencyCapPerUserPerWeek > FREQUENCY_LIMITS.MAX_WEEKLY_EMAILS
  ) {
    issues.push({
      issue: "High email frequency may increase unsubscribes",
      severity: "warning" as const,
      suggestion: "Consider reducing frequency to ≤5 emails per week",
    });
  }

  return issues;
};

// Generate explanation for guardrail decisions
export const explainGuardrails = (
  plan: CampaignPlan
): Array<{
  decision: string;
  becauseOf: string[];
}> => {
  const explanations: Array<{
    decision: string;
    becauseOf: string[];
  }> = [];

  // Quiet hours explanation
  const hasQuietHoursChannels = plan.channels.some(
    (ch) => ch.channel === "sms" || ch.channel === "voice"
  );

  if (hasQuietHoursChannels) {
    explanations.push({
      decision: "Applied quiet hours (21:00-08:00) for SMS and Voice channels",
      becauseOf: ["regulatory_compliance", "user_experience"],
    });
  }

  // Brand safety explanation
  explanations.push({
    decision:
      "Applied brand safety filters to prevent political/controversial content",
    becauseOf: ["brand_protection", "platform_policies"],
  });

  // Contact frequency explanation
  explanations.push({
    decision: `Limited to ${plan.globalPacing.dailyMaxImpressionsPerUser} contacts per user per day`,
    becauseOf: ["user_experience", "deliverability_optimization"],
  });

  return explanations;
};
