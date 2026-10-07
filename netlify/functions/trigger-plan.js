// Thin proxy: receives the browser call (with CORS), fetches the prompt from
// Airtable by recordId, then fires the background function server-to-server.
const AT_BASE = "appCtUgAKIoaa6ECh";
const AT_PLANS_TBL = "tblOAtGXbtWewEAm0";

exports.handler = async function (event) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: "Method Not Allowed" };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { recordId } = body;
  if (!recordId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing recordId" }) };
  }

  // Fetch the Plan record from Airtable to get the stored prompt
  let prompt;
  try {
    const atRes = await fetch(
      `https://api.airtable.com/v0/${AT_BASE}/${AT_PLANS_TBL}/${recordId}`,
      { headers: { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}` } }
    );
    const atData = await atRes.json();
    if (!atRes.ok) {
      console.error("Airtable fetch error:", JSON.stringify(atData));
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to fetch plan record" }) };
    }
    prompt = atData.fields?.["Prompt"];
    if (!prompt) {
      console.error("No Prompt field on record", recordId);
      return { statusCode: 400, headers, body: JSON.stringify({ error: "No prompt found on plan record" }) };
    }
  } catch (err) {
    console.error("Airtable fetch error:", err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to fetch plan record" }) };
  }

  const siteUrl = process.env.URL || process.env.DEPLOY_URL || "https://adcrafthq.com";

  // Fire background function server-to-server — no CORS, no browser abort
  fetch(`${siteUrl}/.netlify/functions/generate-plan-background`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recordId, prompt }),
  }).catch(err => console.error("Background trigger error:", err.message));

  return {
    statusCode: 202,
    headers,
    body: JSON.stringify({ ok: true }),
  };
};
