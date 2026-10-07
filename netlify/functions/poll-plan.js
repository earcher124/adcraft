const AT_BASE = "appCtUgAKIoaa6ECh";
const AT_PLANS_TBL = "tblhHjx0eALtFAut2";

exports.handler = async function (event) {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  const recordId = event.queryStringParameters?.id;
  if (!recordId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing id" }) };
  }

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${AT_BASE}/${AT_PLANS_TBL}/${recordId}`,
      { headers: { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}` } }
    );

    const data = await res.json();
    if (!res.ok) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to fetch record" }) };
    }

    const rawStatus = data.fields?.["Status"] || "Generating";
    const status = rawStatus === "Ready" ? "Complete" : rawStatus;
    const plan = data.fields?.["Plan Output"] || null;
    const bizName = data.fields?.["Business Name"] || "";
    const intake = {
      "Business Name": data.fields?.["Business Name"] || "",
      "Primary Goal": data.fields?.["Primary Goal"] || "",
      "Geography": data.fields?.["Geography"] || "",
      "Monthly Ad Budget": data.fields?.["Monthly Ad Budget"] || "",
      "Budget Tier": data.fields?.["Budget Tier"] || "",
      "Email": data.fields?.["Email"] || "",
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ status, plan, bizName, intake }),
    };
  } catch (err) {
    console.error("Poll error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to poll plan" }) };
  }
};
