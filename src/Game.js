import TileMap from "./TileMap.js"; // Lấy cấu trúc bản đồ
import { 
    setHeuristic, 
    HeuristicType, 
    currentHeuristic,
    lastStats
} from "./Astar.js"; // Lấy các hàm và biến từ Astar.js 

const tileSize = 32; // Kích thước ô
const velocity = 2; // Tốc độ di chuyển

const canvas = document.getElementById("gameCanvas"); // Lấy canvas
const ctx = canvas.getContext("2d"); // Lấy context 2D

let tileMap = new TileMap(tileSize); // Tạo bản đồ
let pacman = tileMap.getPacman(velocity); // Lấy pacman
let enemies = tileMap.getEnemies(velocity); // Lấy con ma

let gameOver = false; // Trạng thái game over
let gameWin = false; // Trạng thái game win
let gamePause = false; // Trạng thái game pause

const gameOverSound = new Audio("../sounds/gameOver.wav"); // Âm thanh game over
const gameWinSound = new Audio("../sounds/gameWin.wav"); // Âm thanh game win

// ================= UI HEURISTIC =================
const btnManhattan = document.getElementById("btn-manhattan"); // Nút chuyển sang heuristic Manhattan
const btnBFS = document.getElementById("btn-bfs"); // Nút chuyển sang heuristic BFS
const btnWeighted = document.getElementById("btn-weighted"); // Nút chuyển sang heuristic Weighted
const modeText = document.getElementById("mode"); // Text hiển thị mode hiện tại
const statsText = document.getElementById("stats"); // Text hiển thị thống kê

// 👉 chuyển heuristic + reset
if (btnManhattan) { // Nút chuyển sang heuristic Manhattan
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
        `Nodes: ${lastStats.nodesVisited} | ` +
        `Path: ${lastStats.pathLength} | ` +
        `Time: ${lastStats.time} ms`;
}

// ================= GAME LOOP =================
function gameLoop() { // Vòng lặp game
    tileMap.draw(ctx); // Vẽ bản đồ
    drawGameEnd(); // Vẽ kết thúc game

    pacman.draw(ctx, pause(), enemies); // Vẽ pacman

    enemies.forEach((enemy) => {
        enemy.draw(ctx, pause(), pacman); // Vẽ kẻ địch
    });

    checkGameOver(); // Kiểm tra game over
    checkGameWin();

    // 🔥 cập nhật stats realtime
    updateStatsUI();
}

// ================= CLICK RESET =================
canvas.addEventListener("click", () => { // Xử lý sự kiện click trên canvas
    if (gameOver || gameWin) {
        resetGame();
    }
});

// ================= PAUSE BUTTON =================
const buttonPauseGame = document.getElementById("pause-game"); // Nút tạm dừng game

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
function drawGameEnd() { // Vẽ kết thúc game
    if (gameOver || gameWin) {
        let text = "You Win!";
        if (gameOver) text = "Game Over!";

        ctx.fillStyle = "black"; // Màu nền
        ctx.fillRect(0, canvas.height / 3.2, canvas.width, 80); // Hình chữ nhật nền

        ctx.font = "80px comic sans"; // Font chữ

        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0); // Tạo gradient
        gradient.addColorStop("0", "magenta"); // Màu bắt đầu
        gradient.addColorStop("0.5", "blue"); // Màu giữa
        gradient.addColorStop("1.0", "red"); // Màu kết thúc

        ctx.fillStyle = gradient; // Áp dụng gradient
        ctx.fillText(text, 10, canvas.height / 2); // Vẽ chữ
    }
}

// ================= RESET =================
function resetGame() { // Đặt lại game
    tileMap = new TileMap(tileSize); // Tạo lại bản đồ
    pacman = tileMap.getPacman(velocity); // Tạo lại pacman
    enemies = tileMap.getEnemies(velocity); // Tạo lại kẻ địch

    gameOver = false;
    gameWin = false;
}

// ================= GAME STATE =================
function checkGameWin() { // Kiểm tra game win
    if (!gameWin) {
        gameWin = tileMap.didGameWin(); // Kiểm tra điều kiện thắng
        if (gameWin) gameWinSound.play(); // Phát âm thanh thắng
    }
}

function checkGameOver() {
    if (!gameOver) {
        gameOver = isGameOver();
        if (gameOver) gameOverSound.play();
    }
}

function isGameOver() { // Kiểm tra game over
    return enemies.some((enemy) => { // Kiểm tra từng kẻ địch
        return !pacman.powerDotActive && enemy.collideWith(pacman); // Kiểm tra va chạm
    });
}

function pause() {
    return !pacman.madeFirstMove || gameOver || gameWin || gamePause; // Kiểm tra tạm dừng
}

// ================= INIT =================
tileMap.setCanvasSize(canvas); // Đặt kích thước canvas cho bản đồ

// 👉 hiển thị ban đầu
updateModeUI();
updateStatsUI();

// ================= LOOP =================
setInterval(gameLoop, 15);