// Thin proxy: receives the browser call (with CORS), then fires the background
// function server-to-server where CORS doesn't apply.
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

  const { recordId, prompt } = body;
  if (!recordId || !prompt) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing recordId or prompt" }) };
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
