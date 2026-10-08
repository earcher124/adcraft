const AT_BASE = "appCtUgAKIoaa6ECh";
const AT_PLANS_TBL = "tblOAtGXbtWewEAm0";
const AT_PROFILES_TBL = "tblvXoTaqOdiZ4Kzc";
const AT_USERS_TBL = "tbl7fisATFgQXPOhP";
const AT_INTAKE_TBL = "tbllflTVOe6gnNP2K";
const AT_NEW_PLAN_REQUESTS_TBL = "tblhHjx0eALtFAut2";

exports.handler = async function (event) {
  console.log("generate-plan invoked", event.httpMethod);
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

  const { prompt, email, bizName, userName } = body;
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
            "Plan Name": [bizName, body.goal].filter(Boolean).join(" · ") || "Untitled Plan",
            "Email": email || "",
            "Business Name": body.bizName || "",
            "Primary Goal": body.goal || "",
            "Geography": body.geo || "",
            "Monthly Ad Budget": parseFloat(String(body.budget || "0").replace(/[^0-9.]/g, "")) || 0,
            "Status": "Generating",
          },
        }),
      }
    );

    const atData = await atRes.json();
    if (!atRes.ok) {
      console.error("Airtable create error:", JSON.stringify(atData));
      const atErrMsg = atData.error?.message || atData.error?.type || JSON.stringify(atData).slice(0, 200);
      return { statusCode: 500, headers, body: JSON.stringify({ error: atErrMsg }) };
    }
    recordId = atData.id;
  } catch (err) {
    console.error("Airtable error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to create plan record" }) };
  }

  // 2. Write to New Plan Requests table — only for short form (returning users with saved profile)
  if (body.isShortForm) {
    const budgetNum = parseFloat(String(body.budget || "0").replace(/[^0-9.]/g, "")) || 0;
    fetch(`https://api.airtable.com/v0/${AT_BASE}/${AT_NEW_PLAN_REQUESTS_TBL}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          "Email": email || "",
          "Primary Goal": body.goal || "",
          "Monthly Ad Budget": budgetNum,
        },
      }),
    }).catch(err => console.error("New Plan Request record error:", err.message));
  }

  // 3. Create Intake Responses record — only for full intake form (first-time users)
  if (!body.isShortForm) try {
    const intakeFields = {
      "Email": email || "",
      "Business Name": body.bizName || "",
      "Business Type": body.formData?.bizType || "",
      "Product": body.formData?.productType || "",
      "Target Customer": body.formData?.targetCustomer || "",
      "Geography": body.geo || "",
      "Primary Goal": body.goal || "",
      "Current Advertising": body.formData?.currentAdvertising || "",
      "Plan": [recordId], // linked record
    };
    const revenueRaw = body.formData?.monthlyRevenue ? String(body.formData.monthlyRevenue).replace(/[^0-9.]/g, "") : "";
    if (revenueRaw) intakeFields["Monthly Revenue"] = parseFloat(revenueRaw);
    const budgetRaw = body.budget ? String(body.budget).replace(/[^0-9.]/g, "") : "";
    if (budgetRaw) intakeFields["Monthly Ad Budget"] = parseFloat(budgetRaw);

    const intakeRes = await fetch(`https://api.airtable.com/v0/${AT_BASE}/${AT_INTAKE_TBL}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields: intakeFields }),
    });
    const intakeData = await intakeRes.json();
    if (!intakeRes.ok) {
      console.error("Intake record error:", JSON.stringify(intakeData));
    } else {
      console.log("Intake record created:", intakeData.id);
    }
  } catch (err) {
    console.error("Intake record error:", err.message);
  }

  // 3. Upsert user record + business profile (fire-and-forget)
  if (email) {
    upsertUser(email, userName).catch(err =>
      console.error("User upsert error:", err.message)
    );
    upsertProfile(email, bizName, body.formData).catch(err =>
      console.error("Profile upsert error:", err.message, err.detail || "")
    );
  } else {
    console.warn("No email provided, skipping user/profile upsert");
  }

  // 4. Return the record ID immediately — browser triggers background generation and polls for completion
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ recordId, status: "generating" }),
  };
};

async function upsertUser(email, name) {
  const token = process.env.AIRTABLE_TOKEN;
  const searchUrl = `https://api.airtable.com/v0/${AT_BASE}/${AT_USERS_TBL}?filterByFormula=${encodeURIComponent(`{Email}="${email}"`)}`;
  const searchRes = await fetch(searchUrl, { headers: { Authorization: `Bearer ${token}` } });
  const searchData = await searchRes.json();

  // Only create if user doesn't exist yet — never overwrite existing records
  if (!searchData.records || searchData.records.length === 0) {
    const res = await fetch(`https://api.airtable.com/v0/${AT_BASE}/${AT_USERS_TBL}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields: { "Email": email, "Name": name || "", "Tier": "Free" } }),
    });
    if (!res.ok) { const d = await res.json(); throw new Error("User create failed: " + JSON.stringify(d)); }
    console.log("User created for", email);
  }
}

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
    "Monthly Revenue": formData.monthlyRevenue ? parseFloat(String(formData.monthlyRevenue).replace(/[^0-9.]/g, "")) || null : null,
    "Current Advertising": formData.currentAdvertising || "",
  };

  if (searchData.records && searchData.records.length > 0) {
    const rid = searchData.records[0].id;
    const res = await fetch(`https://api.airtable.com/v0/${AT_BASE}/${AT_PROFILES_TBL}/${rid}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields }),
    });
    if (!res.ok) { const d = await res.json(); throw Object.assign(new Error("PATCH failed"), { detail: JSON.stringify(d) }); }
    console.log("Profile updated, id:", rid);
  } else {
    const res = await fetch(`https://api.airtable.com/v0/${AT_BASE}/${AT_PROFILES_TBL}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields }),
    });
    if (!res.ok) { const d = await res.json(); throw Object.assign(new Error("POST failed"), { detail: JSON.stringify(d) }); }
    console.log("Profile created for", email);
  }
}
