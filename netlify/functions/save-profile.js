const AT_BASE = "appCtUgAKIoaa6ECh";
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
  try { body = JSON.parse(event.body); } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { email, profile } = body;
  if (!email) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing email" }) };
  }

  const revenueRaw = profile.monthlyRevenue ? String(profile.monthlyRevenue).replace(/[^0-9.]/g, "") : "";
  const fields = {
    "Email": email,
    "Business Name": profile.bizName || "",
    "Business Type": profile.bizType || "",
    "Product": profile.productType || "",
    "Target Customer": profile.targetCustomer || "",
    "Geography": profile.geo || "",
    "Monthly Revenue": revenueRaw ? parseFloat(revenueRaw) : null,
    "Current Advertising": profile.currentAdvertising || "",
  };
  // Remove null fields to avoid type errors on empty optional fields
  Object.keys(fields).forEach(k => { if (fields[k] === null || fields[k] === "") delete fields[k]; });
  fields["Email"] = email; // always keep email

  try {
    // Check if profile exists
    const searchRes = await fetch(
      `https://api.airtable.com/v0/${AT_BASE}/${AT_PROFILES_TBL}?filterByFormula=${encodeURIComponent(`{Email}="${email}"`)}`,
      { headers: { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}` } }
    );
    const searchData = await searchRes.json();
    let res;
    if (searchData.records && searchData.records.length > 0) {
      const rid = searchData.records[0].id;
      res = await fetch(`https://api.airtable.com/v0/${AT_BASE}/${AT_PROFILES_TBL}/${rid}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      });
    } else {
      res = await fetch(`https://api.airtable.com/v0/${AT_BASE}/${AT_PROFILES_TBL}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      });
    }

    const responseData = await res.json();
    if (!res.ok) {
      console.error("save-profile Airtable error:", JSON.stringify(responseData));
      return { statusCode: 500, headers, body: JSON.stringify({ error: responseData?.error?.message || "Failed to save profile", detail: responseData }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error("save-profile error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: String(err) }) };
  }
};
