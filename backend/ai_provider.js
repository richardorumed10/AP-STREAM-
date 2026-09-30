const LOCAL_AI_URL =
  String(
    process.env.APSTREAM_LOCAL_AI_URL ||
    "http://127.0.0.1:8081/v1/chat/completions"
  ).trim();

const LOCAL_AI_MODEL =
  String(
    process.env.APSTREAM_LOCAL_AI_MODEL ||
    "Qwen/Qwen2.5-1.5B-Instruct-GGUF:Q4_K_M"
  ).trim();

function getProviderConfig() {
  return {
    name: "AP-STREAM AI",
    type: "local-runtime",
    configured: Boolean(LOCAL_AI_URL),
    runtime: "local",
    secretRequired: false
  };
}

async function generateWithProvider({
  input,
  instructions,
  model
}) {
  const config = getProviderConfig();

  if (!config.configured) {
    throw new Error("AP-STREAM AI local runtime is not configured.");
  }

  const messages = [];

  if (instructions) {
    messages.push({
      role: "system",
      content: instructions
    });
  }

  messages.push({
    role: "user",
    content: String(input || "")
  });

  const response = await fetch(LOCAL_AI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: model || LOCAL_AI_MODEL,
      messages,
      temperature: 0.2,
      max_tokens: 96,
      stream: false
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
      data?.error ||
      `Local AP-STREAM AI returned HTTP ${response.status}`
    );
  }

  return {
    output_text:
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.text ||
      data?.output_text ||
      data?.result ||
      ""
  };
}

module.exports = {
  getProviderConfig,
  generateWithProvider
};
