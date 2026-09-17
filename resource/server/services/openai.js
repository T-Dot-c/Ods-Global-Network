const OpenAI = require('openai');


const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;
const defaultModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';


async function askLLM(messages) {
  if (!openai) {
    return 'LLM not configured. Set OPENAI_API_KEY in .env. Echo: ' + (messages.at(-1)?.content || '');
  }


  const res = await openai.chat.completions.create({
    model: defaultModel,
    messages,
    temperature: 0.3
  });


  return res.choices?.[0]?.message?.content?.trim() || 'Sorry, no response.';
}


module.exports = { askLLM };