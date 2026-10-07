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
// Keywords are matched against Business_Type, Industry, or Business_Name (case-insensitive).
const COVER_IMAGE_MAP = [
  { keywords: ["restaurant", "food", "beverage", "cafe", "coffee", "bar", "bakery", "catering", "dining", "eatery", "bistro", "pizz", "sushi", "taco", "brewery", "winery"],    file: "restaurant.png" },
  { keywords: ["auto", "car", "vehicle", "dealer", "dealership", "mechanic", "garage", "truck", "motor", "fleet"],                                                               file: "automotive.png" },
  { keywords: ["home service", "cleaning", "maid", "contractor", "plumb", "electric", "hvac", "landscap", "lawn", "pest", "paint", "handy", "roofing", "window", "janitorial"], file: "home-services.png" },
  { keywords: ["retail", "boutique", "shop", "clothing", "apparel", "fashion", "gift", "store", "merchandise", "accessories", "jewelry"],                                        file: "retail.png" },
  { keywords: ["travel", "hotel", "hospitality", "resort", "vacation", "tourism", "inn", "lodge", "airbnb", "rental", "motel", "spa resort"],                                    file: "travel.png" },
  { keywords: ["consulting", "professional service", "agency", "strategy", "advisory", "management", "business service", "accounting", "cpa", "audit", "tax"],                   file: "professional-services.png" },
  { keywords: ["real estate", "realt", "property", "home buy", "home sell", "mortgage", "housing", "broker", "apartment"],                                                       file: "real-estate.png" },
  { keywords: ["ecommerce", "e-commerce", "online store", "shopify", "amazon", "marketplace", "direct to consumer", "dtc", "subscription box"],                                  file: "ecommerce.png" },
  { keywords: ["event", "entertainment", "venue", "wedding", "party", "concert", "festival", "production", "nightclub", "theater", "theatre", "ticketing"],                       file: "events.png" },
  { keywords: ["beauty", "salon", "hair", "nail", "spa", "skincare", "cosmetic", "makeup", "esthetic", "barber", "wax", "lash", "brow"],                                         file: "beauty.png" },
  { keywords: ["education", "school", "tutor", "learning", "training", "academy", "college", "university", "course", "coaching", "childcare", "daycare", "preschool"],           file: "education.png" },
  { keywords: ["fitness", "gym", "crossfit", "yoga", "pilates", "personal train", "sport", "athletic", "wellness center", "cycling", "martial art", "dance"],                    file: "fitness.png" },
  { keywords: ["wellness", "massage", "meditation", "holistic", "naturopath", "acupuncture", "chiropractic", "mental health", "therapy", "counseling", "mindfulness"],           file: "wellness.png" },
  { keywords: ["financial", "finance", "invest", "wealth", "insurance", "bank", "credit", "loan", "mortgage broker", "retirement", "fund", "asset"],                             file: "financial.png" },
  { keywords: ["health", "medical", "clinic", "doctor", "dentist", "dental", "optom", "vision", "pharmacy", "urgent care", "hospital", "physical therapy", "chiropract"],        file: "healthcare.png" },
  { keywords: ["legal", "law", "attorney", "lawyer", "firm", "paralegal", "notary", "litigation", "court"],                                                                      file: "legal.png" },
  { keywords: ["nonprofit", "non-profit", "charity", "foundation", "ngo", "association", "community", "social service", "cause", "advocacy", "volunteer"],                       file: "nonprofit.png" },
  { keywords: ["tech", "software", "saas", "app", "startup", "digital", "it ", "cyber", "cloud", "data", "ai ", "artificial intel", "developer", "platform", "api", "web dev"], file: "technology.png" },
  { keywords: ["construction", "architect", "building", "contractor", "engineer", "renovation", "remodel", "develop", "infrastructure", "industrial"],                           file: "construction.png" },
  { keywords: ["pet", "veterinar", "vet ", "animal", "dog", "cat", "grooming", "kennel", "boarding", "paw"],                                                                     file: "pet-services.png" },
];

const COVER_IMAGES_DIR = path.join(__dirname, "export", "cover-images");
const DEFAULT_COVER    = "professional-services.png"; // fallback

function pickCoverImage(plan) {
  var haystack = [
    plan["Business_Type"] || "",
    plan["Industry"]      || "",
    plan["Business_Name"] || "",
  ].join(" ").toLowerCase();

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
