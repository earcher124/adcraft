const AT_BASE = "appCtUgAKIoaa6ECh";
const AT_PROFILES_TBL = "tblvXoTaqOdiZ4Kzc";

exports.handler = async function (event) {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  const email = event.queryStringParameters?.email;
  if (!email) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing email" }) };
  }

  try {
    const url = `https://api.airtable.com/v0/${AT_BASE}/${AT_PROFILES_TBL}?filterByFormula=${encodeURIComponent(`{Email}="${email}"`)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}` },
    });

    const data = await res.json();
    if (!res.ok) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to fetch profile" }) };
    }

    if (!data.records || data.records.length === 0) {
      return { statusCode: 200, headers, body: JSON.stringify({ profile: null }) };
    }

    const r = data.records[0];
    const profile = {
      recordId: r.id,
      bizName: r.fields["Business Name"] || "",
      bizType: r.fields["Business Type"] || "",
      productType: r.fields["Product"] || "",
      targetCustomer: r.fields["Target Customer"] || "",
      geo: r.fields["Geography"] || "",
      monthlyRevenue: r.fields["Monthly Revenue"] != null ? r.fields["Monthly Revenue"] : "",
      currentAdvertising: r.fields["Current Advertising"] || "",
    };

    return { statusCode: 200, headers, body: JSON.stringify({ profile }) };
  } catch (err) {
    console.error("get-profile error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to fetch profile" }) };
  }
};
