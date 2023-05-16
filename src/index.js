import React, {useState , useEffect} from "react";
import * as ReactDOMClient from 'react-dom/client';
import BoardView from "./components/BoardView";
import "./main.scss"
import "./styles.scss"

const App = () => {
	const [highestScore, setHighestScore] = useState(JSON.parse(localStorage.getItem("highestScore")))
	
	return <BoardView highestScore={highestScore} setHighestScore={setHighestScore}/>;
};


const rootElement = document.getElementById("root");
const root = ReactDOMClient.createRoot(rootElement);
root.render(<App/>)
