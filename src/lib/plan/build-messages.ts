// biome-ignore-all lint/style/noMagicNumbers: unnecessary

import type { ChannelExecution, SourceSignals } from "./types";

type MessageVariables = {
  firstName: string;
  topProduct: string;
  discount: string;
  endDate: string;
};

export const buildMessages = (
  executions: ChannelExecution[],
  signals: SourceSignals,
  prompt: string
): ChannelExecution[] => {
  const promptLower = prompt.toLowerCase();

  // Determine campaign variables from context
  const variables = extractVariables(signals, prompt);

  return executions.map((execution) => {
    const updatedExecution = { ...execution };

    switch (execution.channel) {
      case "email": {
        updatedExecution.variants = [
          {
            name: "Primary (70%)",
            subject: getEmailSubject(promptLower, variables, "primary"),
            bodyHtml: getEmailBody(promptLower, variables, "primary"),
            audience: execution.audience,
          },
          {
            name: "Alternative (30%)",
            subject: getEmailSubject(promptLower, variables, "alternative"),
            bodyHtml: getEmailBody(promptLower, variables, "alternative"),
            audience: execution.audience,
          },
        ];
        break;
      }

      case "sms": {
        updatedExecution.message = getSmsMessage(promptLower, variables);
        break;
      }

      case "whatsapp": {
        updatedExecution.parameters = [
          variables.firstName,
          variables.topProduct,
          variables.discount,
          variables.endDate,
        ];
        break;
      }

      case "push": {
        updatedExecution.message = getPushMessage(promptLower, variables);
        break;
      }

      case "voice": {
        updatedExecution.message = getVoiceScript(promptLower, variables);
        break;
      }

      case "messenger": {
        updatedExecution.message = getMessengerMessage(promptLower, variables);
        break;
      }

      case "ads": {
        if (updatedExecution.creativeBriefs) {
          updatedExecution.creativeBriefs = [
            {
              headline: getAdHeadline(promptLower, variables, "primary"),
              primaryText: getAdBody(promptLower, variables, "primary"),
              assetRefs: ["product_image", "lifestyle_image"],
            },
            {
              headline: getAdHeadline(promptLower, variables, "alternative"),
              primaryText: getAdBody(promptLower, variables, "alternative"),
              assetRefs: ["video_creative", "carousel_images"],
            },
          ];
        }
        break;
      }

      default: {
        break;
      }
    }

    return updatedExecution;
  });
};

// Extract variables from signals and prompt context
const extractVariables = (
  signals: SourceSignals,
  prompt: string
): MessageVariables => {
  const variables: MessageVariables = {
    firstName: "{{firstName}}",
    topProduct: "{{topProduct}}",
    discount: "{{discount}}",
    endDate: "{{endDate}}",
  };

  // Determine discount based on campaign type
  const promptLower = prompt.toLowerCase();
  if (promptLower.includes("flash") || promptLower.includes("urgent")) {
    variables.discount = "30";
  } else if (
    promptLower.includes("black friday") ||
    promptLower.includes("holiday")
  ) {
    variables.discount = "25";
  } else if (promptLower.includes("reactivation")) {
    variables.discount = "20";
  } else {
    variables.discount = "15";
  }

  // Determine top product from signals
  if (signals.websitePixel?.topProducts) {
    const topProduct = signals.websitePixel.topProducts[0];
    variables.topProduct = topProduct?.name || "featured product";
  } else {
    variables.topProduct = "featured product";
  }

  // Set campaign end date (7 days from now)
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 7);
  variables.endDate = endDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return variables;
};

// Email message templates
const getEmailSubject = (
  prompt: string,
  vars: MessageVariables,
  variant: "primary" | "alternative"
): string => {
  if (variant === "primary") {
    if (prompt.includes("reactivation")) {
      return `${vars.firstName}, we miss you! ${vars.discount}% off your favorite ${vars.topProduct}`;
    }
    if (prompt.includes("black friday")) {
      return `🖤 Black Friday: ${vars.discount}% off ${vars.topProduct} - ${vars.firstName}`;
    }
    return `${vars.firstName}, your perfect ${vars.topProduct} is waiting`;
  }
  if (prompt.includes("urgent") || prompt.includes("flash")) {
    return `⚡ Flash Sale: ${vars.discount}% off ends ${vars.endDate}`;
  }
  return `Limited time: ${vars.discount}% off ${vars.topProduct}`;
};

