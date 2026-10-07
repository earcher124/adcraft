// generate-export.js
// POST /api/generate-export
// Builds a PPTX presentation from a saved AdCraft plan.
// Pro-only endpoint. Verifies authentication, ownership, and Pro status server-side.

const PptxGenJS = require("pptxgenjs");
const layouts  = require("./export/layouts");
const T        = require("./export/theme");

const AT_BASE      = "appCtUgAKIoaa6ECh";
const AT_PLANS_TBL = "tblOAtGXbtWewEAm0";
const AT_USERS_TBL = "tbl7fisATFgQXPOhP";
const AT_TOKEN     = process.env.AIRTABLE_TOKEN;

// ── Cover art: curated static image library ───────────────────────────────────

const fs   = require("fs");
const path = require("path");

// Maps category keywords → image filename (in ./export/cover-images/)
// Keywords are matched ONLY against Business_Type and Industry fields (not Business_Name,
// which can contain misleading words). More specific categories are listed first.
// Keywords are whole-word or prefix matched via the regex below — no accidental substring hits.
const COVER_IMAGE_MAP = [
  // ── Technology first — broad terms like "digital" are here, not in consulting ──
  { keywords: ["saas", "software", "technology", "tech company", "tech startup", "startup", "app ", "mobile app", "web app", "platform", "cybersecurity", "cloud", "ai company", "artificial intel", "machine learn", "data science", "developer tool", "api ", "web dev", "digital agency", "digital marketing agency"], file: "technology.png" },
  { keywords: ["restaurant", "food", "beverage", "cafe", "coffee shop", "bar ", "bakery", "catering", "dining", "eatery", "bistro", "pizz", "sushi", "taco", "brewery", "winery"],                                                                                                                                         file: "restaurant.png" },
  { keywords: ["auto dealer", "car dealer", "vehicle dealer", "automotive", "mechanic", "auto repair", "garage", "truck", "motor sport", "fleet manage"],                                                                                                                                                                   file: "automotive.png" },
  { keywords: ["home service", "cleaning service", "maid service", "plumb", "electrician", "hvac", "landscap", "lawn care", "pest control", "house paint", "handyman", "roofing", "window clean", "janitorial"],                                                                                                            file: "home-services.png" },
  { keywords: ["retail", "boutique", "clothing store", "apparel", "fashion", "gift shop", "merchandise", "accessories", "jewelry store"],                                                                                                                                                                                   file: "retail.png" },
  { keywords: ["travel", "hotel", "resort", "vacation", "tourism", "inn ", "lodge", "airbnb", "short-term rental", "motel"],                                                                                                                                                                                                file: "travel.png" },
  { keywords: ["real estate", "realtor", "realty", "property manage", "home buy", "home sell", "mortgage broker", "housing develop", "apartment complex"],                                                                                                                                                                  file: "real-estate.png" },
  { keywords: ["ecommerce", "e-commerce", "online store", "shopify", "amazon seller", "marketplace", "direct to consumer", "dtc", "subscription box"],                                                                                                                                                                     file: "ecommerce.png" },
  { keywords: ["event plan", "event venue", "entertainment", "wedding", "party plan", "concert", "festival", "nightclub", "theater", "theatre", "ticketing"],                                                                                                                                                               file: "events.png" },
  { keywords: ["beauty salon", "hair salon", "nail salon", "day spa", "skincare", "cosmetic", "makeup", "esthetician", "barber", "wax studio", "lash", "brow bar"],                                                                                                                                                         file: "beauty.png" },
  { keywords: ["education", "school", "tutoring", "e-learning", "online learning", "training center", "academy", "college", "university", "coaching", "childcare", "daycare", "preschool"],                                                                                                                                 file: "education.png" },
  { keywords: ["fitness", "gym", "crossfit", "yoga studio", "pilates", "personal train", "athletic", "cycling studio", "martial art", "dance studio", "sports"],                                                                                                                                                            file: "fitness.png" },
  { keywords: ["wellness", "massage", "meditation", "holistic", "naturopath", "acupuncture", "chiropractic", "mental health", "therapy practice", "counseling", "mindfulness"],                                                                                                                                             file: "wellness.png" },
  { keywords: ["financial service", "financial advisor", "investment", "wealth manage", "insurance", "bank", "credit union", "mortgage", "retirement plan", "hedge fund", "asset manage"],                                                                                                                                  file: "financial.png" },
  { keywords: ["medical", "clinic", "doctor", "dentist", "dental", "optometrist", "vision care", "pharmacy", "urgent care", "hospital", "physical therapy", "healthcare"],                                                                                                                                                  file: "healthcare.png" },
  { keywords: ["law firm", "legal service", "attorney", "lawyer", "paralegal", "notary", "litigation"],                                                                                                                                                                                                                     file: "legal.png" },
  { keywords: ["nonprofit", "non-profit", "charity", "foundation", "ngo", "community org", "social service", "advocacy", "volunteer"],                                                                                                                                                                                      file: "nonprofit.png" },
  { keywords: ["construction", "architect", "general contract", "building contract", "engineering", "renovation", "remodel", "infrastructure", "industrial"],                                                                                                                                                               file: "construction.png" },
  { keywords: ["pet service", "veterinar", "animal hospital", "dog groom", "cat boarding", "kennel", "pet boarding", "pet store"],                                                                                                                                                                                           file: "pet-services.png" },
  // ── Consulting last — only match when nothing more specific matched ───────────
  { keywords: ["consulting", "professional service", "advisory", "management consult", "accounting firm", "cpa firm", "audit firm", "tax service"],                                                                                                                                                                         file: "professional-services.png" },
];

