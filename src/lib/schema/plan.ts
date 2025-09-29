import { z } from "zod";
import { FREQUENCY_LIMITS, MESSAGE_LIMITS } from "../plan/constants";

// Audience schema
export const audienceSchema = z.object({
  name: z.string().min(1),
  source: z.array(z.string()),
  criteria: z.record(z.unknown()),
  sizeEstimate: z.number().int().min(0),
  exclusions: z.array(z.string()),
});

// Channel execution schema
export const channelExecutionSchema = z.object({
  channel: z.enum([
    "email",
    "sms",
    "whatsapp",
    "push",
    "voice",
    "messenger",
    "ads",
  ]),
  provider: z.string().min(1),
  schedule: z.object({
    start: z
      .string()
      .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
    end: z
      .string()
      .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
    timezone: z.string().min(1),
  }),
  frequencyCapPerUserPerWeek: z
    .number()
    .int()
    .min(0)
    .max(MESSAGE_LIMITS.FREQUENCY_CAP_MAX),
  variants: z
    .array(
      z.object({
        name: z.string(),
        subject: z.string().optional(),
        bodyHtml: z.string().optional(),
        bodyText: z.string().optional(),
        audience: z.string(),
      })
    )
    .optional(),
  message: z.string().optional(),
  audience: z.string(),
  tracking: z
    .object({
      utmSource: z.string(),
      utmCampaign: z.string(),
      pixelEvents: z.array(z.string()),
    })
    .optional(),
  compliance: z
    .object({
      requiresOptIn: z.boolean(),
      includeOptOutText: z.boolean(),
    })
    .optional(),
  templateId: z.string().optional(),
  locale: z.string().optional(),
  parameters: z.array(z.string()).optional(),
  networks: z
    .array(
      z.object({
        name: z.string(),
        placements: z.array(z.string()),
        budgetDaily: z.number().positive(),
        bidStrategy: z.string(),
      })
    )
    .optional(),
  creativeBriefs: z
    .array(
      z.object({
        headline: z.string(),
        primaryText: z.string(),
        assetRefs: z.array(z.string()),
      })
    )
    .optional(),
  audienceMapping: z.record(z.record(z.string())).optional(),
});

// Campaign plan schema (main schema)
export const campaignPlanSchema = z
  .object({
    campaignId: z.string().min(1),
    objective: z.enum([
      "awareness",
      "acquisition",
      "retention",
      "reactivation",
    ]),
    kpis: z.object({
      roasTarget: z.number().positive().optional(),
      cpaMax: z.number().positive().optional(),
      ctrMin: z.number().positive().max(1).optional(),
    }),
    timezone: z.string().min(1),
    audiences: z
      .array(audienceSchema)
      .min(1, "At least one audience is required"),
    channels: z
      .array(channelExecutionSchema)
      .min(1, "At least one channel is required"),
    globalPacing: z.object({
      start: z.string().datetime(),
      end: z.string().datetime(),
      dailyMaxImpressionsPerUser: z.number().int().positive(),
    }),
    guardrails: z.object({
      brandSafety: z.array(z.string()),
      blocklistDomains: z.array(z.string()),
    }),
    explainability: z
      .array(
        z.object({
          decision: z.string(),
          becauseOf: z.array(z.string()),
        })
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    // Validate that end date is after start date
    const startDate = new Date(data.globalPacing.start);
    const endDate = new Date(data.globalPacing.end);

    if (endDate <= startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date must be after start date",
        path: ["globalPacing", "end"],
      });
    }

    // Validate that each channel has at least one execution
    const uniqueChannels = new Set(data.channels.map((ch) => ch.channel));
    if (uniqueChannels.size < data.channels.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Duplicate channel executions detected",
        path: ["channels"],
      });
    }

    // Validate SMS compliance if SMS channel is used
    const smsChannels = data.channels.filter((ch) => ch.channel === "sms");
    for (const smsChannel of smsChannels) {
      if (!smsChannel.compliance?.requiresOptIn) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "SMS channels must require opt-in",
          path: ["channels"],
        });
      }

      if (
        smsChannel.message &&
        smsChannel.message.length > MESSAGE_LIMITS.SMS_MAX_LENGTH
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "SMS message exceeds 160 character limit",
          path: ["channels"],
        });
      }
    }

    // Validate frequency caps are reasonable
    for (const channel of data.channels) {
      if (
        channel.frequencyCapPerUserPerWeek >
        FREQUENCY_LIMITS.MAX_WEEKLY_FREQUENCY
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `High frequency cap for ${channel.channel} may cause user fatigue`,
          path: ["channels"],
          fatal: false, // Warning, not error
        });
      }
    }
  });

// Planning inputs schema
export const planningInputsSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  selectedSources: z
    .array(z.string())
    .min(MESSAGE_LIMITS.MIN_DATA_SOURCES, "At least 3 data sources required"),
  selectedChannels: z
    .array(z.string())
    .min(MESSAGE_LIMITS.MIN_CHANNELS, "At least 4 channels required"),
  timezone: z.string().default("Asia/Dhaka"),
  signals: z.record(z.unknown()).optional(),
});

// Streaming response schemas
export const streamStatusSchema = z.object({
  stage: z.enum(["profiling", "audiences", "channels", "timing", "guardrails"]),
});

export const streamPartialSchema = z.object({
  audiences: z.array(audienceSchema).optional(),
  channels: z.array(channelExecutionSchema).optional(),
  globalPacing: z
    .object({
      start: z.string().datetime(),
      end: z.string().datetime(),
      dailyMaxImpressionsPerUser: z.number().int().positive(),
    })
    .optional(),
});

export const streamFinalSchema = z.object({
  final: campaignPlanSchema,
});

export const streamErrorSchema = z.object({
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
  }),
});

// Union of all possible stream responses
export const streamResponseSchema = z.union([
  z.object({ status: streamStatusSchema }),
  z.object({ partial: streamPartialSchema }),
  streamFinalSchema,
  streamErrorSchema,
]);

// Type exports for convenience
export type CampaignPlan = z.infer<typeof campaignPlanSchema>;
export type Audience = z.infer<typeof audienceSchema>;
export type ChannelExecution = z.infer<typeof channelExecutionSchema>;
export type PlanningInputs = z.infer<typeof planningInputsSchema>;
export type StreamResponse = z.infer<typeof streamResponseSchema>;

// Validation helpers
export const validateCampaignPlan = (data: unknown): CampaignPlan =>
  campaignPlanSchema.parse(data);

export const validatePlanningInputs = (data: unknown): PlanningInputs =>
  planningInputsSchema.parse(data);

export const safeParseCampaignPlan = (data: unknown) =>
  campaignPlanSchema.safeParse(data);

export const safeParsePlanningInputs = (data: unknown) =>
  planningInputsSchema.safeParse(data);

// Schema validation middleware for API routes
export const validateRequestBody =
  <T>(schema: z.ZodSchema<T>) =>
  (data: unknown): T => {
    const result = schema.safeParse(data);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));

      throw new Error(`Validation failed: ${JSON.stringify(errors)}`);
    }

    return result.data;
  };
