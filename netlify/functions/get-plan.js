exports.handler = async function(event) {
  const recordId = event.queryStringParameters && event.queryStringParameters.recordId;

  if (!recordId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing recordId' }) };
  }

  const token = process.env.AIRTABLE_TOKEN;
  const url = `https://api.airtable.com/v0/appCtUgAKIoaa6ECh/tblOAtGXbtWewEAm0/${recordId}`;

  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await response.json();

  return {
    statusCode: response.status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(data)
  };
};
