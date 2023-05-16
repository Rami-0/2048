import React, { useState } from "react";
import Tile from "./Tile";
import Cell from "./Cell";
import { Board } from "../helper";
import useEvent from "../hooks/useEvent";
import useEventUpdate from "../hooks/useEventUpdate";
import GameOverlay from "./GameOverlay";

const BoardView = ({ highestScore, setHighestScore }) => {
	const [board, setBoard] = useState(new Board());
	
	if (board.score > highestScore) {
		setHighestScore(board.score);
		localStorage.setItem('highestScore', highestScore)
	}

	const handelKeyDown = (event) => {
		if (board.hasWon()) {
			return;
		}
		if (event.keyCode >= 37 && event.keyCode <= 40) {
			let direction = event.keyCode - 37;
			let boardClone = Object.assign(
				Object.create(Object.getPrototypeOf(board)),
				board
			);
			let newBoard = boardClone.move(direction);
			setBoard(newBoard);
		}
	};
	useEvent("keydown", handelKeyDown);

	const cells = board.cells.map((row, rowIndex) => {
		return (
			<div key={rowIndex}>
				{row.map((col, colIndex) => {
					return <Cell key={rowIndex * board.size + colIndex} />;
				})}
			</div>
		);
	});

	const tiles = board.tiles
		.filter((tile) => tile.value !== 0)
		.map((tile, index) => {
			return <Tile tile={tile} key={index} />;
		});

	const resetGame = () => {
		setBoard(new Board());
	};


	

	return (
		<div>
			<div className="details-box">
				<div className="resetButton" onClick={resetGame}>
					New game
				</div>
				<div className="score-box">
					<div>
						<div className="score-header">SCORE</div>
						<div>{board.score}</div>
					</div>
					<div>
						<div className="score-header">Highiest Score</div>
						<div>{highestScore}</div>
					</div>
				</div>
			</div>
			<div className="board">
				{cells}
				{tiles}
				<GameOverlay onRestart={resetGame} board={board} />
			</div>
		</div>
	);
};

export default BoardView;
