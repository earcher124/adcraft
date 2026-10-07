const AT_BASE = "appCtUgAKIoaa6ECh";
const AT_PLANS_TBL = "tblOAtGXbtWewEAm0";

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  let body;
  try { body = JSON.parse(event.body); } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { ids } = body;
  if (!ids || !ids.length) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing ids" }) };
  }

  try {
    for (const id of ids) {
      const res = await fetch(`https://api.airtable.com/v0/${AT_BASE}/${AT_PLANS_TBL}/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fields: { Status: "Archived" } }),
      });
      if (!res.ok) {
        const d = await res.json();
        console.error("Airtable archive error for", id, JSON.stringify(d));
        return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to archive", detail: d }) };
      }
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error("archive-plan error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to archive" }) };
  }
};
