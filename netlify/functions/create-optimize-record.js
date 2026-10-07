// Creates a pending "Generating" plan record for an optimization run.
// Returns the new recordId so the browser can redirect immediately.
var AT_BASE = "appCtUgAKIoaa6ECh";
var AT_PLANS_TBL = "tblOAtGXbtWewEAm0";

exports.handler = async function (event) {
  var headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: "Method Not Allowed" };

  var body;
  try { body = JSON.parse(event.body); } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  var email = body.email || "";
  var bizName = body.bizName || "";
  var originalPlanName = body.originalPlanName || "Untitled Plan";
  var planName = originalPlanName + " — Optimized";

  try {
    var res = await fetch("https://api.airtable.com/v0/" + AT_BASE + "/" + AT_PLANS_TBL, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.AIRTABLE_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          "Plan Name": planName,
          "Email": email,
          "Business Name": bizName,
          "Status": "Generating",
        },
      }),
    });

    var data = await res.json();
    if (!res.ok) {
      console.error("Airtable create error:", JSON.stringify(data));
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to create record" }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ recordId: data.id, planName }) };
  } catch (err) {
    console.error("create-optimize-record error:", err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
