const Anthropic = require("@anthropic-ai/sdk");

const AT_BASE = "appCtUgAKIoaa6ECh";
const AT_PLANS_TBL = "tblOAtGXbtWewEAm0";

exports.handler = async function (event) {
  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const { recordId, prompt } = body;
  if (!recordId || !prompt) {
    return { statusCode: 400, body: "Missing recordId or prompt" };
  }

  const token = process.env.AIRTABLE_TOKEN;

  // 1. Call Claude — no timeout pressure, background functions get up to 15 min
  let planText;
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 4096,
      system: process.env.SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });
    planText = message.content[0].text;
  } catch (err) {
    console.error("Anthropic error:", err);
    // Mark the record as failed so the frontend can show an error
    await updateRecord(token, recordId, { "Status": "Error", "Plan Output": "Generation failed: " + err.message });
    return { statusCode: 500, body: "Claude API error" };
  }

  // 2. Update the Airtable record with the completed plan
  try {
    await updateRecord(token, recordId, {
      "Plan Output": planText,
      "Status": "Complete",
    });
  } catch (err) {
    console.error("Airtable update error:", err);
    return { statusCode: 500, body: "Failed to save plan" };
  }

  return { statusCode: 200, body: "OK" };
};

async function updateRecord(token, recordId, fields) {
  const res = await fetch(
    `https://api.airtable.com/v0/${AT_BASE}/${AT_PLANS_TBL}/${recordId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    }
  );
  if (!res.ok) {
    const data = await res.json();
    throw new Error(JSON.stringify(data));
  }
}
