const AT_BASE = "appCtUgAKIoaa6ECh";
const AT_PLANS_TBL = "tblOAtGXbtWewEAm0";

exports.handler = async function (event) {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  const email = event.queryStringParameters?.email;
  if (!email) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing email" }) };
  }

  try {
    const formula = encodeURIComponent(`{Email}="${email}"`);
    const sort = encodeURIComponent(JSON.stringify([{ field: "Created", direction: "desc" }]));
    const fields = ["Plan Name", "Business Name", "Status", "Monthly Ad Budget", "Created"].map(f => `fields[]=${encodeURIComponent(f)}`).join("&");

    const url = `https://api.airtable.com/v0/${AT_BASE}/${AT_PLANS_TBL}?filterByFormula=${formula}&sort[0][field]=Created&sort[0][direction]=desc&${fields}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}` },
    });

    const data = await res.json();
    if (!res.ok) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to fetch plans" }) };
    }

    const plans = (data.records || []).map(r => ({
      id: r.id,
      planName: r.fields["Plan Name"] || "Untitled Plan",
      bizName: r.fields["Business Name"] || "",
      status: r.fields["Status"] || "",
      budget: r.fields["Monthly Ad Budget"] ? "$" + Number(r.fields["Monthly Ad Budget"]).toLocaleString() + "/mo" : "",
      created: r.fields["Created"] || r.createdTime || "",
    }));

    return { statusCode: 200, headers, body: JSON.stringify({ plans }) };
  } catch (err) {
    console.error("get-plans error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to fetch plans" }) };
  }
};
