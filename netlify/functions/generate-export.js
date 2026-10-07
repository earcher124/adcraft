// generate-export.js
// POST /api/generate-export
// Builds a PPTX presentation from a saved AdCraft plan.
// Pro-only endpoint. Verifies authentication, ownership, and Pro status server-side.

const https = require("https");
const PptxGenJS = require("pptxgenjs");
const layouts  = require("./export/layouts");
const T        = require("./export/theme");

const AT_BASE      = "appCtUgAKIoaa6ECh";
const AT_PLANS_TBL = "tblOAtGXbtWewEAm0";
const AT_USERS_TBL = "tbl7fisATFgQXPOhP";
const AT_TOKEN     = process.env.AIRTABLE_TOKEN;

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

// ── Plan JSON parser ───────────────────────────────────────────────────────────

function parsePlanOutput(raw) {
  if (!raw) return {};
  try {
    // Strip markdown fences if present (defensive — see production JSON issue)
    var cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    return JSON.parse(cleaned);
  } catch(e) {
    console.error("Plan JSON parse error:", e.message);
    return {};
  }
}

// ── Slide background ──────────────────────────────────────────────────────────

function setSlideBackground(slide) {
  slide.background = { color: T.color.bg };
}

// ── PPTX builder ──────────────────────────────────────────────────────────────

async function buildPresentation(plan, fields, coverDataUrl) {
  var pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 inches

  // Cover image handling
  var coverImageBase64 = null;
  var coverMime = "image/png";
  if (coverDataUrl && coverDataUrl.startsWith("data:")) {
    var commaIdx = coverDataUrl.indexOf(",");
    if (commaIdx > -1) {
      var header = coverDataUrl.slice(5, commaIdx); // strip "data:"
      coverMime = header.split(";")[0] || "image/png";
      coverImageBase64 = coverDataUrl.slice(commaIdx + 1);
    }
  }

  var meta = {
    planName: fields["Plan Name"] || plan["plan_name"] || "Advertising Plan",
    bizName:  fields["Business Name"] || plan["Business_Name"] || "",
    date:     new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    coverImageBase64: coverImageBase64,
    coverMime: coverMime,
  };

  // Helper to apply background to every slide
  function addSlide() {
    var s = pptx.addSlide();
    setSlideBackground(s);
    return s;
  }

  // Monkey-patch pptx so layouts can call addSlide without background concerns
  var origAdd = pptx.addSlide.bind(pptx);
  pptx.addSlide = function() {
    var s = origAdd();
    setSlideBackground(s);
    return s;
  };

  // ── 1. Cover ────────────────────────────────────────────────────────────────
  layouts.slideCover(pptx, plan, meta);

  // ── 2. Plan at a Glance ─────────────────────────────────────────────────────
  if (plan.the_opportunity || plan.recommended_approach || plan.budget) {
    layouts.slideAtAGlance(pptx, plan, meta);
  }

  // ── 3. Business Objective ───────────────────────────────────────────────────
  if (plan.the_opportunity || plan.what_advertising_needs_to_do) {
    layouts.slideObjective(pptx, plan);
  }

  // ── 4. Target Audience ──────────────────────────────────────────────────────
  if (plan.who_to_target) {
    layouts.slideAudience(pptx, plan, meta);
  }

  // ── 5. Strategic Approach ───────────────────────────────────────────────────
  if (plan.recommended_approach) {
    layouts.slideStrategy(pptx, plan);
  }

  // ── 6. Channel Plan ─────────────────────────────────────────────────────────
  if (plan.recommended_channels && plan.recommended_channels.length) {
    layouts.slideChannels(pptx, plan);
  }

  // ── 7. Budget Allocation ────────────────────────────────────────────────────
  if (plan.budget && plan.budget.length) {
    layouts.slideBudget(pptx, plan);
  }

  // ── 8. Campaign Approach ────────────────────────────────────────────────────
  if (plan.messaging && (plan.messaging.territory || plan.messaging.tone || plan.messaging.key_messages)) {
    layouts.slideCampaign(pptx, plan);
  }

  // ── 9. Measurement ──────────────────────────────────────────────────────────
  if (plan.how_to_measure_success) {
    layouts.slideMeasurement(pptx, plan);
  }

  // ── 10. Roadmap ─────────────────────────────────────────────────────────────
  if (plan.launch_plan || plan.smart_next_moves) {
    layouts.slideRoadmap(pptx, plan);
  }

  // ── 11. Optimization (if data exists) ───────────────────────────────────────
  if (plan.budget_reallocation && plan.budget_reallocation.length) {
    layouts.slideOptimization(pptx, plan);
  }

  // Return base64 PPTX
  var b64 = await pptx.write({ outputType: "base64" });
  return b64;
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

  var { recordId, email, coverDataUrl } = body;

  if (!recordId || !email) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing recordId or email" }) };
  }

  // ── Server-side auth and Pro check ──────────────────────────────────────────
  var user = await getUser(email);
  if (!user) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: "User not found" }) };
  }
  if ((user.tier || "Free") !== "Pro") {
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
  var plan = parsePlanOutput(fields["Plan Output"]);

  if (!plan || Object.keys(plan).length === 0) {
    return { statusCode: 422, headers, body: JSON.stringify({ error: "Plan data could not be parsed" }) };
  }

  // If coverDataUrl not passed but one is cached in Airtable, use it
  if (!coverDataUrl && fields["Cover Art"]) {
    coverDataUrl = fields["Cover Art"];
  }

  try {
    var pptxBase64 = await buildPresentation(plan, fields, coverDataUrl || null);

    var planName = fields["Plan Name"] || plan["plan_name"] || "AdCraft Plan";
    // Sanitize filename
    var filename = planName.replace(/[^a-zA-Z0-9\s\-_]/g, "").trim().replace(/\s+/g, "_");
    filename = (filename || "AdCraft_Plan") + ".pptx";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        pptxBase64,
        filename,
      }),
    };
  } catch(err) {
    console.error("Export generation error:", err.message, err.stack);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Export generation failed: " + err.message }),
    };
  }
};
