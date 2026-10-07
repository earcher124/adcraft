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
    // Airtable batch update supports up to 10 records at a time
    const batches = [];
    for (let i = 0; i < ids.length; i += 10) {
      batches.push(ids.slice(i, i + 10));
    }

    for (const batch of batches) {
      const res = await fetch(`https://api.airtable.com/v0/${AT_BASE}/${AT_PLANS_TBL}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: batch.map(id => ({ id, fields: { Status: "Archived" } })),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        console.error("Airtable archive error:", d);
        return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to archive" }) };
      }
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error("archive-plan error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to archive" }) };
  }
};
