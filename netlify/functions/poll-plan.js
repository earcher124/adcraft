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

  const recordId = event.queryStringParameters?.id;
  if (!recordId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing id" }) };
  }

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${AT_BASE}/${AT_PLANS_TBL}/${recordId}`,
      { headers: { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}` } }
    );

    const data = await res.json();
    if (!res.ok) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to fetch record" }) };
    }

    const rawStatus = data.fields?.["Status"] || "Generating";
    const status = rawStatus === "Ready" ? "Complete" : rawStatus;
    const plan = data.fields?.["Plan Output"] || null;
    const bizName = data.fields?.["Business Name"] || "";
    const intake = {
      bizName:            data.fields?.["Business Name"]    || "",
      bizType:            data.fields?.["Business Type"]    || "",
      productType:        data.fields?.["Product"]          || "",
      targetCustomer:     data.fields?.["Target Customer"]  || "",
      goal:               data.fields?.["Primary Goal"]     || "",
      geo:                data.fields?.["Geography"]        || "",
      monthlyRevenue:     data.fields?.["Monthly Revenue"]  || "",
      currentAdvertising: data.fields?.["Current Advertising"] || "",
      monthlyAdBudget:    data.fields?.["Monthly Ad Budget"] || "",
      budgetTier:         data.fields?.["Budget Tier"]      || "",
      email:              data.fields?.["Email"]            || "",
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ status, plan, bizName, intake }),
    };
  } catch (err) {
    console.error("Poll error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to poll plan" }) };
  }
};
