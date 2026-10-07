// generate-cover-art.js
// POST /api/generate-cover-art
// Generates or retrieves cached cover art for a plan's PPTX export.
// Pro-only endpoint. Verifies authentication and ownership server-side.

const https = require("https");

const AT_BASE      = "appCtUgAKIoaa6ECh";
const AT_PLANS_TBL = "tblOAtGXbtWewEAm0";
const AT_USERS_TBL = "tbl7fisATFgQXPOhP";
const AT_TOKEN     = process.env.AIRTABLE_TOKEN;
const OPENAI_KEY   = process.env.OPENAI_API_KEY;

// ── Locked visual-style prefix (keep separate from plan variables) ─────────
const STYLE_RULES = `
STYLE RULES:
Minimal editorial illustration.
Sophisticated geometric forms.
Subtle organic texture.
Premium but approachable.
No text.
No letters.
No logos.
No charts.
No photorealism.
Avoid people unless essential to representing the business category.
Generous negative space.
Neutral warm background.
Designed for a modern professional presentation.
Maintain a consistent visual language across all AdCraft plans.`.trim();

function buildImagePrompt(coverArt) {
  return [
    "Create a sophisticated editorial illustration for the cover of a professional advertising strategy presentation.",
    "",
    `Business category: ${coverArt.business_category}`,
    `Subject: ${coverArt.subject}`,
    `Mood: ${coverArt.mood}`,
    `Accent palette: ${coverArt.accent_palette}`,
    "",
    STYLE_RULES,
  ].join("\n");
}

// ── Airtable helpers ──────────────────────────────────────────────────────────

function atRequest(method, path, body) {
  return new Promise(function(resolve, reject) {
    var payload = body ? JSON.stringify(body) : null;
    var options = {
      hostname: "api.airtable.com",
      path: "/v0/" + AT_BASE + "/" + path,
      method: method,
      headers: {
        Authorization: "Bearer " + AT_TOKEN,
        "Content-Type": "application/json",
      },
    };
    var req = https.request(options, function(res) {
      var data = "";
      res.on("data", function(c) { data += c; });
      res.on("end", function() {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch(e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function getPlan(recordId) {
  var r = await atRequest("GET", AT_PLANS_TBL + "/" + recordId);
  if (r.status !== 200) return null;
  return r.body;
}

async function getUser(email) {
  var filter = encodeURIComponent(`{Email}="${email}"`);
  var r = await atRequest("GET", AT_USERS_TBL + "?filterByFormula=" + filter + "&maxRecords=1");
  if (r.status !== 200 || !r.body.records || !r.body.records.length) return null;
  return r.body.records[0].fields;
}

async function saveCoverArtToAirtable(recordId, base64DataUrl) {
  // Store the data URL string in Cover Art field
  await atRequest("PATCH", AT_PLANS_TBL + "/" + recordId, {
    fields: { "Cover Art": base64DataUrl },
  });
}

// ── OpenAI image generation ────────────────────────────────────────────────

function openaiImageRequest(prompt) {
  return new Promise(function(resolve, reject) {
    var payload = JSON.stringify({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json",
      quality: "standard",
    });
    var options = {
      hostname: "api.openai.com",
      path: "/v1/images/generations",
      method: "POST",
      headers: {
        Authorization: "Bearer " + OPENAI_KEY,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };
    var req = https.request(options, function(res) {
      var data = "";
      res.on("data", function(c) { data += c; });
      res.on("end", function() {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch(e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

// ── Fallback art direction from existing plan data ─────────────────────────

function deriveCoverArt(plan) {
  var bizName = plan["Business_Name"] || plan["Plan_Name"] || "";
  var category = plan["Business_Type"] || plan["Industry"] || bizName || "Professional business";
  var objective = plan["what_advertising_needs_to_do"] || plan["the_opportunity"] || "";
  var approach = plan["recommended_approach"] || "";
  return {
    business_category: String(category).slice(0, 80),
    subject: "A refined editorial composition representing " + String(category).slice(0, 60),
    mood: "Professional, confident, and forward-looking",
    accent_palette: "Warm ivory and deep aubergine with charcoal accents",
  };
}

// ── Main handler ──────────────────────────────────────────────────────────────

exports.handler = async function(event) {
  var headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  var body;
  try { body = JSON.parse(event.body || "{}"); }
  catch(e) { return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid request body" }) }; }

  var { recordId, email } = body;

  if (!recordId || !email) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing recordId or email" }) };
  }

  // ── Server-side auth checks ──────────────────────────────────────────────
  var user = await getUser(email);
  if (!user) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: "User not found" }) };
  }
  if ((user["Tier"] || user.tier || "Free") !== "Pro") {
    return { statusCode: 403, headers, body: JSON.stringify({ error: "Pro subscription required" }) };
  }

  var planRecord = await getPlan(recordId);
  if (!planRecord) {
    return { statusCode: 404, headers, body: JSON.stringify({ error: "Plan not found" }) };
  }

  // Ownership check
  var planEmail = (planRecord.fields || {})["Email"] || "";
  if (planEmail.toLowerCase() !== email.toLowerCase()) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: "Access denied" }) };
  }

  var fields = planRecord.fields || {};

  // ── Check for cached cover art ────────────────────────────────────────────
  var cached = fields["Cover Art"] || "";
  if (cached && cached.startsWith("data:image/")) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ coverDataUrl: cached, cached: true }),
    };
  }

  // ── No cache — generate cover art ────────────────────────────────────────
  // Only generate if OPENAI_API_KEY is configured
  if (!OPENAI_KEY) {
    console.error("OPENAI_API_KEY is not set — skipping cover art generation");
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ coverDataUrl: null, cached: false, fallback: true, reason: "no_api_key" }),
    };
  }
  console.log("Cover art: OPENAI_KEY present, proceeding with generation");

  // Parse plan output to get Cover_Art
  var planOutputRaw = fields["Plan Output"] || "";
  var planData = {};
  try {
    var cleaned = planOutputRaw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    planData = JSON.parse(cleaned);
  } catch(e) {
    planData = {};
  }

  var coverArt = planData["Cover_Art"];
  if (!coverArt || !coverArt.subject) {
    coverArt = deriveCoverArt(planData);
  }

  // Build the final prompt (application controls this, not LLM)
  var prompt = buildImagePrompt(coverArt);

  try {
    console.log("Cover art: sending prompt to OpenAI, length:", prompt.length);
    var imgResult = await openaiImageRequest(prompt);
    console.log("Cover art: OpenAI response status:", imgResult.status);
    if (imgResult.status !== 200 || !imgResult.body.data || !imgResult.body.data[0]) {
      console.error("OpenAI image generation failed:", JSON.stringify(imgResult.body));
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ coverDataUrl: null, cached: false, fallback: true }),
      };
    }

    var b64 = imgResult.body.data[0].b64_json;
    var dataUrl = "data:image/png;base64," + b64;

    // Cache in Airtable (best effort — don't fail export if this fails)
    try {
      await saveCoverArtToAirtable(recordId, dataUrl);
    } catch(saveErr) {
      console.error("Failed to cache cover art:", saveErr.message);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ coverDataUrl: dataUrl, cached: false }),
    };

  } catch(err) {
    console.error("Cover art generation error:", err.message);
    // Never fail the export — return null so caller uses minimal cover
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ coverDataUrl: null, cached: false, fallback: true }),
    };
  }
};
