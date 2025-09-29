import { applyGuardrails, explainGuardrails } from "./apply-guardrails";
import { buildMessages } from "./build-messages";
import { chooseAudiences } from "./choose-audiences";
import { chooseChannels } from "./choose-channels";
import { chooseTiming } from "./choose-timing";
import { CAMPAIGN, ENCODING, KPI_ADJUSTMENTS } from "./constants";
import { summarizeSources } from "./summarize-sources";
import type { CampaignPlan, PlanningInputs } from "./types";

// Brand safety keywords and blocklist (imported from guardrails)
const BRAND_SAFETY_KEYWORDS = [
  "political",
  "election",
  "vote",
  "controversy",
  "scandal",
];

const BLOCKLIST_DOMAINS = [
  "political-site.com",
  "controversy-news.com",
  "inappropriate-content.com",
];

// Generate a unique campaign ID
const generateCampaignId = (): string => {
  const timestamp = Date.now().toString(ENCODING.BASE_36);
  const random = Math.random()
    .toString(ENCODING.BASE_36)
    .substring(ENCODING.SUBSTRING_START);
  return `camp_${timestamp}_${random}`;
};

// Determine campaign objective from prompt
const determineCampaignObjective = (
  prompt: string
): CampaignPlan["objective"] => {
  const promptLower = prompt.toLowerCase();

  if (
    promptLower.includes("reactivation") ||
    promptLower.includes("win back")
  ) {
    return "reactivation";
  }

  if (promptLower.includes("retention") || promptLower.includes("loyalty")) {
    return "retention";
  }

  if (
    promptLower.includes("acquisition") ||
    promptLower.includes("new customer")
  ) {
    return "acquisition";
  }

  if (promptLower.includes("awareness") || promptLower.includes("reach")) {
    return "awareness";
  }

  // Default based on context
  return "retention";
};

// Set KPIs based on objective
const determineKpIs = (
  objective: CampaignPlan["objective"],
  prompt: string
): CampaignPlan["kpis"] => {
  const promptLower = prompt.toLowerCase();

  const baseKpIs: Record<string, CampaignPlan["kpis"]> = {
    awareness: { ctrMin: 0.02 },
    acquisition: { cpaMax: 50 },
    retention: { roasTarget: 3.0 },
    reactivation: { roasTarget: 2.5, cpaMax: 40 },
  };

  const kpis = { ...baseKpIs[objective] };

  // Adjust based on prompt context
  if (
    promptLower.includes("aggressive") ||
    promptLower.includes("high target")
  ) {
    if (kpis.roasTarget) {
      kpis.roasTarget += KPI_ADJUSTMENTS.ROAS_BOOST;
    }
    if (kpis.cpaMax) {
      kpis.cpaMax -= KPI_ADJUSTMENTS.CPA_REDUCTION;
    }
    if (kpis.ctrMin) {
      kpis.ctrMin += KPI_ADJUSTMENTS.CTR_BOOST;
    }
  }

  return kpis;
};

// Main assembly function
export const assemblePlan = async (
  inputs: PlanningInputs
): Promise<CampaignPlan> => {
  // Step 1: Summarize data sources
  const signals = await summarizeSources(inputs.selectedSources);

  // Step 2: Choose target audiences
  const audiences = chooseAudiences(signals, inputs.prompt);

  // Step 3: Map channels to audiences
  const channelExecutions = chooseChannels(
    inputs.selectedChannels,
    audiences,
    signals,
    inputs.prompt
  );

  // Step 4: Apply timing constraints
  const timedChannels = chooseTiming(
    channelExecutions,
    inputs.prompt,
    inputs.timezone
  );

  // Step 5: Build message content
  const messagesBuilt = buildMessages(timedChannels, signals, inputs.prompt);

  // Step 6: Determine campaign metadata
  const objective = determineCampaignObjective(inputs.prompt);
  const kpis = determineKpIs(objective, inputs.prompt);

  // Step 7: Set campaign duration
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + CAMPAIGN.DEFAULT_DURATION_DAYS);

  // Step 8: Assemble initial plan
  let plan: CampaignPlan = {
    campaignId: generateCampaignId(),
    objective,
    kpis,
    timezone: inputs.timezone,
    audiences,
    channels: messagesBuilt,
    globalPacing: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      dailyMaxImpressionsPerUser: 3, // Will be updated by guardrails
    },
    guardrails: {
      brandSafety: [],
      blocklistDomains: [],
    },
  };

  // Step 9: Apply guardrails and compliance
  plan = applyGuardrails(plan);

  // Step 10: Add explainability
  plan.explainability = explainGuardrails(plan);

  // Add planning decision explanations
  if (!plan.explainability) {
    plan.explainability = [];
  }
  plan.explainability.push(
    {
      decision: `Selected ${audiences.length} audience segments`,
      becauseOf: ["fixture_data_analysis", "prompt_keyword_matching"],
    },
    {
      decision: `Mapped ${messagesBuilt.length} channel executions`,
      becauseOf: ["channel_preferences", "audience_intent_signals"],
    },
    {
      decision: `Set ${objective} campaign objective`,
      becauseOf: ["prompt_analysis", "keyword_detection"],
    }
  );

  return plan;
};

// Helper for streaming - break plan into stages
export const assemblePlanByStages = async function* (inputs: PlanningInputs) {
  // Stage 1: Profiling
  yield { stage: "profiling" as const };
  const signals = await summarizeSources(inputs.selectedSources);

  // Stage 2: Audiences
  yield { stage: "audiences" as const };
  const audiences = chooseAudiences(signals, inputs.prompt);
  yield { partial: { audiences } };

  // Stage 3: Channels
  yield { stage: "channels" as const };
  const channelExecutions = chooseChannels(
    inputs.selectedChannels,
    audiences,
    signals,
    inputs.prompt
  );

  const timedChannels = chooseTiming(
    channelExecutions,
    inputs.prompt,
    inputs.timezone
  );
  const messagesBuilt = buildMessages(timedChannels, signals, inputs.prompt);
  yield { partial: { channels: messagesBuilt } };

  // Stage 4: Timing
  yield { stage: "timing" as const };
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + CAMPAIGN.DEFAULT_DURATION_DAYS);

  const globalPacing = {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    dailyMaxImpressionsPerUser: 3,
  };
  yield { partial: { globalPacing } };

  // Stage 5: Guardrails
  yield { stage: "guardrails" as const };

  const objective = determineCampaignObjective(inputs.prompt);
  const kpis = determineKpIs(objective, inputs.prompt);

  let plan: CampaignPlan = {
    campaignId: generateCampaignId(),
    objective,
    kpis,
    timezone: inputs.timezone,
    audiences,
    channels: messagesBuilt,
    globalPacing,
    guardrails: {
      brandSafety: BRAND_SAFETY_KEYWORDS,
      blocklistDomains: BLOCKLIST_DOMAINS,
    },
  };

  plan = applyGuardrails(plan);
  plan.explainability = explainGuardrails(plan);

  // Add final explanations
  if (!plan.explainability) {
    plan.explainability = [];
  }
  plan.explainability.push(
    {
      decision: `Selected ${audiences.length} audience segments`,
      becauseOf: ["fixture_data_analysis", "prompt_keyword_matching"],
    },
    {
      decision: `Mapped ${messagesBuilt.length} channel executions`,
      becauseOf: ["channel_preferences", "audience_intent_signals"],
    },
    {
      decision: `Set ${objective} campaign objective`,
      becauseOf: ["prompt_analysis", "keyword_detection"],
    }
  );

  // Final complete plan
  yield { final: plan };
};
