const { generateWithProvider } = require("./ai_provider");

async function generateAI({ input, instructions, model }) {
  const response = await generateWithProvider({
    input,
    instructions,
    model
  });

  return {
    output_text: response.output_text || ""
  };
}

module.exports = { generateAI };
