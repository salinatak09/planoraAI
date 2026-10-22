import { GoogleGenAI } from "@google/genai";
import type { AIIdea } from "@/lib/types";

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing GEMINI_API_KEY environment variable. Provide a valid Gemini API key in .env.local to enable GenAI generation."
    );
  }

  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }

  return aiClient;
}

export interface GenerateIdeasParams {
  eventType: string;
  theme: string;
  guestCount: number;
  budget: number;
  focusArea?: "all" | "theme" | "decor" | "activity" | "menu" | "logistics";
  customPrompt?: string;
}

/**
 * Generates contextual event ideas using Gemini 2.5 Flash / official SDK
 */
export async function generateEventIdeas(
  params: GenerateIdeasParams
): Promise<AIIdea[]> {
  const apiKey = process.env.GEMINI_API_KEY;

  // Graceful fallback for local development when API key is not yet set
  if (!apiKey || apiKey === "AIzaSy..." || apiKey.trim() === "") {
    return generateFallbackIdeas(params);
  }

  const ai = getGeminiClient();

  const systemInstruction = `You are Planora AI, an elite, creative event planner and designer.
Generate thoughtful, actionable, and tasteful ideas for the user's event.
Return ONLY valid JSON matching this format:
[
  {
    "title": "Creative headline",
    "description": "2-3 concise sentences explaining the concept and execution.",
    "category": "theme" | "decor" | "activity" | "menu" | "logistics",
    "estimatedCostRange": "$300 - $600",
    "tags": ["interactive", "floral", "evening"]
  }
]
No extra markdown, no code block backticks if possible, just raw JSON array.`;

  const prompt = `Plan a ${params.eventType} with the theme "${params.theme}".
Guest Count: ${params.guestCount} guests
Target Budget: $${params.budget.toLocaleString()}
Focus Area: ${params.focusArea || "all"}
${params.customPrompt ? `Special Note: ${params.customPrompt}` : ""}

Please generate 4 to 6 creative, high-impact ideas.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "";
    const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (Array.isArray(parsed)) {
      return parsed.map((item, index) => ({
        id: `idea-${Date.now()}-${index}`,
        title: item.title || "Custom Event Concept",
        description: item.description || "",
        category: item.category || "theme",
        estimatedCostRange: item.estimatedCostRange || "Varies",
        tags: Array.isArray(item.tags) ? item.tags : [],
        createdAt: new Date().toISOString(),
      }));
    }

    return generateFallbackIdeas(params);
  } catch (error) {
    console.error("Gemini API generation error:", error);
    // Return high quality fallback ideas so user experience is not disrupted
    return generateFallbackIdeas(params);
  }
}

function generateFallbackIdeas(params: GenerateIdeasParams): AIIdea[] {
  const timestamp = new Date().toISOString();
  return [
    {
      id: `fallback-${Date.now()}-1`,
      title: `${capitalize(params.theme)} Welcome Experience`,
      description: `Greet your ${params.guestCount} guests with signature mocktails or welcome champagne infused with botanicals matching the ${params.theme} aesthetic.`,
      category: "menu",
      estimatedCostRange: "$200 - $450",
      tags: ["welcome", "refreshments", params.eventType],
      createdAt: timestamp,
    },
    {
      id: `fallback-${Date.now()}-2`,
      title: "Interactive Memory & Photo Wall",
      description: `Create a custom backdrop featuring polaroid cameras, handwritten message tags, and ambient fairy lights tailored to your celebration.`,
      category: "decor",
      estimatedCostRange: "$150 - $350",
      tags: ["interactive", "photos", "decor"],
      createdAt: timestamp,
    },
    {
      id: `fallback-${Date.now()}-3`,
      title: "Curated Acoustic Sunset Set",
      description: `Feature a live acoustic duo or custom ambient playlist designed to transition guests seamlessly from arrival to dinner.`,
      category: "activity",
      estimatedCostRange: "$400 - $800",
      tags: ["music", "ambience", "live"],
      createdAt: timestamp,
    },
    {
      id: `fallback-${Date.now()}-4`,
      title: "Sustainable Keepsake Station",
      description: `Provide locally-crafted miniature succulent pots or artisan confection boxes as mindful take-home favors.`,
      category: "logistics",
      estimatedCostRange: "$250 - $500",
      tags: ["favors", "sustainable", "takeaway"],
      createdAt: timestamp,
    },
  ];
}

function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}
