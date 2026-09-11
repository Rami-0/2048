import React from "react";

const GameOverlay = ({ board, onRestart, onContinue, onLeaderboard, saveStatus, onRetry }) => {
  if (board.hasWon()) {
    return <div className="game-overlay win-overlay"><div className="result-copy"><span>STEP 3 · 2048!</span><strong>You made it.</strong><button onClick={onContinue}>Keep going</button></div></div>;
  }
  if (board.hasLost()) {
    return (
      <div className="game-overlay lost-overlay">
        <div className="result-copy">
          <span>STEP 3 · RUN COMPLETE</span>
          <strong>{board.score.toLocaleString()}</strong>
          <p className={`save-state save-state--${saveStatus}`}>
            {saveStatus === "saving" && "Saving score…"}
            {saveStatus === "saved" && "✓ Score saved automatically"}
            {saveStatus === "error" && <>Couldn’t save. <button onClick={onRetry}>Retry</button></>}
          </p>
          <div className="result-actions"><button onClick={onRestart}>Play again</button><button onClick={onLeaderboard}>Leaderboard</button></div>
        </div>
      </div>
    );
  }
  return null;
};

export default GameOverlay;
