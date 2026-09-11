import React, { useEffect, useState } from "react";
import { countryFlag } from "../data/countries";

const LeaderboardPage = ({ navigate }) => {
  const [scores, setScores] = useState([]);
  const [status, setStatus] = useState("loading");
  const load = async () => {
    setStatus("loading");
    try {
      const response = await fetch("/api/leaderboard", { cache: "no-store" });
      if (!response.ok) throw new Error();
      setScores((await response.json()).scores || []);
      setStatus("ready");
    } catch (_) { setStatus("error"); }
  };
  useEffect(() => { load(); }, []);

  return (
    <main className="leaderboard-page">
      <header className="page-bar"><button onClick={() => navigate("/")}>← Back to game</button><span>GLOBAL RANKING</span></header>
      <section className="ranking-panel">
        <div className="ranking-title"><div><small>BEST PLAYERS</small><h1>Leaderboard</h1></div><button onClick={load} aria-label="Refresh leaderboard">↻</button></div>
        {status === "loading" && <p className="ranking-message">Loading scores…</p>}
        {status === "error" && <p className="ranking-message">The leaderboard couldn’t load. <button onClick={load}>Try again</button></p>}
        {status === "ready" && !scores.length && <p className="ranking-message">No scores yet. Be the first.</p>}
        {scores.length > 0 && <>
          <div className="podium">{scores.slice(0, 3).map((entry, index) => <article className={`podium-place podium-place--${index + 1}`} key={`${entry.name}-${index}`}><span className="podium-medal">{["🥇", "🥈", "🥉"][index]}</span><small>#{index + 1}</small><b>{entry.country && <i>{countryFlag(entry.country)}</i>}{entry.name}</b>{entry.city && <em>{entry.city}</em>}<strong>{entry.score.toLocaleString()}</strong></article>)}</div>
          {scores.length > 3 && <ol className="ranking-list" start="4">{scores.slice(3).map((entry, index) => <li key={`${entry.name}-${index + 3}`}><span>{String(index + 4).padStart(2, "0")}</span><b>{entry.country && <i>{countryFlag(entry.country)}</i>}{entry.name}{entry.city && <small>{entry.city}</small>}</b><strong>{entry.score.toLocaleString()}</strong></li>)}</ol>}
        </>}
      </section>
      <a className="source-link" href="https://github.com/Rami-0/2048" target="_blank" rel="noreferrer">GitHub ↗</a>
    </main>
  );
};

export default LeaderboardPage;
