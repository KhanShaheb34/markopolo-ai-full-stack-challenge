import { CAMPAIGN, FREQUENCY_LIMITS, HOURS } from "./constants";
import type { ChannelExecution } from "./types";

export const chooseTiming = (
  executions: ChannelExecution[],
  prompt: string,
  timezone = "Asia/Dhaka"
): ChannelExecution[] => {
  const promptLower = prompt.toLowerCase();
  const isFlashSale =
    promptLower.includes("flash sale") || promptLower.includes("urgent");
  const isWeekendAllowed = isFlashSale || promptLower.includes("weekend");

  return executions.map((execution) => {
    const updatedExecution = { ...execution };

    // Apply business hours window based on channel type
    switch (execution.channel) {
      case "email": {
        // Email: Morning and evening slots
        updatedExecution.schedule = {
          start: "09:00",
          end: "11:30",
          timezone,
        };

        // Add evening slot for nurture campaigns
        if (
          promptLower.includes("nurture") ||
          promptLower.includes("relationship")
        ) {
          updatedExecution.schedule.end = "19:00";
        }
        break;
      }

      case "sms": {
        // SMS: Respect quiet hours (not before 08:00 or after 21:00)
        updatedExecution.schedule = {
          start: "10:00",
          end: "20:00",
          timezone,
        };

        // Flash sales can extend hours slightly
        if (isFlashSale) {
          updatedExecution.schedule.start = "09:00";
          updatedExecution.schedule.end = "21:00";
        }
        break;
      }

      case "whatsapp": {
        // WhatsApp: Business hours only
        updatedExecution.schedule = {
          start: "09:00",
          end: "18:00",
          timezone,
        };
        break;
      }

      case "push": {
        // Push: Can be more flexible with timing
        updatedExecution.schedule = {
          start: "08:00",
          end: "21:00",
          timezone,
        };
        break;
      }

      case "voice": {
        // Voice: Strict business hours
        updatedExecution.schedule = {
          start: "10:00",
          end: "17:00",
          timezone,
        };
        break;
      }

      case "messenger": {
        // Messenger: Social media hours
        updatedExecution.schedule = {
          start: "09:00",
          end: "18:00",
          timezone,
        };
        break;
      }

      case "ads": {
        // Ads: 24/7 with algorithm optimization
        updatedExecution.schedule = {
          start: "00:00",
          end: "23:59",
          timezone,
        };
        break;
      }

      default: {
        updatedExecution.schedule = {
          start: "00:00",
          end: "23:59",
          timezone,
        };
      }
    }

    // Apply weekend throttling
    if (!isWeekendAllowed) {
      // Reduce frequency for weekend
      updatedExecution.frequencyCapPerUserPerWeek = Math.max(
        1,
        Math.floor(
          updatedExecution.frequencyCapPerUserPerWeek *
            FREQUENCY_LIMITS.WEEKEND_REDUCTION_FACTOR
        )
      );
    }

    // Adjust frequency based on prompt urgency
    if (isFlashSale) {
      // Increase frequency for urgent campaigns
      updatedExecution.frequencyCapPerUserPerWeek = Math.min(
        CAMPAIGN.DAYS_IN_WEEK,
        updatedExecution.frequencyCapPerUserPerWeek +
          FREQUENCY_LIMITS.FLASH_SALE_BOOST
      );
    }

    return updatedExecution;
  });
};

// Helper to validate timing constraints
export const validateTiming = (execution: ChannelExecution): boolean => {
  const start = execution.schedule.start;
  const end = execution.schedule.end;

  // Basic validation
  if (!(start && end)) {
    return false;
  }

  const startHour = Number.parseInt(start.split(":")[0], 10);
  const endHour = Number.parseInt(end.split(":")[0], 10);

  // Ensure end is after start
  if (endHour <= startHour) {
    return false;
  }

  // Channel-specific validations
  switch (execution.channel) {
    case "sms":
    case "voice": {
      // Respect quiet hours (21:00-08:00)
      return startHour >= HOURS.QUIET_START && endHour <= HOURS.QUIET_END;
    }

    case "whatsapp":
    case "messenger": {
      // Business hours only
      return startHour >= HOURS.BUSINESS_START && endHour <= HOURS.BUSINESS_END;
    }

    default:
      return true;
  }
};

// Generate optimal send times within schedule window
export const generateSendTimes = (
  execution: ChannelExecution,
  _campaignDuration = 7 // days
): string[] => {
  const sendTimes: string[] = [];
  const startHour = Number.parseInt(execution.schedule.start.split(":")[0], 10);
  const endHour = Number.parseInt(execution.schedule.end.split(":")[0], 10);

  // Generate optimal times based on channel
  switch (execution.channel) {
    case "email": {
      // Email: Morning (09:00-11:00) and evening (16:00-18:00) peaks
      sendTimes.push("09:30", "10:30", "16:30", "17:30");
      break;
    }

    case "sms": {
      // SMS: Lunch and early evening
      sendTimes.push("12:00", "18:00");
      break;
    }

    case "push": {
      // Push: Multiple times throughout day
      for (
        let hour = startHour;
        hour < endHour;
        hour += FREQUENCY_LIMITS.PUSH_INTERVAL_HOURS
      ) {
        sendTimes.push(`${hour.toString().padStart(2, "0")}:00`);
      }
      break;
    }

    default: {
      // Default: Mid-morning and mid-afternoon
      sendTimes.push("10:00", "15:00");
      break;
    }
  }

  return sendTimes.filter((time) => {
    const hour = Number.parseInt(time.split(":")[0], 10);
    return hour >= startHour && hour < endHour;
  });
};
