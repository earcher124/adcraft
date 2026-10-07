// budget-advisor.js
// POST /api/budget-advisor
// Pro feature: Given business inputs, suggests a budget range with rationale.
// Requires authentication. Available to all tiers (free gets a teaser, Pro gets full detail).

const Anthropic = require("@anthropic-ai/sdk");

const AT_BASE      = "appCtUgAKIoaa6ECh";
const AT_USERS_TBL = "tbl7fisATFgQXPOhP";
const AT_TOKEN     = process.env.AIRTABLE_TOKEN;

const SYSTEM_PROMPT = `You are AdCraft's Budget Advisor — a senior advertising strategist who helps small and medium-sized businesses figure out the right advertising budget. You receive business profile information and return a data-driven budget recommendation with three tiers.

Your job is to reason like an experienced strategist: consider industry norms, the business's revenue and maturity, their goal, competitive landscape, and what advertising can realistically achieve at each spend level.

Return your entire response as a single valid JSON object with no markdown, no code fences, and no text before or after. The JSON must contain exactly these keys:

- "strategic_context": A 2–3 sentence strategic read on this business's advertising situation. What is the core opportunity or challenge? What should budget sizing be trying to solve?
- "revenue_benchmark": A string like "3–5% of revenue" explaining what percentage of monthly revenue this budget range represents, and whether that is below, at, or above category norms for this business type.
- "tiers": An array of exactly 3 objects, each with:
  - "label": One of "Conservative", "Recommended", "Aggressive"
  - "monthly_budget": A number (integer, no dollar sign)
  - "percent_of_revenue": A string like "2.1%"
  - "headline": A 5–8 word description of what this budget achieves
  - "what_you_get": 2–3 sentences describing what advertising coverage and outcomes are realistic at this tier
  - "tradeoff": 1 sentence on the downside or risk of this tier
  - "best_for": One sentence on which type of business or situation this tier is ideal for
- "recommendation_rationale": 2–3 sentences explaining why the middle tier is your recommended starting point for this specific business
- "important_caveat": 1 sentence on what factor could most change this recommendation (e.g. competitive pressure, seasonality, untested channels)

The three tiers must represent meaningfully different strategies — not just slightly different numbers. Conservative should feel safe but limited. Recommended should feel strategic and achievable. Aggressive should feel growth-oriented but require commitment. Budget numbers should be realistic for a small business — do not recommend $50K/month to a business with $8K in revenue.`;

async function getUser(email) {
  var filter = encodeURIComponent(`{Email}="${email}"`);
  var res = await fetch(`https://api.airtable.com/v0/${AT_BASE}/${AT_USERS_TBL}?filterByFormula=${filter}&maxRecords=1`, {
    headers: { Authorization: "Bearer " + AT_TOKEN },
  });
  if (!res.ok) return null;
  var data = await res.json();
  if (!data.records || !data.records.length) return null;
  return data.records[0].fields;
}

exports.handler = async function(event) {
  var headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };

  var body;
  try { body = JSON.parse(event.body || "{}"); }
  catch(e) { return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid request body" }) }; }

  var { email, bizName, bizType, productType, targetCustomer, goal, geo, monthlyRevenue, currentAdvertising } = body;

  if (!email) return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing email" }) };

  // Auth check
  var user = await getUser(email);
  if (!user) return { statusCode: 401, headers, body: JSON.stringify({ error: "User not found" }) };

  var tier = user["Tier"] || user.tier || "Free";

  // Build the prompt
  var prompt = [
    "Please provide a budget recommendation for this business.",
    "",
    "--- BUSINESS PROFILE ---",
    "Business Name: " + (bizName || "Not provided"),
    "Business Type: " + (bizType || "Not provided"),
    "Product / Service: " + (productType || "Not provided"),
    "Target Customer: " + (targetCustomer || "Not provided"),
    "Primary Goal: " + (goal || "Not provided"),
    "Geography: " + (geo || "Not provided"),
    "Monthly Revenue: " + (monthlyRevenue ? "$" + String(monthlyRevenue).replace(/[^0-9.]/g, "") : "Not provided"),
    "Current Advertising: " + (currentAdvertising || "None described"),
  ].join("\n");

  try {
    var client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    var message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    var raw = message.content[0].text.trim();

    // Strip markdown fences
    var tick = String.fromCharCode(96);
    var fence = tick + tick + tick;
    if (raw.slice(0, 3) === fence) {
      var nl = raw.indexOf("\n");
      raw = nl !== -1 ? raw.slice(nl + 1) : raw.slice(3);
      if (raw.slice(-3) === fence) raw = raw.slice(0, -3);
      raw = raw.trim();
    }

    // Sanitize smart quotes
    raw = raw
      .replace(/“|”/g, '"')
      .replace(/‘|’/g, "'")
      .replace(/–|—/g, "-")
      .replace(/…/g, "...");

    var result = JSON.parse(raw);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ recommendation: result, tier }),
    };
  } catch(err) {
    console.error("Budget advisor error:", err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Advisor failed: " + err.message }) };
  }
};
