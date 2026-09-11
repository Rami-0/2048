import React, {useEffect, useState} from "react";
import * as ReactDOMClient from 'react-dom/client';
import BoardView from "./components/BoardView";
import LeaderboardPage from "./components/LeaderboardPage";
import "./main.scss"
import "./styles.scss"

const App = () => {
	const [highestScore, setHighestScore] = useState(() => Number(localStorage.getItem("highestScore")) || 0)
	const [path, setPath] = useState(window.location.pathname);
	useEffect(() => { const onPopState = () => setPath(window.location.pathname); window.addEventListener("popstate", onPopState); return () => window.removeEventListener("popstate", onPopState); }, []);
	const navigate = (nextPath) => { window.history.pushState({}, "", nextPath); setPath(nextPath); window.scrollTo(0, 0); };
	return path === "/leaderboard" ? <LeaderboardPage navigate={navigate}/> : <BoardView highestScore={highestScore} setHighestScore={setHighestScore} navigate={navigate}/>;
};


const rootElement = document.getElementById("root");
const root = ReactDOMClient.createRoot(rootElement);
root.render(<App/>)
