// Serverless function: calls Groq (free) with your key kept on the server.
// POST /api/generate

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });
  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: "Server is missing GROQ_API_KEY. Add it in Vercel and redeploy." });
  }

  try {
    const { notes, tone = "Warm", length = "Standard", lang = "English", milestone = true } = req.body || {};
    if (!notes || !notes.trim()) return res.status(400).json({ error: "No notes provided." });

    const sys =
      "You are Sprout, a writing assistant for early-childhood educators. " +
      "You turn a teacher's rough shorthand into a warm, specific daily update that a family will read on their phone. " +
      "Sound like a caring teacher who knows the child, never clinical or robotic. Keep concrete details (meals, naps, wins, mood) but phrase them kindly. " +
      "Never invent facts that aren't in the notes. Frame hard moments (cried, accident) honestly but gently. " +
      "You always reply with a single valid JSON object and nothing else.";

    const lengthHint = length === "Short" ? "2-3 short sentences." : "3-5 sentences, one small paragraph.";

    const prompt =
      `Here are today's raw notes. Each line or block is a different child.\n\n"""${notes}"""\n\n` +
      `Write one update per child.\nTone: ${tone}. Length: ${lengthHint}\nLanguage: write each message in ${lang}.\n` +
      (milestone
        ? `Also identify one developmental milestone or growth moment from that child's notes (a first, a skill, kindness, independence) as a short phrase in "milestone" (in ${lang}). If nothing clearly qualifies, use "".\n`
        : `Set every "milestone" to "".\n`) +
      `Return JSON in exactly this shape:\n` +
      `{"updates":[{"child":"NAME","message":"the family-ready update","milestone":"short phrase or empty"}]}`;

    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        temperature: 0.7,
        max_tokens: 1200,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: sys },
          { role: "user", content: prompt },
        ],
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      // Surface the real Groq error so it's debuggable from the browser.
      return res.status(502).json({ error: "Groq: " + (data?.error?.message || JSON.stringify(data)) });
    }

    const text = data?.choices?.[0]?.message?.content || "";
    const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (e) {
      return res.status(502).json({ error: "Could not parse model output: " + text.slice(0, 180) });
    }
    if (!parsed.updates || !parsed.updates.length) return res.status(502).json({ error: "No updates returned." });

    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(500).json({ error: "Server error: " + (e?.message || String(e)) });
  }
}
