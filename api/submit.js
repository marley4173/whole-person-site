// Vercel serverless function: receives the three website forms and emails them to the foundation.
// Nothing is stored on the server. Needs these environment variables in Vercel:
//   RESEND_API_KEY, TO_EMAIL, FROM_EMAIL   (optional: ALLOWED_ORIGINS, comma separated)
const R = require('../form-rules.js');
const hits = new Map();

function clientKey(req) {
  const xf = String((req.headers && req.headers['x-forwarded-for']) || '').split(',')[0].trim();
  return xf || (req.socket && req.socket.remoteAddress) || 'unknown';
}
function tooMany(key) {
  const now = Date.now(), win = 10 * 60 * 1000;
  const list = (hits.get(key) || []).filter((t) => now - t < win);
  list.push(now); hits.set(key, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 5;
}

async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }
  const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (allowed.length && !allowed.includes((req.headers && req.headers.origin) || '')) {
    return res.status(403).json({ ok: false, error: 'Forbidden.' });
  }
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
  if (!b || typeof b !== 'object' || Array.isArray(b)) return res.status(400).json({ ok: false, error: 'Invalid request.' });
  if (tooMany(clientKey(req))) return res.status(429).json({ ok: false, error: 'Too many requests. Please try again later.' });
  // Bots: hidden field filled in, or form sent too fast. Pretend it worked, send nothing.
  if (b.website || !(Number(b.elapsed) >= 2500)) return res.status(200).json({ ok: true });
  const v = R.validate(typeof b.type === 'string' ? b.type : '', b);
  if (!v.ok) return res.status(400).json({ ok: false, errors: v.errors });
  const { RESEND_API_KEY, TO_EMAIL, FROM_EMAIL } = process.env;
  if (!RESEND_API_KEY || !TO_EMAIL || !FROM_EMAIL) return res.status(500).json({ ok: false, error: 'The form is not set up yet. Please email us instead.' });
  const f = R.FORMS[b.type];
  const text = Object.keys(f.fields).filter((k) => v.data[k]).map((k) => f.fields[k].label + ': ' + v.data[k]).join('\n\n')
    + '\n\nThe sender agreed to the privacy notice.\nSent from the website form.';
  const mail = { from: FROM_EMAIL, to: [TO_EMAIL], subject: 'New ' + f.label.toLowerCase() + ' (website)', text };
  if (v.data.email) mail.reply_to = v.data.email;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(mail)
    });
    if (!r.ok) return res.status(502).json({ ok: false, error: 'We could not send your message. Please try again or email us.' });
  } catch (e) {
    return res.status(502).json({ ok: false, error: 'We could not send your message. Please try again or email us.' });
  }
  return res.status(200).json({ ok: true });
}
module.exports = handler;
module.exports._reset = () => hits.clear();
