import React from "react";
import tryAgainLogo from "../assets/img/try-again.gif";
const GameOverlay = ({ onRestart, board }) => {
	if (board.hasWon()) {
		return <div className="tile2048"></div>;
	} else if (board.hasLost()) {
		return (
			<div className="gameOver">
				<img
					src={tryAgainLogo}
					alt="tryAgain"
					onClick={onRestart}
					style={{
						width: "100%",
						height: "100%",
						cursor: "pointer",
					}}
				/>
			</div>
		);
	}
	return null;
};

export default GameOverlay;
