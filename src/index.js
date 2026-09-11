import React, {useState} from "react";
import * as ReactDOMClient from 'react-dom/client';
import BoardView from "./components/BoardView";
import "./main.scss"
import "./styles.scss"

const App = () => {
	const [highestScore, setHighestScore] = useState(() => Number(localStorage.getItem("highestScore")) || 0)
	
	return <BoardView highestScore={highestScore} setHighestScore={setHighestScore}/>;
};


const rootElement = document.getElementById("root");
const root = ReactDOMClient.createRoot(rootElement);
root.render(<App/>)
