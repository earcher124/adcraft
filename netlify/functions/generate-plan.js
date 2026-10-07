const Anthropic = require("@anthropic-ai/sdk");

const AT_BASE = "appCtUgAKIoaa6ECh";
const AT_PLANS_TBL = "tblOAtGXbtWewEAm0";
const AT_PROFILES_TBL = "tblvXoTaqOdiZ4Kzc";

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
            "Plan Name": bizName || "Untitled Plan",
            "Plan Output": planText,
            "Email": email || "",
            "Business Name": body.bizName || "",
            "Business Type": body.formData?.bizType || "",
            "Type of Product": body.formData?.productType || "",
            "Target Customer": body.formData?.targetCustomer || "",
            "Primary Goal": body.goal || "",
            "Geography": body.geo || "",
            "Monthly Ad Budget": body.budget || "",
            "Monthly Revenue": body.formData?.monthlyRevenue || "",
            "Current Advertising": body.formData?.currentAdvertising || "",
            "Status": "Complete",
            "Intake Responses": JSON.stringify(body.formData || {}),
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

  // 3. Upsert business profile (fire-and-forget — don't block the response)
  if (email) {
    upsertProfile(email, body.bizName, body.formData).catch(err =>
      console.error("Profile upsert error:", err)
    );
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ recordId, plan: planText }),
  };
};

async function upsertProfile(email, bizName, formData = {}) {
  const token = process.env.AIRTABLE_TOKEN;

  // Check if profile exists
  const searchUrl = `https://api.airtable.com/v0/${AT_BASE}/${AT_PROFILES_TBL}?filterByFormula=${encodeURIComponent(`{Email}="${email}"`)}`;
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const searchData = await searchRes.json();

  const fields = {
    "Email": email,
    "Business Name": bizName || formData.bizName || "",
    "Business Type": formData.bizType || "",
    "Product": formData.productType || "",
    "Target Customer": formData.targetCustomer || "",
    "Geography": formData.geo || "",
    "Monthly Revenue": formData.monthlyRevenue || "",
    "Current Advertising": formData.currentAdvertising || "",
  };

  if (searchData.records && searchData.records.length > 0) {
    // Update existing record
    const recordId = searchData.records[0].id;
    await fetch(`https://api.airtable.com/v0/${AT_BASE}/${AT_PROFILES_TBL}/${recordId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    });
  } else {
    // Create new record
    await fetch(`https://api.airtable.com/v0/${AT_BASE}/${AT_PROFILES_TBL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    });
  }
}
