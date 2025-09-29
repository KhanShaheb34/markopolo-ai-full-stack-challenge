// biome-ignore-all lint/style/useNamingConvention: unnecessary
// biome-ignore-all lint/style/noMagicNumbers: unnecessary

import type { NextRequest } from "next/server";
import { assemblePlanByStages } from "@/lib/plan/assemble-plan";
import type { PlanningInputs } from "@/lib/plan/types";
import { validatePlanningInputs } from "@/lib/schema/plan";

// Enable streaming for this route
export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  try {
    // Extract and validate request parameters
    const prompt = searchParams.get("prompt");
    const selectedSources = searchParams.get("sources")?.split(",") || [];
    const selectedChannels = searchParams.get("channels")?.split(",") || [];
    const timezone = searchParams.get("timezone") || "Asia/Dhaka";

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: { message: "Prompt is required" } }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate inputs
    const validatedInputs = validatePlanningInputs({
      prompt,
      selectedSources,
      selectedChannels,
      timezone,
    });

    // Create planning inputs with proper signals type
    const inputs: PlanningInputs = {
      prompt: validatedInputs.prompt,
      selectedSources: validatedInputs.selectedSources,
      selectedChannels: validatedInputs.selectedChannels,
      timezone: validatedInputs.timezone,
      signals: {}, // Will be populated by assemblePlanByStages
    };

    // Create ReadableStream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          // Stream planning stages
          for await (const chunk of assemblePlanByStages(inputs)) {
            // Format as SSE event
            let data: string;

            if ("stage" in chunk) {
              data = JSON.stringify({ status: { stage: chunk.stage } });
            } else if ("partial" in chunk) {
              data = JSON.stringify({ partial: chunk.partial });
            } else if ("final" in chunk) {
              data = JSON.stringify({ final: chunk.final });
            } else {
              // Error chunk
              data = JSON.stringify({
                error: { message: "Unknown chunk type" },
              });
            }

            // Send SSE formatted data
            const sseData = `data: ${data}\n\n`;
            controller.enqueue(encoder.encode(sseData));

            // Add delay between chunks for better UX (longer to see streaming)
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }

          // Close the stream
          controller.close();
        } catch (error) {
          // Send error and close
          const errorData = JSON.stringify({
            error: {
              message:
                error instanceof Error ? error.message : "Planning failed",
            },
          });

          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    // Return SSE response
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Cache-Control",
      },
    });
  } catch (error) {
    // Handle validation or other errors
    return new Response(
      JSON.stringify({
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Invalid request parameters",
        },
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Optional: Support POST for complex payloads
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedInputs = validatePlanningInputs(body);

    // Create planning inputs with proper signals type
    const inputs: PlanningInputs = {
      prompt: validatedInputs.prompt,
      selectedSources: validatedInputs.selectedSources,
      selectedChannels: validatedInputs.selectedChannels,
      timezone: validatedInputs.timezone,
      signals: {}, // Will be populated by assemblePlanByStages
    };

    // Create ReadableStream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          for await (const chunk of assemblePlanByStages(inputs)) {
            let data: string;

            if ("stage" in chunk) {
              data = JSON.stringify({ status: { stage: chunk.stage } });
            } else if ("partial" in chunk) {
              data = JSON.stringify({ partial: chunk.partial });
            } else if ("final" in chunk) {
              data = JSON.stringify({ final: chunk.final });
            } else {
              data = JSON.stringify({
                error: { message: "Unknown chunk type" },
              });
            }

            const sseData = `data: ${data}\n\n`;
            controller.enqueue(encoder.encode(sseData));

            await new Promise((resolve) => setTimeout(resolve, 300));
          }

          controller.close();
        } catch (error) {
          const errorData = JSON.stringify({
            error: {
              message:
                error instanceof Error ? error.message : "Planning failed",
            },
          });

          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, Cache-Control",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: {
          message:
            error instanceof Error ? error.message : "Invalid request body",
        },
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
