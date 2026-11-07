// Cloudflare Worker: принимает заказ с сайта и отправляет его в Telegram, не раскрывая токен бота.
// Переменные (Settings → Variables): TG_TOKEN, TG_CHAT (id чата), ALLOWED_ORIGIN (например https://ваш-домен.ru)
export default {
  async fetch(req, env) {
    const cors = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors });
    let data; try { data = await req.json(); } catch (e) { return new Response("Bad JSON", { status: 400, headers: cors }); }
    const text = String(data.text || "").slice(0, 3500);
    if (!text) return new Response("Empty", { status: 400, headers: cors });
    const r = await fetch(`https://api.telegram.org/bot${env.TG_TOKEN}/sendMessage`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: env.TG_CHAT, text }),
    });
    return new Response(r.ok ? "ok" : "tg error", { status: r.ok ? 200 : 502, headers: cors });
  },
};
