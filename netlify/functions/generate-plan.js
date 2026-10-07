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

  // 1. Create a pending record in Airtable immediately
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
            "Email": email || "",
            "Business Name": body.bizName || "",
            "Primary Goal": body.goal || "",
            "Geography": body.geo || "",
            "Monthly Ad Budget": body.budget || "",
            "Status": "Generating",
            "Intake Responses": JSON.stringify(body.formData || {}),
          },
        }),
      }
    );

    const atData = await atRes.json();
    if (!atRes.ok) {
      console.error("Airtable create error:", JSON.stringify(atData));
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to create plan record" }) };
    }
    recordId = atData.id;
  } catch (err) {
    console.error("Airtable error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to create plan record" }) };
  }

  // 2. Fire background function (non-blocking)
  try {
    const bgUrl = `${process.env.URL}/.netlify/functions/generate-plan-background`;
    fetch(bgUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recordId, prompt, email, bizName, formData: body.formData }),
    }).catch(err => console.error("Background trigger error:", err));
  } catch (err) {
    console.error("Background trigger error:", err);
    // Don't fail — record is created, background will be retried or can be polled
  }

  // 3. Upsert business profile (fire-and-forget)
  if (email) {
    upsertProfile(email, bizName, body.formData).catch(err =>
      console.error("Profile upsert error:", err)
    );
  }

  // 4. Return the record ID immediately — frontend polls for completion
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ recordId, status: "generating" }),
  };
};

async function upsertProfile(email, bizName, formData = {}) {
  const token = process.env.AIRTABLE_TOKEN;

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
    const rid = searchData.records[0].id;
    await fetch(`https://api.airtable.com/v0/${AT_BASE}/${AT_PROFILES_TBL}/${rid}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields }),
    });
  } else {
    await fetch(`https://api.airtable.com/v0/${AT_BASE}/${AT_PROFILES_TBL}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields }),
    });
  }
}
