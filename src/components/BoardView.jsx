import React, { useCallback, useEffect, useRef, useState } from "react";
import Tile from "./Tile";
import Cell from "./Cell";
import { Board } from "../helper";
import useEvent from "../hooks/useEvent";
import GameOverlay from "./GameOverlay";
import { countryFlag, getCountries } from "../data/countries";

const directions = { ArrowLeft: 0, a: 0, A: 0, ArrowUp: 1, w: 1, W: 1, ArrowRight: 2, d: 2, D: 2, ArrowDown: 3, s: 3, S: 3 };
const getPlayerId = () => {
  let id = localStorage.getItem("playerId");
  if (!id) { id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`; localStorage.setItem("playerId", id); }
  return id;
};
const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

const BoardView = ({ highestScore, setHighestScore, navigate }) => {
  const [board, setBoard] = useState(() => new Board());
  const [name, setName] = useState(() => localStorage.getItem("playerName") || "");
  const [country, setCountry] = useState(() => localStorage.getItem("playerCountry") || "");
  const [profileOpen, setProfileOpen] = useState(() => !localStorage.getItem("playerName") || !localStorage.getItem("playerCountry"));
  const [transferCode, setTransferCode] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [saveStatus, setSaveStatus] = useState("idle");
  const [elapsed, setElapsed] = useState(0);
  const [startedAt, setStartedAt] = useState(null);
  const touchStart = useRef(null);
  const countries = useRef(getCountries()).current;

  const saveScore = useCallback(async (score) => {
    if (!name.trim() || !country) return false;
    setSaveStatus("saving");
    try {
      const response = await fetch("/api/leaderboard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ playerId: getPlayerId(), name: name.trim(), country, score }) });
      if (!response.ok) throw new Error();
      setSaveStatus("saved");
      return true;
    } catch (_) { setSaveStatus("error"); return false; }
  }, [name, country]);

  const restoreProfile = useCallback(async (code) => {
    const playerId = String(code || "").trim();
    if (!/^[a-zA-Z0-9-]{8,64}$/.test(playerId)) { setProfileMessage("That code is not valid."); return; }
    setProfileMessage("Restoring profile…");
    try {
      const response = await fetch(`/api/profile?id=${encodeURIComponent(playerId)}`);
      if (!response.ok) throw new Error();
      const { profile } = await response.json();
      localStorage.setItem("playerId", playerId); localStorage.setItem("playerName", profile.name); localStorage.setItem("playerCountry", profile.country); localStorage.setItem("highestScore", String(profile.score));
      setName(profile.name); setCountry(profile.country); setHighestScore(profile.score); setProfileMessage("Profile restored.");
    } catch (_) { setProfileMessage("Profile not found."); }
  }, [setHighestScore]);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("profile");
    if (code) { setProfileOpen(true); setTransferCode(code); restoreProfile(code); window.history.replaceState({}, "", "/"); }
  }, [restoreProfile]);
  useEffect(() => {
    if (!startedAt || board.hasLost()) return;
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    tick(); const timer = window.setInterval(tick, 1000); return () => window.clearInterval(timer);
  }, [startedAt, board]);
  useEffect(() => {
    if (board.score > highestScore) { setHighestScore(board.score); localStorage.setItem("highestScore", String(board.score)); }
    if (board.score < 4 || !name || !country) return;
    const timer = window.setTimeout(() => saveScore(board.score), board.hasLost() ? 0 : 1200);
    return () => window.clearTimeout(timer);
  }, [board.score, board, highestScore, setHighestScore, name, country, saveScore]);

  const move = useCallback((direction) => {
    if (profileOpen) return;
    if (!startedAt) setStartedAt(Date.now());
    setBoard((current) => {
      if (current.hasWon() || current.hasLost()) return current;
      const clone = Object.assign(Object.create(Object.getPrototypeOf(current)), current);
      return clone.move(direction);
    });
  }, [profileOpen, startedAt]);
  const handleKeyDown = useCallback((event) => { if (directions[event.key] !== undefined) { event.preventDefault(); move(directions[event.key]); } }, [move]);
  useEvent("keydown", handleKeyDown);

  const handleTouchStart = (event) => { const touch = event.touches[0]; touchStart.current = { x: touch.clientX, y: touch.clientY }; };
  const handleTouchEnd = (event) => { if (!touchStart.current) return; const touch = event.changedTouches[0]; const dx = touch.clientX - touchStart.current.x; const dy = touch.clientY - touchStart.current.y; touchStart.current = null; if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return; move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 0) : (dy > 0 ? 3 : 1)); };

  const saveProfile = async () => {
    if (!name.trim() || !country) return;
    localStorage.setItem("playerName", name.trim()); localStorage.setItem("playerCountry", country);
    const saved = await saveScore(highestScore);
    if (saved) { setProfileOpen(false); setProfileMessage(""); }
  };
  const copyProfile = async () => {
    const id = getPlayerId(); const link = `${window.location.origin}/?profile=${encodeURIComponent(id)}`;
    try { await navigator.clipboard.writeText(link); setProfileMessage("Transfer link copied."); } catch (_) { setTransferCode(id); setProfileMessage("Copy the code below."); }
  };
  const resetGame = () => { setBoard(new Board()); setElapsed(0); setStartedAt(null); setSaveStatus("idle"); };
  const continueGame = () => setBoard((current) => { const clone = Object.assign(Object.create(Object.getPrototypeOf(current)), current); return clone.continueGame(); });

  return (
    <main className="arcade-shell">
      <header className="game-header"><div className="brand"><span>2048</span><small>JOIN THE NUMBERS</small></div><div className="header-actions"><button onClick={() => navigate("/leaderboard")}>Leaderboard</button><button onClick={() => setProfileOpen(true)}>{country && countryFlag(country)} {name || "Profile"}</button></div></header>
      <nav className="steps" aria-label="Game progress"><span className={!name || !country ? "active" : "done"}>01 Profile</span><span className={name && country && !board.hasLost() && !board.hasWon() ? "active" : ""}>02 Play</span><span className={board.hasLost() || board.hasWon() ? "active" : ""}>03 Result</span></nav>
      <section className="game-stage">
        <div className="hud"><button onClick={resetGame}>New game</button><div><span>Score<strong>{board.score.toLocaleString()}</strong></span><span>Best<strong>{highestScore.toLocaleString()}</strong></span><span>Time<strong>{formatTime(elapsed)}</strong></span></div></div>
        <div className="board" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} aria-label="2048 game board">
          {board.cells.map((row, rowIndex) => <div key={rowIndex}>{row.map((_, colIndex) => <Cell key={`${rowIndex}-${colIndex}`} />)}</div>)}
          {board.tiles.filter((tile) => tile.value !== 0).map((tile) => <Tile tile={tile} key={tile.id} />)}
          <GameOverlay board={board} onRestart={resetGame} onContinue={continueGame} onLeaderboard={() => navigate("/leaderboard")} saveStatus={saveStatus} onRetry={() => saveScore(board.score)} />
        </div>
        <p className="controls-hint">Arrow keys / WASD · Swipe on mobile</p>
      </section>
      {profileOpen && <div className="profile-overlay"><section className="profile-card"><button className="close-profile" onClick={() => name && country && setProfileOpen(false)} aria-label="Close">×</button><span className="step-label">STEP 1 OF 3</span><h1>{localStorage.getItem("playerId") ? "Your profile" : "Create a profile"}</h1><p>Choose a name and country. Your best score saves automatically.</p><label>Name<input maxLength="18" value={name} onChange={(event) => setName(event.target.value)} placeholder="Player name" /></label><label>Country<select value={country} onChange={(event) => setCountry(event.target.value)}><option value="">Choose country</option>{countries.map((item) => <option key={item.code} value={item.code}>{item.flag} {item.name}</option>)}</select></label><button className="primary-action" onClick={saveProfile} disabled={!name.trim() || !country || saveStatus === "saving"}>{saveStatus === "saving" ? "Saving…" : "Save & play"}</button>{localStorage.getItem("playerId") && <button className="secondary-action" onClick={copyProfile}>Copy profile transfer link</button>}<div className="restore-row"><input value={transferCode} onChange={(event) => setTransferCode(event.target.value)} placeholder="Transfer code"/><button onClick={() => restoreProfile(transferCode)}>Restore</button></div>{profileMessage && <p className="profile-message">{profileMessage}</p>}</section></div>}
    </main>
  );
};

export default BoardView;
