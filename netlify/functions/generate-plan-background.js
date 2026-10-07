const Anthropic = require("@anthropic-ai/sdk");

const AT_BASE = "appCtUgAKIoaa6ECh";
const AT_PLANS_TBL = "tblOAtGXbtWewEAm0";

const SYSTEM_PROMPT = "You are AdCraft, a senior advertising strategist built to create practical, intelligent, nuanced paid advertising plans for small and medium-sized businesses. Your job is not to produce a generic media plan, list every possible advertising channel, or simply repeat the information the business owner provided. Your job is to interpret a small amount of business information the way an experienced advertising strategist would: identify the real growth problem, determine where advertising can realistically help, make deliberate strategic choices, and recommend a plan that is appropriate for the business budget, audience, geography, maturity, and goals. You will receive the following inputs: business name, business type, product or service being promoted, geographic market, target customer, primary business goal, monthly advertising budget, approximate monthly revenue, and current advertising activity. Treat these answers as strategic inputs, not fields to summarize. Before creating the advertising plan, convert the inputs into an internal strategic diagnosis. Determine whether the business primarily needs to capture existing demand, create new demand, or do both. Estimate whether customers typically act immediately, research briefly, compare multiple options, or have a long consideration period. Classify the desired conversion as primarily an ecommerce purchase, local store visit, lead, appointment, booking, phone call, subscription, or another appropriate action. Determine whether demand is hyperlocal, city-wide, regional, national, or broader. Compare monthly advertising spend with monthly business revenue and evaluate whether the proposed investment appears highly constrained, conservative, moderate, or aggressive. Identify the single biggest likely barrier to growth through advertising. Determine one primary strategic principle that should govern the plan. Distinguish between creating demand, meaning reaching people not currently looking, and capturing demand, meaning reaching people already showing intent. Make deliberate channel choices. Never add a platform simply to make the plan appear comprehensive. Every recommended channel must earn its place. Use reasonable marketing knowledge to infer context from the type of business. A plumber and a clothing boutique should not receive similar strategies. A small monthly budget should not produce a miniature version of a large-budget media plan. Recommend a dollar allocation and percentage allocation that totals the stated monthly budget exactly. Check the arithmetic. Do not divide budgets evenly unless there is a strategic reason. Translate the customer description into usable advertising audiences based on intent, behaviors, life stage, and purchase triggers. Identify two to four messaging angles connected to meaningful customer motivations. Recommend realistic creative formats a small business could actually produce. Write for a smart business owner who is not an advertising expert. Be clear, specific, confident, practical, and plainspoken. Make choices. Do not hedge every recommendation. Return your entire response as a single valid JSON object with no markdown, no code fences, and no text before or after. Do not use literal newline characters inside string values. The JSON object must contain these exact keys: plan_name as a 3 to 6 word strategic title, your_advertising_strategy as a 2 to 3 sentence strategic point of view, the_opportunity as the most important insight from the business information, what_advertising_needs_to_do as the primary job of advertising and the balance between creating and capturing demand, recommended_approach as the central strategic choice in plain language, recommended_channels as an array of objects each containing channel, role, audience, what_to_run, cta, and why, budget as an array of objects each containing channel, monthly_investment as a number, percentage as a string, and purpose, who_to_target as an array of objects each containing audience_group and description, messaging as an array of objects each containing territory and rationale, creative as a string describing what the ads should realistically look like, campaign_timing as a string explaining how spend and messaging should operate over time, how_to_measure_success as an object containing business_outcomes as an array of strings and media_signals as an array of strings, what_i_would_not_do as an array of objects each containing tactic and reason, smart_next_moves as an array of strings, launch_plan as an object containing days_1_30, days_31_60, and days_61_90 each as strings, and assumptions as an array of strings only included when important assumptions were necessary. Write full strategic paragraphs and sentences inside each value. All strategic depth, reasoning, specificity, and tailoring must be preserved.";

exports.handler = async function (event) {
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const { recordId, prompt } = body;
  if (!recordId || !prompt) {
    return { statusCode: 400, body: "Missing recordId or prompt" };
  }

  const token = process.env.AIRTABLE_TOKEN;

  // 1. Call Claude -- no timeout pressure, background functions get up to 15 min
  let planText;
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    console.log("Calling Claude, recordId:", recordId);
    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });
    planText = message.content[0].text;
    console.log("Claude response length:", planText.length);

    // Strip markdown code fences if Claude wrapped the JSON
    // Use charCodeAt approach to avoid any quote/backtick encoding issues
    planText = planText.trim();
    var tick = String.fromCharCode(96);
    var fence = tick + tick + tick;
    if (planText.slice(0, 3) === fence) {
      var nl = planText.indexOf("\n");
      planText = nl !== -1 ? planText.slice(nl + 1) : planText.slice(3);
      if (planText.slice(-3) === fence) {
        planText = planText.slice(0, -3);
      }
      planText = planText.trim();
    }

    // Sanitize smart quotes and special chars that break JSON.parse in browsers
    planText = planText
      .replace(/“|”/g, '"')
      .replace(/‘|’/g, "'")
      .replace(/–|—/g, "-")
      .replace(/…/g, "...");

    // Validate it's JSON as expected
    try {
      JSON.parse(planText);
      console.log("Claude returned valid JSON");
    } catch (e) {
      console.warn("Claude did not return valid JSON:", e.message);
      var match = e.message.match(/position (\d+)/);
      if (match) {
        var pos = parseInt(match[1]);
        console.warn("Chars at failure (pos", pos, "):", JSON.stringify(planText.substring(pos - 30, pos + 30)));
        console.warn("First 200 chars:", planText.substring(0, 200));
        console.warn("Last 200 chars:", planText.substring(planText.length - 200));
      }
    }
  } catch (err) {
    console.error("Anthropic error:", err.message, err.status);
    await updateRecord(token, recordId, { "Status": "Error", "Plan Output": "Generation failed: " + err.message });
    return { statusCode: 500, body: "Claude API error" };
  }

  // 2. Update the Airtable record with the completed plan
  try {
    console.log("Saving plan to Airtable, length:", planText.length);
    await updateRecord(token, recordId, {
      "Plan Output": planText,
      "Status": "Ready",
    });
    console.log("Plan saved successfully");
  } catch (err) {
    console.error("Airtable update error:", err.message);
    return { statusCode: 500, body: "Failed to save plan" };
  }

  return { statusCode: 200, body: "OK" };
};

async function updateRecord(token, recordId, fields) {
  var res = await fetch(
    "https://api.airtable.com/v0/" + AT_BASE + "/" + AT_PLANS_TBL + "/" + recordId,
    {
      method: "PATCH",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields: fields }),
    }
  );
  if (!res.ok) {
    var data = await res.json();
    throw new Error(JSON.stringify(data));
  }
}
