// trigger-cover-art.js
// Thin proxy: browser calls this (CORS-safe), which then fires the background
// function server-to-server. Background functions cannot be called directly
// from a browser — they must be triggered via a server-to-server request.

exports.handler = async function(event) {
  var headers = {
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

  var body;
  try { body = JSON.parse(event.body || "{}"); }
  catch(e) { return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) }; }

  var { recordId, email } = body;
  if (!recordId || !email) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing recordId or email" }) };
  }

  var siteUrl = process.env.URL || process.env.DEPLOY_URL || "https://adcrafthq.com";

  // Fire background function server-to-server (not from browser).
  try {
    var bgRes = await fetch(siteUrl + "/.netlify/functions/generate-cover-art-background", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recordId, email }),
    });
    console.log("Cover art background triggered, status:", bgRes.status);

    // If it was already cached the background function returns 200 synchronously
    if (bgRes.status === 200) {
      var bgJson = await bgRes.json();
      if (bgJson.status === "ready") {
        return { statusCode: 200, headers, body: JSON.stringify({ status: "ready" }) };
      }
    }
  } catch(err) {
    console.error("Cover art trigger error:", err.message);
    // Don't fail — caller will poll and fall back to minimal cover if needed
  }

  return {
    statusCode: 202,
    headers,
    body: JSON.stringify({ status: "generating" }),
  };
};
