const json = (data, init = {}) => new Response(JSON.stringify(data), {
  ...init,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...(init.headers || {}) }
});

async function getScores(db) {
  const { results } = await db.prepare("SELECT display_name AS name, country_code AS country, best_score AS score FROM leaderboard ORDER BY best_score DESC, updated_at ASC LIMIT 10").all();
  return results;
}

async function handleApi(request, env) {
  if (request.method === "GET") return json({ scores: await getScores(env.DB) }, { headers: { "cache-control": "public, max-age=30, s-maxage=60" } });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, { status: 405, headers: { allow: "GET, POST" } });

  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, { status: 400 }); }
  const playerId = String(body.playerId || "").trim();
  const name = String(body.name || "").trim().replace(/\s+/g, " ");
  const country = String(body.country || "").trim().toUpperCase();
  const score = Number(body.score);
  if (!/^[a-zA-Z0-9-]{8,64}$/.test(playerId) || name.length < 1 || name.length > 18 || !/^(?!IL$)[A-Z]{2}$/.test(country) || !Number.isSafeInteger(score) || score < 0 || score > 999999999) {
    return json({ error: "Invalid score entry" }, { status: 400 });
  }

  await env.DB.prepare(`INSERT INTO leaderboard (player_id, display_name, country_code, best_score, updated_at)
    VALUES (?, ?, ?, ?, unixepoch())
    ON CONFLICT(player_id) DO UPDATE SET
      display_name = excluded.display_name,
      country_code = excluded.country_code,
      best_score = MAX(leaderboard.best_score, excluded.best_score),
      updated_at = CASE WHEN excluded.best_score >= leaderboard.best_score THEN unixepoch() ELSE leaderboard.updated_at END`)
    .bind(playerId, name, country, score).run();
  return json({ ok: true, scores: await getScores(env.DB) });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/leaderboard") {
      try { return await handleApi(request, env); }
      catch (error) { console.error(error); return json({ error: "Leaderboard unavailable" }, { status: 503 }); }
    }
    if (url.pathname === "/api/profile" && request.method === "GET") {
      const playerId = url.searchParams.get("id") || "";
      if (!/^[a-zA-Z0-9-]{8,64}$/.test(playerId)) return json({ error: "Invalid profile" }, { status: 400 });
      const profile = await env.DB.prepare("SELECT display_name AS name, country_code AS country, best_score AS score FROM leaderboard WHERE player_id = ?").bind(playerId).first();
      return profile ? json({ profile }) : json({ error: "Profile not found" }, { status: 404 });
    }
    return env.ASSETS.fetch(request);
  },
  async scheduled(_event, env) {
    // Hard bound storage: keep the best 25k unique players, then reclaim pages.
    await env.DB.prepare("DELETE FROM leaderboard WHERE player_id IN (SELECT player_id FROM leaderboard ORDER BY best_score DESC, updated_at DESC LIMIT -1 OFFSET 25000)").run();
    await env.DB.prepare("PRAGMA optimize").run();
  }
};
