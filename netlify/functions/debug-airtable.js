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

  // List existing records to see all field names
  try {
    const res = await fetch(`https://api.airtable.com/v0/${AT_BASE}/${AT_PLANS_TBL}?maxRecords=3`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    // Extract all unique field names across records
    const allFields = new Set();
    (data.records || []).forEach(r => Object.keys(r.fields || {}).forEach(k => allFields.add(k)));
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ httpStatus: res.status, fieldNames: [...allFields], sampleRecord: data.records?.[0] }),
    };
  } catch (err) {
    return { statusCode: 200, headers, body: JSON.stringify({ fetchError: err.message }) };
  }
};
