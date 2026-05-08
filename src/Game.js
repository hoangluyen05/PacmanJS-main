import TileMap from "./TileMap.js";
import { 
    setHeuristic, 
    HeuristicType, 
    currentHeuristic,
    lastStats,
    totalStats,
    resetTotalStats
} from "./Astar.js";

const tileSize = 32;
const velocity = 2;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let tileMap = new TileMap(tileSize);
let pacman = tileMap.getPacman(velocity);
let enemies = tileMap.getEnemies(velocity);

let gameOver = false;
let gameWin = false;
let gamePause = false;

const gameOverSound = new Audio("../sounds/gameOver.wav");
const gameWinSound = new Audio("../sounds/gameWin.wav");

// ================= UI HEURISTIC =================
const btnManhattan = document.getElementById("btn-manhattan");
const btnBFS = document.getElementById("btn-bfs");
const btnWeighted = document.getElementById("btn-weighted");
const modeText = document.getElementById("mode");
const statsText = document.getElementById("stats");

// 👉 chuyển heuristic + reset
if (btnManhattan) {
    btnManhattan.onclick = () => {
        setHeuristic(HeuristicType.MANHATTAN);
        resetGame();
        updateModeUI();
    };
}

if (btnBFS) {
    btnBFS.onclick = () => {
        setHeuristic(HeuristicType.BFS);
        resetGame();
        updateModeUI();
    };
}

if (btnWeighted) {
    btnWeighted.onclick = () => {
        setHeuristic(HeuristicType.WEIGHTED_MANHATTAN);
        resetGame();
        updateModeUI();
    };
}

// 👉 hiển thị mode
function updateModeUI() {
    if (!modeText) return;

    const text =
        currentHeuristic === HeuristicType.MANHATTAN        ? "MANHATTAN" :
        currentHeuristic === HeuristicType.WEIGHTED_MANHATTAN ? "WEIGHTED MANHATTAN" :
        "BFS";

    modeText.innerText = "Mode: " + text;
}

// 👉 hiển thị thống kê
function updateStatsUI() {
    if (!statsText) return;

    statsText.innerText =
        `Nodes: ${totalStats.nodesVisited} | ` +
        `Path: ${totalStats.pathLength} | ` +
        `Time: ${totalStats.time.toFixed(3)} ms`;
}

// ================= GAME LOOP =================
function gameLoop() {
    tileMap.draw(ctx);
    drawGameEnd();

    pacman.draw(ctx, pause(), enemies);

    enemies.forEach((enemy) => {
        enemy.draw(ctx, pause(), pacman);
    });

    checkGameOver();
    checkGameWin();

    // 🔥 cập nhật stats realtime
    updateStatsUI();
}

// ================= CLICK RESET =================
canvas.addEventListener("click", () => {
    if (gameOver || gameWin) {
        resetGame();
    }
});

// ================= PAUSE BUTTON =================
const buttonPauseGame = document.getElementById("pause-game");

buttonPauseGame.addEventListener("click", () => {
    if (gamePause) {
        buttonPauseGame.innerHTML = "Pause";
        gamePause = false;
    } else {
        buttonPauseGame.innerHTML = "Resume";
        gamePause = true;
    }
});

// ================= DRAW END =================
function drawGameEnd() {
    if (gameOver || gameWin) {
        let text = "You Win!";
        if (gameOver) text = "Game Over!";

        ctx.fillStyle = "black";
        ctx.fillRect(0, canvas.height / 3.2, canvas.width, 80);

        ctx.font = "80px comic sans";

        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop("0", "magenta");
        gradient.addColorStop("0.5", "blue");
        gradient.addColorStop("1.0", "red");

        ctx.fillStyle = gradient;
        ctx.fillText(text, 10, canvas.height / 2);
    }
}

// ================= RESET =================
function resetGame() {
     // reset thống kê tổng
    resetTotalStats();
    
    tileMap = new TileMap(tileSize);
    pacman = tileMap.getPacman(velocity);
    enemies = tileMap.getEnemies(velocity);

    gameOver = false;
    gameWin = false;
}

// ================= GAME STATE =================
function checkGameWin() {
    if (!gameWin) {
        gameWin = tileMap.didGameWin();
        if (gameWin) gameWinSound.play();
    }
}

function checkGameOver() {
    if (!gameOver) {
        gameOver = isGameOver();
        if (gameOver) gameOverSound.play();
    }
}

function isGameOver() {
    return enemies.some((enemy) => {
        return !pacman.powerDotActive && enemy.collideWith(pacman);
    });
}

function pause() {
    return !pacman.madeFirstMove || gameOver || gameWin || gamePause;
}

// ================= INIT =================
tileMap.setCanvasSize(canvas);

// 👉 hiển thị ban đầu
updateModeUI();
updateStatsUI();

// ================= LOOP =================
setInterval(gameLoop, 15);