import React from "react";

const GameOverlay = ({ onRestart, onContinue, onSubmit, board, submitting }) => {
  if (board.hasWon()) {
    return <div className="overlay overlay--win"><p className="overlay__eyebrow">A rare alignment</p><h2>2048.</h2><p>You made it. Keep the board alive, or begin again.</p><div className="overlay__actions"><button onClick={onContinue}>Keep going</button><button className="button--ghost" onClick={onRestart}>New run</button></div></div>;
  }
  if (board.hasLost()) {
    return <div className="overlay overlay--lost"><p className="overlay__eyebrow">The board is full</p><h2>{board.score.toLocaleString()}</h2><p>A good run deserves a place on the board.</p><div className="overlay__actions"><button onClick={onSubmit} disabled={submitting}>{submitting ? "Saving…" : "Save score"}</button><button className="button--ghost" onClick={onRestart}>Try again</button></div></div>;
  }
  return null;
};

export default GameOverlay;
