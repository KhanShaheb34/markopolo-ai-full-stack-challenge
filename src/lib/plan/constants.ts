// biome-ignore-all lint/style/useNamingConvention: unnecessary
// biome-ignore-all lint/style/noMagicNumbers: unnecessary

// Business logic constants

// Time constants
export const HOURS = {
  QUIET_START: 8,
  QUIET_END: 21,
  BUSINESS_START: 9,
  BUSINESS_END: 18,
  VOICE_START: 10,
  VOICE_END: 17,
} as const;

// Frequency limits
export const FREQUENCY_LIMITS = {
  MAX_WEEKLY_EMAILS: 5,
  MAX_WEEKLY_FREQUENCY: 10,
  MAX_DAILY_CONTACTS: 5,
  WEEKEND_REDUCTION_FACTOR: 0.5,
  FLASH_SALE_BOOST: 2,
  PUSH_INTERVAL_HOURS: 3,
} as const;

// Campaign settings
export const CAMPAIGN = {
  DEFAULT_DURATION_DAYS: 7,
  DAYS_IN_WEEK: 7,
  LIFETIME_VALUE_THRESHOLD: 500,
  DAYS_30: 30,
  DAYS_60: 60,
  DAYS_7: 7,
  DAYS_14: 14,
  VISITOR_MULTIPLIER: 15,
  MS_PER_DAY: 24 * 60 * 60 * 1000,
} as const;

// Message limits
export const MESSAGE_LIMITS = {
  SMS_MAX_LENGTH: 160,
  FREQUENCY_CAP_MAX: 20,
  MIN_DATA_SOURCES: 3,
  MIN_CHANNELS: 4,
} as const;

// Encoding bases
export const ENCODING = {
  BASE_36: 36,
  SUBSTRING_START: 2,
} as const;

// KPI adjustments
export const KPI_ADJUSTMENTS = {
  ROAS_BOOST: 0.5,
  CPA_REDUCTION: 10,
  CTR_BOOST: 0.005,
} as const;
