const Anthropic = require("@anthropic-ai/sdk");

const SYSTEM_PROMPT = `You are a senior media strategist and advertising expert. You have been given a specific advertising plan that was created for this business, and your job is to help the business owner understand, execute, and refine that plan.

Your role:
- Answer questions about the plan with specificity — reference their actual channels, budget numbers, and recommendations
- Give practical, step-by-step execution guidance when asked how to get started
- Explain strategy choices in plain language without jargon
- Help prioritize when the owner feels overwhelmed ("what should I do first?")
- Push back constructively if they want to do something that contradicts the strategy
- Be direct and confident — you are an expert, not a yes-machine

Tone: Senior strategist presenting to a smart client. Practical, clear, no fluff. Short paragraphs. Use bullet points when listing steps. Never pad responses with generic encouragement.

You have full context of their advertising plan below. Always tailor answers to their specific business, budget, and recommended channels — never give generic advice that ignores the plan.`;

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const { messages, plan } = body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return { statusCode: 400, body: "Missing messages" };
  }

  // Build system prompt with plan context
  const systemWithPlan = plan
    ? SYSTEM_PROMPT + "\n\n--- THE BUSINESS'S ADVERTISING PLAN ---\n" + JSON.stringify(plan, null, 2)
    : SYSTEM_PROMPT;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // Use streaming
    const stream = await client.messages.stream({
      model: "claude-opus-4-5",
      max_tokens: 1024,
      system: systemWithPlan,
      messages: messages,
    });

    // Collect full response for streaming via chunked transfer
    let fullText = "";
    const chunks = [];

    for await (const chunk of stream) {
      if (chunk.type === "content_block_delta" && chunk.delta?.type === "text_delta") {
        fullText += chunk.delta.text;
        chunks.push(chunk.delta.text);
      }
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ response: fullText }),
    };
  } catch (err) {
    console.error("Anthropic error:", err.message);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Failed to get response: " + err.message }),
    };
  }
};
