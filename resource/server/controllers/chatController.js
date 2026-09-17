const { pool } = require('../config/db');
const { askLLM } = require('../services/openai');

const sendMessage = async (req, res, next) => {
  try {
    const { conversationId, message } = req.body;

    if (!message || typeof message !== 'string' || message.length > 4000) {
      return res.status(400).json({ error: 'Message is required and must be a string under 4000 chars.' });
    }

    let convoId = conversationId;

    // Create new conversation if none exists
    if (!convoId) {
      const title = (message.length > 40 ? message.slice(0, 40) + '…' : message) || 'New chat';
      const [result] = await pool.query(
        'INSERT INTO conversations (title) VALUES (?)',
        [title]
      );
      convoId = result.insertId;
    }

    // Insert user message
    await pool.query(
      'INSERT INTO messages (conversationId, role, content) VALUES (?, ?, ?)',
      [convoId, 'user', message]
    );

    // Get last 40 messages for context
    const [historyRows] = await pool.query(
      'SELECT role, content FROM messages WHERE conversationId = ? ORDER BY createdAt ASC LIMIT 40',
      [convoId]
    );

    const systemPrompt = process.env.SYSTEM_PROMPT || 'You are a helpful, concise assistant.';
    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...historyRows.map(m => ({ role: m.role, content: m.content }))
    ];

    const reply = await askLLM(chatMessages);

    // Insert assistant reply
    await pool.query(
      'INSERT INTO messages (conversationId, role, content) VALUES (?, ?, ?)',
      [convoId, 'assistant', reply]
    );

    res.status(200).json({ conversationId: convoId, reply });
  } catch (err) {
    next(err);
  }
};

const getConversation = async (req, res, next) => {
  try {
    const convoId = req.params.id;

    const [convos] = await pool.query(
      'SELECT * FROM conversations WHERE id = ?',
      [convoId]
    );

    if (convos.length === 0) return res.status(404).json({ message: 'Conversation not found' });
    const conversation = convos[0];

    const [messages] = await pool.query(
      'SELECT * FROM messages WHERE conversationId = ? ORDER BY createdAt ASC',
      [convoId]
    );

    res.json({ conversation, messages });
  } catch (err) {
    next(err);
  }
};

const listConversations = async (req, res, next) => {
  try {
    const [conversations] = await pool.query(
      'SELECT * FROM conversations ORDER BY updatedAt DESC LIMIT 50'
    );
    res.json({ conversations });
  } catch (err) {
    next(err);
  }
};

module.exports = { sendMessage, getConversation, listConversations };
