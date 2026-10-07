const Anthropic = require("@anthropic-ai/sdk");

const AT_BASE = "appCtUgAKIoaa6ECh";
const AT_PLANS_TBL = "Plans";

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { prompt, email, bizName } = body;
  if (!prompt) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing prompt" }) };
  }

  // 1. Call Claude
  let planText;
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      system:
        "You are an expert advertising strategist with 20 years of experience across digital and traditional media. " +
        "Create detailed, actionable advertising plans that are specific to the business provided. " +
        "Format your response in clean markdown with clear sections, tables where appropriate, and concrete recommendations. " +
        "Be specific about budgets, channels, timing, and messaging — not generic. " +
        "Write as if you are a senior media director presenting to a client.",
    });
    planText = message.content[0].text;
  } catch (err) {
    console.error("Anthropic error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to generate plan" }) };
  }

  // 2. Save to Airtable
  let recordId;
  try {
    const atRes = await fetch(
      `https://api.airtable.com/v0/${AT_BASE}/${AT_PLANS_TBL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            Name: bizName || "Untitled Plan",
            Plan: planText,
            Email: email || "",
            "Created At": new Date().toISOString(),
          },
        }),
      }
    );

    const atData = await atRes.json();
    if (!atRes.ok) {
      console.error("Airtable error:", atData);
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to save plan", detail: atData }) };
    }
    recordId = atData.id;
  } catch (err) {
    console.error("Airtable error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to save plan" }) };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ recordId, plan: planText }),
  };
};
