function splitMessage(message, maxLen = 4500) {
  const chunks = [];
  let remaining = message;

  while (remaining.length > maxLen) {
    chunks.push(remaining.slice(0, maxLen));
    remaining = remaining.slice(maxLen);
  }
  if (remaining.length > 0) {
    chunks.push(remaining);
  }
  return chunks;
}

export async function notifyLine(message) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const to = process.env.LINE_TARGET_USER_ID;
  if (!token || !to) {
    throw new Error("LINE env is not configured.");
  }

  const chunks = splitMessage(message);
  for (const text of chunks) {
    const response = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        to,
        messages: [{ type: "text", text }]
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`LINE notify failed: ${response.status} ${body}`);
    }
  }
}

export async function notifyResendFallback(subject, message) {
  const enabled = process.env.ENABLE_EMAIL_FALLBACK === "true";
  if (!enabled) {
    return false;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.RESEND_TO_EMAIL;
  if (!apiKey || !from || !to) {
    throw new Error("Resend fallback is enabled but env is missing.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text: message
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend notify failed: ${response.status} ${body}`);
  }

  return true;
}