const getEmailBody = (
  _prompt: string,
  vars: MessageVariables,
  variant: "primary" | "alternative"
): string => {
  if (variant === "primary") {
    return `
      <h2>Hi ${vars.firstName},</h2>
      <p>Based on your recent activity, we think you'll love our <strong>${vars.topProduct}</strong>.</p>
      <p>Get <strong>${vars.discount}% off</strong> until ${vars.endDate}.</p>
      <a href="#" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Shop Now</a>
    `;
  }
  return `
      <h2>Don't miss out ${vars.firstName}!</h2>
      <p>Your ${vars.topProduct} is <strong>${vars.discount}% off</strong>, but only until ${vars.endDate}.</p>
      <a href="#" style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Get ${vars.discount}% Off</a>
    `;
};

// SMS message templates
const getSmsMessage = (prompt: string, vars: MessageVariables): string => {
  if (prompt.includes("cart")) {
    return `Hi ${vars.firstName}! Your cart is waiting. Complete your purchase and get ${vars.discount}% off. Expires ${vars.endDate}. Reply STOP to opt out.`;
  }
  if (prompt.includes("flash") || prompt.includes("urgent")) {
    return `🔥 FLASH SALE ${vars.firstName}! ${vars.discount}% off ${vars.topProduct} - ends ${vars.endDate}! Shop now. Text STOP to opt out.`;
  }
  return `${vars.firstName}, exclusive ${vars.discount}% off ${vars.topProduct}! Limited time until ${vars.endDate}. Reply STOP to opt out.`;
};

// Push notification templates
const getPushMessage = (prompt: string, vars: MessageVariables): string => {
  if (prompt.includes("flash") || prompt.includes("urgent")) {
    return `🔥 ${vars.firstName}, ${vars.discount}% off ${vars.topProduct} ends soon!`;
  }
  return `${vars.firstName}, your ${vars.topProduct} is ${vars.discount}% off until ${vars.endDate}! 🛍️`;
};

// Voice script templates
const getVoiceScript = (_prompt: string, vars: MessageVariables): string =>
  `Hello ${vars.firstName}, this is a personal call from our team. We have an exclusive ${vars.discount}% discount on ${vars.topProduct} just for you. This offer expires ${vars.endDate}. Would you like to learn more?`;

// Messenger templates
const getMessengerMessage = (_prompt: string, vars: MessageVariables): string =>
  `Hi ${vars.firstName}! 👋 Thanks for engaging with our content. Here's a special ${vars.discount}% discount on ${vars.topProduct} - expires ${vars.endDate}! 🎉`;

// Ad creative templates
const getAdHeadline = (
  prompt: string,
  vars: MessageVariables,
  variant: "primary" | "alternative"
): string => {
  if (variant === "primary") {
    return `${vars.discount}% Off ${vars.topProduct}`;
  }
  if (prompt.includes("black friday")) {
    return `Black Friday: ${vars.topProduct} Sale`;
  }
  return `Limited Time: ${vars.topProduct}`;
};

const getAdBody = (
  _prompt: string,
  vars: MessageVariables,
  variant: "primary" | "alternative"
): string => {
  if (variant === "primary") {
    return `Limited time offer for ${vars.firstName}. Get your favorite ${vars.topProduct} at an amazing ${vars.discount}% off! Don't wait - offer ends ${vars.endDate}.`;
  }
  return `Hey ${vars.firstName}! 🎯 Your ${vars.topProduct} is calling. Save ${vars.discount}% before ${vars.endDate}. Shop smart, save more!`;
};

// Helper to determine message urgency level
export const getMessageUrgency = (
  prompt: string
): "low" | "medium" | "high" => {
  const promptLower = prompt.toLowerCase();

  if (
    promptLower.includes("flash") ||
    promptLower.includes("urgent") ||
    promptLower.includes("ending soon")
  ) {
    return "high";
  }

  if (
    promptLower.includes("limited time") ||
    promptLower.includes("black friday") ||
    promptLower.includes("sale")
  ) {
    return "medium";
  }

  return "low";
};

// Helper to generate A/B test splits
export const generateAbSplit = (
  variants: unknown[]
): Array<{ variant: number; traffic: number }> => {
  if (variants.length === 1) {
    return [{ variant: 0, traffic: 100 }];
  }

  if (variants.length === 2) {
    return [
      { variant: 0, traffic: 70 },
      { variant: 1, traffic: 30 },
    ];
  }

  // For more variants, distribute evenly with primary getting 50%
  const remaining = 50;
  const perVariant = remaining / (variants.length - 1);

  return variants.map((_, index) => ({
    variant: index,
    traffic: index === 0 ? 50 : perVariant,
  }));
};
