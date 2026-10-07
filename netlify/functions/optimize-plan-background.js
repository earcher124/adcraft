var Anthropic = require("@anthropic-ai/sdk");

var AT_BASE = "appCtUgAKIoaa6ECh";
var AT_PLANS_TBL = "tblOAtGXbtWewEAm0";

var SYSTEM_PROMPT = "You are AdCraft, a senior advertising strategist. You are reviewing real advertising performance data uploaded by a business owner and comparing it against their existing advertising plan. Your job is to identify what is working, what is not working, and produce a revised, optimized advertising plan that builds on the successes and fixes the failures. Be specific and data-driven. Reference actual numbers from the performance data. Do not produce a generic plan — every recommendation must be grounded in the performance evidence provided. If a channel is underperforming relative to its allocated budget, say so clearly and recommend reallocation. If a channel is overperforming, say so and recommend scaling it. If the data suggests the audience targeting is off, call it out. If creative performance varies, identify what is working. Maintain the same JSON output schema as the original plan. Return your entire response as a single valid JSON object with no markdown, no code fences, and no text before or after. The JSON object must contain these exact keys: plan_name as a 3 to 6 word strategic title that includes the word Optimized, your_advertising_strategy as a 2 to 3 sentence strategic point of view reflecting the performance findings, the_opportunity as the most important insight from the performance data, what_advertising_needs_to_do as the revised primary job of advertising based on what the data shows, recommended_approach as the revised central strategic choice in plain language, recommended_channels as an array of objects each containing channel, role, audience, what_to_run, cta, and why, budget as an array of objects each containing channel, monthly_investment as a number, percentage as a string, and purpose, who_to_target as an array of objects each containing audience_group and description, messaging as an array of objects each containing territory and rationale, creative as a string describing what revised ads should look like based on what performed well, campaign_timing as a string explaining the revised approach to spend and messaging over time, how_to_measure_success as an object containing business_outcomes as an array of strings and media_signals as an array of strings, what_i_would_not_do as an array of objects each containing tactic and reason, smart_next_moves as an array of strings, launch_plan as an object containing days_1_30, days_31_60, and days_61_90 each as strings, performance_findings as an array of objects each containing channel, finding, and recommendation where finding is a specific data-driven observation and recommendation is the action to take, and assumptions as an array of strings only included when important assumptions were necessary. Write full strategic paragraphs and sentences inside each value.";

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
        originalPlan = planText; // use as raw text if not JSON
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
        // CSV — decode as UTF-8 text directly
        performanceText += "\n\n--- File: " + (file.filename || "file" + (i + 1)) + " ---\n";
        performanceText += buf.toString("utf8");
      } else if (filename.endsWith(".xlsx") || filename.endsWith(".xls") || (file.mimeType || "").includes("spreadsheet")) {
        // Excel — parse with a basic approach: convert to CSV-like text via xlsx library
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
        // Unknown — try as text
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

  // Trim to avoid token overflow — keep up to ~80k chars of performance data
  if (performanceText.length > 80000) {
    performanceText = performanceText.substring(0, 80000) + "\n\n[Data truncated for length]";
  }

  // 3. Build the prompt
  var prompt = "ORIGINAL ADVERTISING PLAN:\n" +
    JSON.stringify(originalPlan, null, 2) +
    "\n\nACTUAL PERFORMANCE DATA FROM THE BUSINESS:\n" +
    performanceText +
    "\n\nBased on the performance data above, produce an optimized advertising plan that builds on what is working and fixes what is not. The new monthly budget should match the original plan's total budget unless the data strongly suggests a change. Reference specific numbers and findings from the performance data throughout your recommendations.";

  // 4. Call Claude
  var planText;
  try {
    var client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    console.log("Calling Claude for optimization, recordId:", recordId);
    var message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 4096,
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

    // Sanitize smart quotes
    planText = planText
      .replace(/“|”/g, '"')
      .replace(/‘|’/g, "'")
      .replace(/–|—/g, "-")
      .replace(/…/g, "...");

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
    var optimizedName = originalPlanName + " — Optimized";
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