const COVER_IMAGES_DIR = path.join(__dirname, "export", "cover-images");
const DEFAULT_COVER    = "professional-services.png"; // fallback

function pickCoverImage(plan) {
  // Only scan typed category fields — Business_Name can contain misleading words
  var haystack = [
    plan["Business_Type"] || "",
    plan["Industry"]      || "",
  ].join(" ").toLowerCase();
  console.log("Cover art: haystack =", JSON.stringify(haystack));

  for (var entry of COVER_IMAGE_MAP) {
    for (var kw of entry.keywords) {
      if (haystack.includes(kw)) {
        console.log("Cover art: matched keyword '" + kw + "' → " + entry.file);
        return entry.file;
      }
    }
  }
  console.log("Cover art: no keyword match, using default →", DEFAULT_COVER);
  return DEFAULT_COVER;
}

async function generateCoverArt(plan) {
  try {
    var filename = pickCoverImage(plan);
    var filepath = path.join(COVER_IMAGES_DIR, filename);
    if (!fs.existsSync(filepath)) {
      // Try default
      filepath = path.join(COVER_IMAGES_DIR, DEFAULT_COVER);
    }
    if (!fs.existsSync(filepath)) {
      return { image: null, error: "Cover image file not found: " + filename };
    }
    var buf = fs.readFileSync(filepath);
    var b64 = buf.toString("base64");
    console.log("Cover art: loaded static image", filename, buf.length, "bytes");
    return { image: "data:image/png;base64," + b64, error: null };
  } catch(err) {
    console.error("Cover art exception:", err.message);
    return { image: null, error: "Cover art exception: " + err.message };
  }
}

// ── Airtable helpers ──────────────────────────────────────────────────────────

async function atRequest(method, path, body) {
  var res = await fetch("https://api.airtable.com/v0/" + AT_BASE + "/" + path, {
    method: method,
    headers: {
      Authorization: "Bearer " + AT_TOKEN,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  var data = await res.json().catch(function() { return res.text(); });
  return { status: res.status, body: data };
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

  var { recordId, email, coverType } = body;
  var coverDataUrl = null;

  if (!recordId || !email) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing recordId or email" }) };
  }

  // ── Server-side auth and Pro check ──────────────────────────────────────────
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
  var plan = parsePlanOutput(fields["Plan Output"]);

  if (!plan || Object.keys(plan).length === 0) {
    return { statusCode: 422, headers, body: JSON.stringify({ error: "Plan data could not be parsed" }) };
  }

  // Generate cover art inline when requested (DALL-E 3 takes ~20s).
  var coverArtError = null;
  if (coverType !== "minimal") {
    console.log("Export: generating cover art inline…");
    var artResult = await generateCoverArt(plan);
    coverDataUrl = artResult.image;
    coverArtError = artResult.error;
    console.log("Export: cover art present?", !!coverDataUrl, "error?", coverArtError);
  }

  try {
    var pptxBase64 = await buildPresentation(plan, fields, coverDataUrl || null);

    var planName = fields["Plan Name"] || plan["plan_name"] || "AdCraft Plan";
    var filename = planName.replace(/[^a-zA-Z0-9\s\-_]/g, "").trim().replace(/\s+/g, "_");
    filename = (filename || "AdCraft_Plan") + ".pptx";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        pptxBase64,
        filename,
        coverArtError: coverArtError || null,  // null = success, string = what went wrong
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
