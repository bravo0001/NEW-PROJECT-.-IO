// ═══════════════════════════════════════════════════
// APL Nexus — AI Chatbot (Gemini API)
// ═══════════════════════════════════════════════════

const API_KEY = 'AIzaSyDH1gpPW0zGex06NWQmuXmT2foryYP1-Ck';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

import { store } from './store.js';

function buildSystemContext() {
  const stats = store.getStats();
  const apls = store.getAllAPLs();
  const summaries = apls.map(a =>
    `• "${a.name}" (${a.type}, ${a.date}) — ${a.actualParticipants || '?'} participants, rating ${a.successRating}/10. Tags: ${(a.tags||[]).join(', ')}`
  ).join('\n');

  return `You are the APL Nexus AI Assistant — an intelligent helper for an organization's Activity/Program/Meet (APL) management system.

CURRENT DATA SUMMARY:
- Total APLs documented: ${stats.total}
- Total participants across all events: ${stats.totalParticipants}
- Total budget spent: ₹${stats.totalBudget.toLocaleString()}
- Average success rating: ${stats.avgRating}/10
- Average feedback score: ${stats.avgFeedback}/5
- Event types: ${Object.entries(stats.types).map(([k,v])=>`${k}(${v})`).join(', ')}

ALL APLs:
${summaries}

You can help users with:
1. Analyzing APL data and finding patterns
2. Comparing events and suggesting improvements
3. Planning future APLs based on past learnings
4. Generating reports and summaries
5. Answering questions about specific events
6. Providing recommendations based on data

Be concise, data-driven, and actionable. Use specific numbers from the data. Format responses with bullet points and sections when appropriate. If asked about something not in the data, say so clearly.`;
}

let chatHistory = [];

export async function sendMessage(userMessage) {
  const systemContext = buildSystemContext();

  chatHistory.push({ role: 'user', parts: [{ text: userMessage }] });

  const contents = [
    { role: 'user', parts: [{ text: systemContext + '\n\nUser query: ' + chatHistory[0].parts[0].text }] },
    { role: 'model', parts: [{ text: 'I understand. I\'m the APL Nexus AI Assistant with full access to your APL data. How can I help?' }] },
    ...chatHistory.slice(1)
  ];

  // If only one message, simplify
  const requestContents = chatHistory.length === 1
    ? [{ role: 'user', parts: [{ text: systemContext + '\n\nUser query: ' + userMessage }] }]
    : contents;

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: requestContents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          topP: 0.9
        }
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'API request failed');
    }

    const data = await res.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I couldn\'t generate a response.';

    chatHistory.push({ role: 'model', parts: [{ text: reply }] });
    return reply;
  } catch (error) {
    chatHistory.pop(); // Remove failed user message
    throw error;
  }
}

export function clearChat() {
  chatHistory = [];
}

export function renderChatWidget() {
  return `
    <div id="chat-widget" class="chat-widget collapsed">
      <button id="chat-toggle" class="chat-toggle" title="AI Assistant">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span class="chat-badge hidden" id="chat-badge">AI</span>
      </button>
      <div class="chat-panel" id="chat-panel">
        <div class="chat-header">
          <div class="chat-header-info">
            <div class="chat-avatar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            </div>
            <div>
              <span class="chat-title">Nexus AI</span>
              <span class="chat-subtitle">Ask about your APLs</span>
            </div>
          </div>
          <button id="chat-close" class="chat-close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="chat-messages" id="chat-messages">
          <div class="chat-msg bot">
            <div class="chat-msg-content">
              <p>👋 Hi! I'm your APL Nexus AI Assistant. I can help you analyze your events, find patterns, plan future activities, and generate insights. Try asking:</p>
              <div class="chat-suggestions">
                <button class="chat-suggestion" data-q="What are the key trends across all our APLs?">📊 Key trends</button>
                <button class="chat-suggestion" data-q="Which APL was most successful and why?">🏆 Best APL</button>
                <button class="chat-suggestion" data-q="What recommendations do you have for our next event?">💡 Recommendations</button>
                <button class="chat-suggestion" data-q="Compare budget efficiency across all events">💰 Budget analysis</button>
              </div>
            </div>
          </div>
        </div>
        <div class="chat-input-area">
          <input type="text" id="chat-input" class="chat-input" placeholder="Ask about your APLs..." autocomplete="off" />
          <button id="chat-send" class="chat-send" title="Send">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </div>`;
}

export function initChatEvents() {
  const toggle = document.getElementById('chat-toggle');
  const panel = document.getElementById('chat-panel');
  const widget = document.getElementById('chat-widget');
  const close = document.getElementById('chat-close');
  const input = document.getElementById('chat-input');
  const send = document.getElementById('chat-send');
  const messages = document.getElementById('chat-messages');

  toggle.addEventListener('click', () => {
    widget.classList.toggle('collapsed');
  });

  close.addEventListener('click', () => {
    widget.classList.add('collapsed');
  });

  async function handleSend() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    // Add user message
    const userDiv = document.createElement('div');
    userDiv.className = 'chat-msg user';
    userDiv.innerHTML = `<div class="chat-msg-content"><p>${escapeHtml(text)}</p></div>`;
    messages.appendChild(userDiv);

    // Add loading indicator
    const loadDiv = document.createElement('div');
    loadDiv.className = 'chat-msg bot loading';
    loadDiv.innerHTML = `<div class="chat-msg-content"><div class="chat-typing"><span></span><span></span><span></span></div></div>`;
    messages.appendChild(loadDiv);
    messages.scrollTop = messages.scrollHeight;

    try {
      const reply = await sendMessage(text);
      loadDiv.remove();
      const botDiv = document.createElement('div');
      botDiv.className = 'chat-msg bot';
      botDiv.innerHTML = `<div class="chat-msg-content">${formatMarkdown(reply)}</div>`;
      messages.appendChild(botDiv);
    } catch (err) {
      loadDiv.remove();
      const errDiv = document.createElement('div');
      errDiv.className = 'chat-msg bot';
      errDiv.innerHTML = `<div class="chat-msg-content chat-error"><p>⚠️ ${escapeHtml(err.message)}</p></div>`;
      messages.appendChild(errDiv);
    }
    messages.scrollTop = messages.scrollHeight;
  }

  send.addEventListener('click', handleSend);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSend(); });

  // Suggestion buttons
  messages.addEventListener('click', (e) => {
    const btn = e.target.closest('.chat-suggestion');
    if (btn) {
      input.value = btn.dataset.q;
      handleSend();
    }
  });
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function formatMarkdown(text) {
  // Basic markdown: bold, italic, bullet points, line breaks
  let html = escapeHtml(text);
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/^[-•] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');
  return `<p>${html}</p>`;
}
