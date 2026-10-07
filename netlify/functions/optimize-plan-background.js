var Anthropic = require("@anthropic-ai/sdk");

var AT_BASE = "appCtUgAKIoaa6ECh";
var AT_PLANS_TBL = "tblOAtGXbtWewEAm0";

var SYSTEM_PROMPT = [
  "You are AdCraft's advertising optimization strategist. Your job is to analyze a business's actual advertising performance against its existing AdCraft media plan and recommend specific, practical changes that will improve performance.",
  "",
  "You will receive:",
  "1. The business's existing AdCraft advertising plan, including its business context, goals, target audience, recommended channels, budget allocation, strategy, and KPIs.",
  "2. Uploaded advertising performance data, which may include fields such as channel, campaign, date, spend, impressions, clicks, conversions, revenue, CPM, CTR, CPC, CPA, ROAS, or similar metrics.",
  "",
  "Your analysis must connect performance data back to the strategy. Do not simply summarize the uploaded metrics.",
  "",
  "ANALYSIS APPROACH",
  "",
  "First, understand the original plan:",
  "- Identify the primary business goal.",
  "- Identify the planned monthly advertising budget.",
  "- Identify the role each recommended channel was intended to play.",
  "- Identify the primary KPIs that matter for the stated goal.",
  "- Understand the target customer, geography, business economics, and any relevant constraints in the plan.",
  "",
  "Then analyze the uploaded data:",
  "- Evaluate performance by channel and campaign.",
  "- Calculate or validate relevant efficiency metrics when the underlying data is available.",
  "- Look for meaningful trends over time.",
  "- Identify strong performers, weak performers, inefficient spend, and potential scaling opportunities.",
  "- Compare channels fairly based on their intended role. Do not judge awareness channels solely by last-click conversions or ROAS if the original strategy assigned them an upper-funnel role.",
  "- Distinguish between insufficient data and poor performance. Do not recommend major changes based on tiny samples.",
  "- Look for signs of diminishing returns, rising costs, declining conversion rates, or improving performance over time.",
  "- Flag suspicious or internally inconsistent data rather than inventing an explanation.",
  "",
  "OPTIMIZATION",
  "",
  "Recommend what the advertiser should do next.",
  "",
  "For every significant recommendation:",
  "- State what should change.",
  "- Explain why using specific evidence from the uploaded performance data.",
  "- Explain how the change relates to the original advertising strategy.",
  "- Quantify the recommended change whenever the data supports it.",
  "",
  "When recommending budget changes, provide a revised channel allocation using the EXISTING planned advertising budget unless the data provides a compelling reason to recommend changing total spend. Do not casually recommend that a small business spend more money.",
  "",
  "Budget recommendations must add up to the stated total budget. Do not allocate negative budgets or more than 100% of available spend.",
  "",
  "Do not automatically move all budget to the channel with the highest ROAS. Consider channel role, scale, audience saturation, funnel coverage, data volume, and whether performance is sustainable.",
  "",
  "Separate channel_actions into these exact action values: scale, maintain, optimize, reduce.",
  "",
  "INSIGHTS",
  "",
  "Prioritize insights that materially affect a business decision. Avoid observations such as 'Channel X had 10,000 impressions' unless that fact contributes to a recommendation.",
  "",
  "Do not confuse correlation with causation. Do not claim one channel caused another channel's performance unless the data supports that conclusion.",
  "",
  "Do not invent benchmarks. If external benchmarks were not provided, evaluate performance relative to the advertiser's own channels, campaigns, trends, goals, and economics.",
  "",
  "Do not invent missing data. Clearly state when a conclusion cannot be made because necessary information is unavailable.",
  "",
  "When data quality or sample size limits confidence, explicitly label the recommendation as directional.",
  "",
  "TONE",
  "",
  "Write for a small-business owner who is intelligent but may not be an advertising expert. Be confident, specific, practical, and easy to understand. Explain advertising terminology when necessary. Avoid agency jargon, vague recommendations, and excessive caveats.",
  "",
  "OUTPUT REQUIREMENTS",
  "",
  "Return structured JSON only. Do not wrap the response in Markdown code fences. Do not include any text before or after the JSON.",
  "",
  "The JSON must use this exact schema. Every required field must be present. If information is unavailable, use null or an empty array rather than inventing information. All budget numbers must be integers. Recommended channel budgets in budget_reallocation must sum to the total planned budget.",
  "",
  "Be concise. Every string field must be 1-3 sentences. launch_plan phases must be 2-3 sentences each. assumptions: maximum 3 items, one sentence each. smart_next_moves: maximum 3 items, one sentence each. channel_actions findings and recommendations: 2 sentences each maximum. Keep the total JSON under 6000 words.",
  "",
  "Required JSON schema:",
  "{",
  "  \"plan_name\": \"3 to 6 word title including the word Optimized\",",
  "  \"performance_snapshot\": {",
  "    \"total_spend_analyzed\": 4200,",
  "    \"date_range\": \"Aug-Sep 2025\",",
  "    \"top_performer\": { \"channel\": \"Google Search\", \"metric\": \"3.8x ROAS\" },",
  "    \"bottom_performer\": { \"channel\": \"TikTok\", \"metric\": \"$42 CPA vs $18 goal\" },",
  "    \"key_insight\": \"One sentence strategic summary of what the data shows overall.\"",
  "  },",
  "  \"your_advertising_strategy\": \"2 to 3 sentence strategic point of view reflecting the performance findings.\",",
  "  \"the_opportunity\": \"The most important insight from the performance data.\",",
  "  \"what_advertising_needs_to_do\": \"The revised primary job of advertising based on what the data shows.\",",
  "  \"recommended_approach\": \"The revised central strategic choice in plain language.\",",
  "  \"budget_reallocation\": [",
  "    {",
  "      \"channel\": \"Google Search\",",
  "      \"current_budget\": 400,",
  "      \"recommended_budget\": 850,",
  "      \"change_dollars\": 450,",
  "      \"direction\": \"increase\",",
  "      \"rationale\": \"Specific evidence-based reason for this change.\"",
  "    }",
  "  ],",
  "  \"channel_actions\": [",
  "    {",
  "      \"channel\": \"TikTok\",",
  "      \"action\": \"reduce\",",
  "      \"finding\": \"Specific data-driven observation about this channel.\",",
  "      \"recommendation\": \"Specific tactical change to make.\",",
  "      \"budget_impact\": \"Reduce by $450\"",
  "    }",
  "  ],",
  "  \"recommended_channels\": [",
  "    { \"channel\": \"\", \"role\": \"\", \"audience\": \"\", \"what_to_run\": \"\", \"cta\": \"\", \"why\": \"\" }",
  "  ],",
  "  \"budget\": [",
  "    { \"channel\": \"\", \"monthly_investment\": 0, \"percentage\": \"0%\", \"purpose\": \"\" }",
  "  ],",
  "  \"who_to_target\": [",
  "    { \"audience_group\": \"\", \"description\": \"\" }",
  "  ],",
  "  \"messaging\": [",
  "    { \"territory\": \"\", \"rationale\": \"\" }",
  "  ],",
  "  \"creative\": \"What revised ads should look like based on what performed well.\",",
  "  \"campaign_timing\": \"Revised approach to spend and messaging over time.\",",
  "  \"how_to_measure_success\": {",
  "    \"business_outcomes\": [],",
  "    \"media_signals\": []",
  "  },",
  "  \"what_to_watch\": [",
  "    { \"signal\": \"Google Search CPA\", \"target\": \"Hold below $18\", \"timeframe\": \"30 days\" }",
  "  ],",
  "  \"what_i_would_not_do\": [",
  "    { \"tactic\": \"\", \"reason\": \"\" }",
  "  ],",
  "  \"smart_next_moves\": [],",
  "  \"launch_plan\": {",
  "    \"days_1_30\": \"\",",
  "    \"days_31_60\": \"\",",
  "    \"days_61_90\": \"\"",
  "  },",
  "  \"assumptions\": []",
  "}"
].join("\n");

