// generate-cover-art-background.js
// POST /api/generate-cover-art-background
// Background function — returns 202 immediately, generates cover art async,
// saves result to Airtable "Cover Art" field. Frontend polls get-plan-status
// (or re-fetches the plan record) to detect completion.

const https = require("https");

const AT_BASE      = "appCtUgAKIoaa6ECh";
const AT_PLANS_TBL = "tblOAtGXbtWewEAm0";
const AT_USERS_TBL = "tbl7fisATFgQXPOhP";
const AT_TOKEN     = process.env.AIRTABLE_TOKEN;
const OPENAI_KEY   = process.env.OPENAI_API_KEY;

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

function deriveCoverArt(plan) {
  var bizName = plan["Business_Name"] || plan["Plan_Name"] || "";
  var category = plan["Business_Type"] || plan["Industry"] || bizName || "Professional business";
  return {
    business_category: String(category).slice(0, 80),
    subject: "A refined editorial composition representing " + String(category).slice(0, 60),
    mood: "Professional, confident, and forward-looking",
    accent_palette: "Warm ivory and deep aubergine with charcoal accents",
  };
}

// ── Main handler ──────────────────────────────────────────────────────────────

exports.handler = async function(event) {
  // Background functions must return 202 quickly — all real work runs after
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

  // Auth + ownership checks (fast — before the 202)
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

  var planEmail = (planRecord.fields || {})["Email"] || "";
  if (planEmail.toLowerCase() !== email.toLowerCase()) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: "Access denied" }) };
  }

  var fields = planRecord.fields || {};

  // Already cached — tell the caller immediately
  var cached = fields["Cover Art"] || "";
  if (cached && cached.startsWith("data:image/")) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ status: "ready", cached: true }),
    };
  }

  if (!OPENAI_KEY) {
    console.error("OPENAI_API_KEY is not set");
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ status: "unavailable", reason: "no_api_key" }),
    };
  }

  // Parse plan for Cover_Art hints
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

  var prompt = buildImagePrompt(coverArt);

  // ── Fire-and-forget: generate + save. Background function keeps running. ──
  console.log("Cover art background: starting generation for", recordId);
  try {
    var imgResult = await openaiImageRequest(prompt);
    console.log("Cover art background: OpenAI status", imgResult.status);
    if (imgResult.status === 200 && imgResult.body.data && imgResult.body.data[0]) {
      var dataUrl = "data:image/png;base64," + imgResult.body.data[0].b64_json;
      await saveCoverArtToAirtable(recordId, dataUrl);
      console.log("Cover art background: saved to Airtable for", recordId);
    } else {
      console.error("Cover art background: OpenAI error", JSON.stringify(imgResult.body));
      // Save a sentinel so the poller knows generation finished (failed)
      await saveCoverArtToAirtable(recordId, "failed");
    }
  } catch(err) {
    console.error("Cover art background: exception", err.message);
    await saveCoverArtToAirtable(recordId, "failed").catch(function() {});
  }

  // Background functions: return value is ignored by Netlify after 202
  return { statusCode: 202, headers, body: JSON.stringify({ status: "generating" }) };
};
