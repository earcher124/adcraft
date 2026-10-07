// TEMPORARY debug function — remove after diagnosis
const AT_BASE = "appCtUgAKIoaa6ECh";
const AT_PLANS_TBL = "tblOAtGXbtWewEAm0";

exports.handler = async function (event) {
  const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

  // Check token exists
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) {
    return { statusCode: 200, headers, body: JSON.stringify({ error: "AIRTABLE_TOKEN is not set" }) };
  }

  // Try minimal POST
  try {
    const res = await fetch(`https://api.airtable.com/v0/${AT_BASE}/${AT_PLANS_TBL}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields: { "Plan Name": "DEBUG TEST", "Status": "Generating" } }),
    });
    const data = await res.json();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ httpStatus: res.status, airtableResponse: data }),
    };
  } catch (err) {
    return { statusCode: 200, headers, body: JSON.stringify({ fetchError: err.message }) };
  }
};
