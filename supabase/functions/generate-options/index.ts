import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, playerCount } = await req.json();

    if (!openAIApiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    console.log(`Generating ${playerCount} options for prompt: ${prompt}`);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4-0125-preview",
        messages: [
          {
            role: "system",
            content: `You are a game assistant. When given a category, return exactly ${playerCount} unique items within that category, preferring options that are humorous or somewhat unexpected. Provide only the items, separated by commas, with no additional text or formatting.`,
          },
          {
            role: "user",
            content: `Category: ${prompt}. Remember, provide exactly ${playerCount} items, comma-separated.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || "Unknown error"}`);
    }

    const data = await response.json();

    if (!data.choices?.[0]?.message?.content) {
      console.error("Unexpected OpenAI response format:", data);
      throw new Error("Invalid response format from OpenAI");
    }

    const options = data.choices[0].message.content.split(",").map((item: string) => item.trim());

    console.log("Generated options:", options);

    if (options.length !== playerCount) {
      console.error(`Expected ${playerCount} options but got ${options.length}`);
      throw new Error(
        `Invalid number of options generated. Expected ${playerCount}, got ${options.length}`
      );
    }

    return new Response(JSON.stringify({ options }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-options function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
