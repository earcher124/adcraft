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
      console.error("Airtable error:", data);
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to fetch profile" }) };
    }

    if (!data.records || data.records.length === 0) {
      return { statusCode: 200, headers, body: JSON.stringify({ profile: null }) };
    }

    const record = data.records[0];
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        profile: {
          recordId: record.id,
          bizName: record.fields["Business Name"] || "",
          bizType: record.fields["Business Type"] || "",
          productType: record.fields["Product"] || "",
          targetCustomer: record.fields["Target Customer"] || "",
          geo: record.fields["Geography"] || "",
          monthlyRevenue: record.fields["Monthly Revenue"] || "",
          currentAdvertising: record.fields["Current Advertising"] || "",
        },
      }),
    };
  } catch (err) {
    console.error("Airtable error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to fetch profile" }) };
  }
};
