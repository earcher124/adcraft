// CORS proxy: receives multipart file upload + metadata from browser,
// parses the file to text, then fires the background optimize function.
var Busboy = require("busboy");

exports.handler = async function (event) {
  var headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: "Method Not Allowed" };

  // Parse multipart form data
  var fields = {};
  var files = []; // [{filename, content (string)}]

  try {
    await new Promise(function (resolve, reject) {
      var bb = Busboy({
        headers: { "content-type": event.headers["content-type"] || event.headers["Content-Type"] },
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
      });

      bb.on("field", function (name, val) { fields[name] = val; });

      bb.on("file", function (name, stream, info) {
        var chunks = [];
        stream.on("data", function (chunk) { chunks.push(chunk); });
        stream.on("end", function () {
          var buf = Buffer.concat(chunks);
          // Store as base64 — background function will decode
          files.push({ filename: info.filename, mimeType: info.mimeType, data: buf.toString("base64") });
        });
      });

      bb.on("finish", resolve);
      bb.on("error", reject);

      var buf = event.isBase64Encoded
        ? Buffer.from(event.body, "base64")
        : Buffer.from(event.body || "", "utf8");
      bb.write(buf);
      bb.end();
    });
  } catch (err) {
    console.error("Multipart parse error:", err.message);
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Failed to parse upload: " + err.message }) };
  }

  var recordId = fields.recordId;
  var originalPlanId = fields.originalPlanId;

  if (!recordId || !originalPlanId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing recordId or originalPlanId" }) };
  }

  if (files.length === 0) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "No files uploaded" }) };
  }

  var siteUrl = process.env.URL || process.env.DEPLOY_URL || "https://adcrafthq.com";

  try {
    var bgRes = await fetch(siteUrl + "/.netlify/functions/optimize-plan-background", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recordId, originalPlanId, files }),
    });
    console.log("Optimize background triggered, status:", bgRes.status);
  } catch (err) {
    console.error("Optimize trigger error:", err.message);
  }

  return { statusCode: 202, headers, body: JSON.stringify({ ok: true }) };
};