exports.handler = async function (event) {
  var body;
  try { body = JSON.parse(event.body); } catch (e) {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  var recordId = body.recordId;
  var originalPlanId = body.originalPlanId;
  var files = body.files || [];

  if (!recordId || !originalPlanId) {
    return { statusCode: 400, body: "Missing recordId or originalPlanId" };
  }

  var token = process.env.AIRTABLE_TOKEN;

  // 1. Fetch the original plan from Airtable
  var originalPlan = null;
  var originalPlanName = "";
  try {
    var planRes = await fetch(
      "https://api.airtable.com/v0/" + AT_BASE + "/" + AT_PLANS_TBL + "/" + originalPlanId,
      { headers: { Authorization: "Bearer " + token } }
    );
    var planData = await planRes.json();
    originalPlanName = planData.fields["Plan Name"] || "Untitled Plan";
    var planText = planData.fields["Plan Output"] || "";
    if (planText) {
      try { originalPlan = JSON.parse(planText); } catch (e) {
        originalPlan = planText;
      }
    }
    console.log("Fetched original plan:", originalPlanName);
  } catch (err) {
    console.error("Failed to fetch original plan:", err.message);
    await updateRecord(token, recordId, { "Status": "Error", "Plan Output": "Failed to fetch original plan: " + err.message });
    return { statusCode: 500, body: "Failed to fetch original plan" };
  }

  // 2. Parse uploaded files to text
  var performanceText = "";
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    try {
      var buf = Buffer.from(file.data, "base64");
      var filename = (file.filename || "").toLowerCase();

      if (filename.endsWith(".csv") || (file.mimeType || "").includes("csv")) {
        performanceText += "\n\n--- File: " + (file.filename || "file" + (i + 1)) + " ---\n";
        performanceText += buf.toString("utf8");
      } else if (filename.endsWith(".xlsx") || filename.endsWith(".xls") || (file.mimeType || "").includes("spreadsheet")) {
        try {
          var XLSX = require("xlsx");
          var workbook = XLSX.read(buf, { type: "buffer" });
          performanceText += "\n\n--- File: " + (file.filename || "file" + (i + 1)) + " ---\n";
          workbook.SheetNames.forEach(function (sheetName) {
            var sheet = workbook.Sheets[sheetName];
            var csv = XLSX.utils.sheet_to_csv(sheet);
            performanceText += "Sheet: " + sheetName + "\n" + csv + "\n";
          });
        } catch (xlsxErr) {
          console.warn("XLSX parse failed, using raw text:", xlsxErr.message);
          performanceText += "\n\n--- File: " + (file.filename || "file" + (i + 1)) + " (raw) ---\n";
          performanceText += buf.toString("utf8");
        }
      } else {
        performanceText += "\n\n--- File: " + (file.filename || "file" + (i + 1)) + " ---\n";
        performanceText += buf.toString("utf8");
      }
    } catch (parseErr) {
      console.warn("File parse error for file " + i + ":", parseErr.message);
    }
  }

  if (!performanceText.trim()) {
    await updateRecord(token, recordId, { "Status": "Error", "Plan Output": "No readable performance data found in uploaded files." });
    return { statusCode: 400, body: "No readable performance data" };
  }

  if (performanceText.length > 80000) {
    performanceText = performanceText.substring(0, 80000) + "\n\n[Data truncated for length]";
  }

  // 3. Build the prompt
  var prompt = "ORIGINAL ADVERTISING PLAN:\n" +
    JSON.stringify(originalPlan, null, 2) +
    "\n\nACTUAL PERFORMANCE DATA FROM THE BUSINESS:\n" +
    performanceText +
    "\n\nAnalyze the performance data against the original plan and produce an optimized advertising plan using the exact JSON schema specified. The recommended budgets in budget_reallocation must sum to the same total as the original plan's budget. Reference specific numbers from the performance data to justify every recommendation. Do not casually recommend spending more money.";

  // 4. Call Claude
  var planText;
  try {
    var client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    console.log("Calling Claude for optimization, recordId:", recordId);
    var message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });
    planText = message.content[0].text;
    console.log("Claude optimization response length:", planText.length);

    // Strip markdown fences
    planText = planText.trim();
    var tick = String.fromCharCode(96);
    var fence = tick + tick + tick;
    if (planText.slice(0, 3) === fence) {
      var nl = planText.indexOf("\n");
      planText = nl !== -1 ? planText.slice(nl + 1) : planText.slice(3);
      if (planText.slice(-3) === fence) planText = planText.slice(0, -3);
      planText = planText.trim();
    }

    // Check if Claude stopped early (truncation)
    var stopReason = message.stop_reason;
    console.log("stop_reason=" + stopReason + " length=" + planText.length);
    if (stopReason === "max_tokens") {
      console.error("Hit max_tokens - output truncated");
      await updateRecord(token, recordId, { "Status": "Error", "Plan Output": "Generation was cut short. Please try again with a smaller dataset." });
      return { statusCode: 200, body: "Truncated" };
    }

    // Sanitize smart quotes using safe unicode escapes
    planText = planText
      .replace(/"|"/g, '"')
      .replace(/'|'/g, "'")
      .replace(/-|-/g, "-")
      .replace(/.../g, "...");

    // Validate JSON
    try {
      JSON.parse(planText);
      console.log("Optimization returned valid JSON");
    } catch (e) {
      console.warn("Optimization did not return valid JSON:", e.message);
    }
  } catch (err) {
    console.error("Anthropic error:", err.message);
    await updateRecord(token, recordId, { "Status": "Error", "Plan Output": "Generation failed: " + err.message });
    return { statusCode: 500, body: "Claude API error" };
  }

  // 5. Save to Airtable
  try {
    var optimizedName = originalPlanName + " - Optimized";
    console.log("Saving optimized plan, length:", planText.length);
    await updateRecord(token, recordId, {
      "Plan Output": planText,
      "Plan Name": optimizedName,
      "Status": "Ready",
    });
    console.log("Optimized plan saved successfully");
  } catch (err) {
    console.error("Airtable update error:", err.message);
    return { statusCode: 500, body: "Failed to save optimized plan" };
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
