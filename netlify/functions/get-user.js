const AT_BASE = "appCtUgAKIoaa6ECh";
const AT_USERS_TBL = "tbl7fisATFgQXPOhP";

exports.handler = async function (event) {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  const email = event.queryStringParameters && event.queryStringParameters.email;
  if (!email) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing email" }) };
  }

  try {
    var url = "https://api.airtable.com/v0/" + AT_BASE + "/" + AT_USERS_TBL
      + "?filterByFormula=" + encodeURIComponent("{Email}=\"" + email + "\"")
      + "&fields[]=Tier&fields[]=Email&fields[]=Name";

    var res = await fetch(url, {
      headers: { Authorization: "Bearer " + process.env.AIRTABLE_TOKEN },
    });

    var data = await res.json();
    if (!res.ok) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to fetch user" }) };
    }

    if (!data.records || data.records.length === 0) {
      return { statusCode: 200, headers, body: JSON.stringify({ tier: "Free" }) };
    }

    var r = data.records[0];
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        tier: r.fields["Tier"] || "Free",
        name: r.fields["Name"] || "",
        recordId: r.id,
      }),
    };
  } catch (err) {
    console.error("get-user error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to fetch user", tier: "Free" }) };
  }
};
