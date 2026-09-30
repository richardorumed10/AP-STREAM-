const {
  getProviderConfig,
  generateWithProvider: providerGenerate
} = require("./ai_provider");

async function generateWithProvider(options = {}) {
  const {
    message = "",
    messages = [],
    history = [],
    model = "",
    system = ""
  } = options;

  let input = String(message || "").trim();

  if (!input && Array.isArray(messages)) {
    const lastUser = [...messages]
      .reverse()
      .find(m => m && m.role === "user" && m.content);

    if (lastUser) {
      input = String(lastUser.content).trim();
    }
  }

  if (!input && Array.isArray(history)) {
    const lastUser = [...history]
      .reverse()
      .find(m => m && (m.role === "user" || m.sender === "user") && (m.content || m.message));

    if (lastUser) {
      input = String(lastUser.content || lastUser.message).trim();
    }
  }

  return providerGenerate({
    input,
    instructions: system,
    model
  });
}

async function textAI({
  input = "",
  instructions = "",
  model = ""
} = {}) {
  return generateWithProvider({
    message: input,
    system: instructions,
    model
  });
}

async function generalAI({ message = "", messages = [], history = [], model = "", system = "" } = {}) {
  return generateWithProvider({
    message,
    messages,
    history,
    model,
    system
  });
}

module.exports = {
  getProviderConfig,
  generateWithProvider,
  textAI,
  generalAI
};
