const AT_BASE = "appCtUgAKIoaa6ECh";
const AT_PLANS_TBL = "tblOAtGXbtWewEAm0";
const AT_PROFILES_TBL = "tblvXoTaqOdiZ4Kzc";

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
