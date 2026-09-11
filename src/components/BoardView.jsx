import React, { useCallback, useEffect, useRef, useState } from "react";
import Tile from "./Tile";
import Cell from "./Cell";
import { Board } from "../helper";
import useEvent from "../hooks/useEvent";
import GameOverlay from "./GameOverlay";
import { countryFlag, getCountries } from "../data/countries";

const directions = { ArrowLeft: 0, ArrowUp: 1, ArrowRight: 2, ArrowDown: 3 };
const getPlayerId = () => {
  let id = localStorage.getItem("playerId");
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    localStorage.setItem("playerId", id);
  }
  return id;
};

const BoardView = ({ highestScore, setHighestScore }) => {
  const [board, setBoard] = useState(() => new Board());
  const [leaderboard, setLeaderboard] = useState([]);
  const [name, setName] = useState(() => localStorage.getItem("playerName") || "");
  const [country, setCountry] = useState(() => localStorage.getItem("playerCountry") || "");
  const [showScores, setShowScores] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [transferCode, setTransferCode] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const touchStart = useRef(null);
  const countries = useRef(getCountries()).current;

  const loadLeaderboard = useCallback(async () => {
    try {
      const response = await fetch("/api/leaderboard");
      if (response.ok) setLeaderboard((await response.json()).scores || []);
    } catch (_) {}
  }, []);

  useEffect(() => { loadLeaderboard(); }, [loadLeaderboard]);
  const restoreProfile = useCallback(async (code) => {
    const playerId = String(code || "").trim();
    if (!/^[a-zA-Z0-9-]{8,64}$/.test(playerId)) { setProfileMessage("That transfer code is not valid."); return; }
    setProfileMessage("Finding your profile…");
    try {
      const response = await fetch(`/api/profile?id=${encodeURIComponent(playerId)}`);
      if (!response.ok) throw new Error();
      const { profile } = await response.json();
      localStorage.setItem("playerId", playerId);
      localStorage.setItem("playerName", profile.name);
      localStorage.setItem("playerCountry", profile.country);
      localStorage.setItem("highestScore", String(profile.score));
      setName(profile.name); setCountry(profile.country); setHighestScore(profile.score);
      setProfileMessage(`Welcome back, ${profile.name}.`);
    } catch (_) { setProfileMessage("We couldn't find that profile."); }
  }, [setHighestScore]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const transferred = params.get("profile");
    if (transferred) {
      setShowProfile(true);
      setTransferCode(transferred);
      restoreProfile(transferred);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [restoreProfile]);
  useEffect(() => {
    if (board.score > highestScore) {
      setHighestScore(board.score);
      localStorage.setItem("highestScore", String(board.score));
    }
  }, [board.score, highestScore, setHighestScore]);

  const move = useCallback((direction) => {
    setBoard((current) => {
      if (current.hasWon() || current.hasLost()) return current;
      const clone = Object.assign(Object.create(Object.getPrototypeOf(current)), current);
      return clone.move(direction);
    });
  }, []);

  const handleKeyDown = useCallback((event) => {
    if (directions[event.key] !== undefined) {
      event.preventDefault();
      move(directions[event.key]);
    }
  }, [move]);
  useEvent("keydown", handleKeyDown);

  const handleTouchStart = (event) => {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };
  const handleTouchEnd = (event) => {
    if (!touchStart.current) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 0) : (dy > 0 ? 3 : 1));
  };

  const submitScore = async () => {
    setShowScores(true);
    if (!name.trim() || !country) return;
    setSubmitting(true);
    localStorage.setItem("playerName", name.trim());
    localStorage.setItem("playerCountry", country);
    try {
      const response = await fetch("/api/leaderboard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ playerId: getPlayerId(), name: name.trim(), country, score: board.score }) });
      if (response.ok) await loadLeaderboard();
    } finally { setSubmitting(false); }
  };

  const copyProfile = async () => {
    if (!localStorage.getItem("playerId")) { setProfileMessage("Save a score before transferring this profile."); return; }
    const playerId = getPlayerId();
    const link = `${window.location.origin}${window.location.pathname}?profile=${encodeURIComponent(playerId)}`;
    try { await navigator.clipboard.writeText(link); setProfileMessage("Transfer link copied."); }
    catch (_) { setTransferCode(playerId); setProfileMessage("Copy the code below."); }
  };

  const resetGame = () => setBoard(new Board());
  const continueGame = () => setBoard((current) => {
    const clone = Object.assign(Object.create(Object.getPrototypeOf(current)), current);
    return clone.continueGame();
  });

  return (
    <main className="game-shell">
      <section className="game-column">
        <header className="masthead"><div><p className="kicker">A small game of patience</p><h1>Twenty<br/>Forty-Eight</h1></div><p className="intro">Join equal tiles. Find a rhythm. Make room for one more move.</p></header>
        <div className="game-meta"><button className="new-game" onClick={resetGame}>New game <span>↗</span></button><div className="scores" aria-label="Game scores"><div><span>Score</span><strong>{board.score.toLocaleString()}</strong></div><div><span>Personal best</span><strong>{highestScore.toLocaleString()}</strong></div></div></div>
        <div className="board" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} aria-label="2048 game board">
          {board.cells.map((row, rowIndex) => <div key={rowIndex}>{row.map((_, colIndex) => <Cell key={`${rowIndex}-${colIndex}`} />)}</div>)}
          {board.tiles.filter((tile) => tile.value !== 0).map((tile) => <Tile tile={tile} key={tile.id} />)}
          <GameOverlay onRestart={resetGame} onContinue={continueGame} onSubmit={submitScore} board={board} submitting={submitting} />
        </div>
        <div className="mobile-hint">Swipe to move · arrow keys on desktop</div>
      </section>
      <aside className="leaderboard">
        <div className="leaderboard__head"><div><p className="kicker">The quiet competition</p><h2>Best runs</h2></div><button className="text-button" onClick={() => setShowScores(!showScores)}>{showScores ? "Close" : "View"}</button></div>
        <div className={`leaderboard__body ${showScores ? "is-open" : ""}`}>
          <ol>{leaderboard.length ? leaderboard.map((entry, index) => <li key={`${entry.name}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><b>{entry.country ? <i aria-label={entry.country}>{countryFlag(entry.country)}</i> : null}{entry.name}</b><strong>{entry.score.toLocaleString()}</strong></li>) : <li className="empty">No scores yet. The first mark is yours.</li>}</ol>
          <div className="submit-score"><label htmlFor="player-name">Your profile</label><div className="profile-fields"><input id="player-name" maxLength="18" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name"/><select aria-label="Country" value={country} onChange={(event) => setCountry(event.target.value)}><option value="">Country</option>{countries.map((item) => <option value={item.code} key={item.code}>{item.flag} {item.name}</option>)}</select></div><button className="save-score" onClick={submitScore} disabled={!name.trim() || !country || board.score < 2 || submitting}>Save score · {board.score.toLocaleString()}</button><div className="profile-actions"><button className="quiet-button" onClick={() => setShowProfile(true)} disabled={!localStorage.getItem("playerId")}>Move profile to another browser</button></div><small>{localStorage.getItem("playerId") ? "Only your personal best is kept." : "Save your first score to enable profile transfer."}</small></div>
        </div>
        <footer><span>HOW TO PLAY</span><p>Use the arrow keys or swipe. Equal numbers merge; every move creates a new tile. Think ahead.</p><a href="https://github.com/Rami-0/2048" target="_blank" rel="noreferrer">View source on GitHub ↗</a></footer>
      </aside>
      {showProfile && <div className="profile-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-title" onMouseDown={(event) => event.target === event.currentTarget && setShowProfile(false)}><div className="profile-dialog__sheet"><button className="dialog-close" aria-label="Close profile transfer" onClick={() => setShowProfile(false)}>×</button><p className="kicker">One profile, every browser</p><h2 id="profile-title">Carry your best run with you.</h2><p>Copy a private transfer link on this browser, then open it on the other one. Your name, flag and best score will follow.</p><button className="copy-profile" onClick={copyProfile}>Copy transfer link</button><div className="transfer-divider"><span>or enter a transfer code</span></div><div className="transfer-input"><input value={transferCode} onChange={(event) => setTransferCode(event.target.value)} placeholder="Paste code here"/><button onClick={() => restoreProfile(transferCode)}>Restore</button></div>{profileMessage && <p className="profile-message" role="status">{profileMessage}</p>}<small>Anyone with this private link can use your profile. Share it carefully.</small></div></div>}
    </main>
  );
};

export default BoardView;
