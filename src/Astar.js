import MovingDirection from "./MovingDirection.js";

// ================== HEURISTIC CONFIG ==================
export const HeuristicType = { // Các loại heuristic
    MANHATTAN: 0,
    BFS: 1,
    WEIGHTED_MANHATTAN: 2
};

export let currentHeuristic = HeuristicType.MANHATTAN; // Mặc định là Manhattan

export function setHeuristic(type) {
    currentHeuristic = type; // Cập nhật heuristic hiện tại
}

// ================== STATS ==================
export let lastStats = { // Thống kê của lần chạy trước
    nodesVisited: 0,
    pathLength: 0,
    time: 0
};

export let totalStats = { // Thống kê tổng
    nodesVisited: 0,
    pathLength: 0,
    time: 0
};


// reset toàn bộ thống kê
export function resetTotalStats() {
    totalStats.nodesVisited = 0;
    totalStats.pathLength = 0;
    totalStats.time = 0;
}
// ================== NODE ==================
class Node {
    constructor(x, y, parent = null) {
        this.x = x;
        this.y = y;
        this.parent = parent;
        this.f = 0;
        this.g = 0;
        this.h = 0;
    }

    calculateF() {
        this.f = this.g + this.h;
    }
}

// ================== CHECK ==================
function isValid(x, y, grid) {
    return x >= 0 && x < grid.length && // Kiểm tra giới hạn hàng
        y >= 0 && y < grid[0].length && // Kiểm tra giới hạn cột
        grid[x][y] !== 1; // Kiểm tra ô không phải là tường
}

function isDestination(x, y, dest) { // Kiểm tra xem có phải là đích không
    return x === dest.x && y === dest.y;
}

// ================== HEURISTIC FUNCTIONS ==================
function hManhattan(x, y, dest) {
    return Math.abs(x - dest.x) + Math.abs(y - dest.y);
}

function hWeighted(x, y, dest, weight = 3) {
    return weight * (Math.abs(x - dest.x) + Math.abs(y - dest.y));
}

function hBFS(x, y, distanceMap) {
    return distanceMap[x][y];
}

// ================== MIN HEAP ==================
class MinHeap {  
    constructor() {
        this.heap = [];
        this.positionMap = new Map(); // key: "x,y" -> index in heap
    }

    getKey(node) {
        return `${node.x},${node.y}`; // Tạo khóa duy nhất cho mỗi node
    }

    swap(i, j) {
        [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]]; // Hoán đổi vị trí
        this.positionMap.set(this.getKey(this.heap[i]), i); // Cập nhật vị trí của node sau khi hoán đổi
        this.positionMap.set(this.getKey(this.heap[j]), j); // Cập nhật vị trí của node sau khi hoán đổi
    }

    // Tie-breaking: ưu tiên node có g cao hơn (gần đích hơn) khi f bằng nhau
    isBetter(childIdx, parentIdx) {
        const child = this.heap[childIdx]; // Node con
        const parent = this.heap[parentIdx]; // Node cha
        if (child.f !== parent.f) return child.f < parent.f;
        return child.g > parent.g; // tie-break: prefer larger g
    }

    bubbleUp(index) { // Đẩy phần tử lên
        while (index > 0) {
            const parent = Math.floor((index - 1) / 2); // Tính chỉ số cha
            if (!this.isBetter(index, parent)) break; // Nếu không tốt hơn thì dừng
            this.swap(parent, index);
            index = parent;
        }
    }

    bubbleDown(index) { // Đẩy phần tử xuống
        const length = this.heap.length;
        while (true) {
            let best = index;
            const left = 2 * index + 1;
            const right = 2 * index + 2;

            if (left < length && this.isBetter(left, best)) best = left;
            if (right < length && this.isBetter(right, best)) best = right;

            if (best === index) break;
            this.swap(index, best);
            index = best;
        }
    }

    insert(node) { // Chèn node vào heap
        this.heap.push(node);
        const index = this.heap.length - 1;
        this.positionMap.set(this.getKey(node), index); // Cập nhật vị trí của node sau khi chèn
        this.bubbleUp(index);
    }

    extractMin() { // Lấy phần tử nhỏ nhất ra khỏi heap
        if (this.heap.length === 0) return null;

        const root = this.heap[0];
        const last = this.heap.pop(); // Lấy phần tử cuối cùng
        this.positionMap.delete(this.getKey(root)); // Xóa vị trí của node gốc

        if (this.heap.length > 0) {
            this.heap[0] = last; // Đưa phần tử cuối cùng lên vị trí gốc
            this.positionMap.set(this.getKey(last), 0); // Cập nhật vị trí của node sau khi đưa lên
            this.bubbleDown(0);
        }

        return root;
    }

    isEmpty() {
        return this.heap.length === 0;
    }

    contains(x, y) {
        return this.positionMap.has(`${x},${y}`); // Kiểm tra xem heap có chứa node này không
    }

    getNode(x, y) {
        const idx = this.positionMap.get(`${x},${y}`); // Lấy chỉ số của node trong heap
        return idx !== undefined ? this.heap[idx] : null; // Trả về node nếu tồn tại, ngược lại trả về null
    }

    // Update node nếu đã tồn tại, insert nếu chưa có
    update(node) {
        const key = this.getKey(node);
        if (!this.positionMap.has(key)) {
            this.insert(node);
            return;
        }
        const idx = this.positionMap.get(key);
        this.heap[idx] = node;
        // Chạy cả 2 để đảm bảo heap property đúng sau khi f thay đổi
        this.bubbleUp(idx);
        this.bubbleDown(this.positionMap.get(key)); // idx có thể đã đổi sau bubbleUp
    }
}

// ================== BFS HEURISTIC ==================
function buildDistanceMap(grid, targetX, targetY) {
    const rows = grid.length;
    const cols = grid[0].length;
    const dist = Array.from({ length: rows }, () =>
        Array(cols).fill(Infinity)
    );

    const queue = [];
    queue.push([targetX, targetY]);
    dist[targetX][targetY] = 0;

    const directions = [
        [-1, 0], [1, 0], [0, -1], [0, 1]
    ];

    while (queue.length) {
        const [x, y] = queue.shift();

        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;

            if (isValid(nx, ny, grid)) {
                if (dist[nx][ny] > dist[x][y] + 1) {
                    dist[nx][ny] = dist[x][y] + 1;
                    queue.push([nx, ny]);
                }
            }
        }
    }
    return dist;
}

// ================== A* ==================
function astarSearch(grid, src, dest, distanceMap) {

    let nodesVisited = 0;
    const startTime = performance.now();

    const openList = new MinHeap();
    const closedSet = new Set();
    // compute heuristic for start node so ordering is correct
    if (currentHeuristic === HeuristicType.MANHATTAN) {
        src.h = hManhattan(src.x, src.y, dest);
    } else if (currentHeuristic === HeuristicType.WEIGHTED_MANHATTAN) {
        src.h = hWeighted(src.x, src.y, dest);
    } else if (distanceMap) {
        src.h = hBFS(src.x, src.y, distanceMap);
    }
    src.calculateF();
    openList.insert(src); // Chèn node bắt đầu vào openList

    const directions = [
        [-1, 0], [1, 0], [0, -1], [0, 1]
    ];

    while (!openList.isEmpty()) { 
        const currentNode = openList.extractMin();
        const key = `${currentNode.x},${currentNode.y}`;

        if (closedSet.has(key)) continue;
        closedSet.add(key);
        nodesVisited++;

        if (isDestination(currentNode.x, currentNode.y, dest)) {
            const path = [];
            let cur = currentNode;
            while (cur !== null) {
                path.push({ x: cur.x, y: cur.y });
                cur = cur.parent;
            }

            const elapsedTime = Number((performance.now() - startTime).toFixed(3)); // Tính thời gian đã trôi qua

            lastStats.nodesVisited = nodesVisited;
            lastStats.pathLength = Math.max(0, path.length-1);
            lastStats.time = elapsedTime;

            // cộng dồn toàn bộ quá trình
            totalStats.nodesVisited += nodesVisited;
            totalStats.pathLength += Math.max(0, path.length-1);
            totalStats.time += elapsedTime;

            return path.reverse();
        }

        for (const [dx, dy] of directions) {
            const newX = currentNode.x + dx;
            const newY = currentNode.y + dy;
            const neighborKey = `${newX},${newY}`;

            if (!isValid(newX, newY, grid) || closedSet.has(neighborKey)) continue;

            const newNode = new Node(newX, newY, currentNode); 
            newNode.g = currentNode.g + 1;

            if (currentHeuristic === HeuristicType.MANHATTAN) {
                newNode.h = hManhattan(newX, newY, dest);
            } else if (currentHeuristic === HeuristicType.WEIGHTED_MANHATTAN) {
                newNode.h = hWeighted(newX, newY, dest);
            } else {
                newNode.h = hBFS(newX, newY, distanceMap);
            }

            newNode.calculateF();

            const existing = openList.getNode(newX, newY); // Lấy node nếu đã tồn tại trong openList
            if (!existing || newNode.g < existing.g) { // Nếu không tồn tại hoặc cost mới thấp hơn cost cũ
                openList.update(newNode); // Cập nhật node trong openList
            }
        }
    }

    // Không tìm được đường
    const elapsedTime = Number((performance.now() - startTime).toFixed(3));

    lastStats.nodesVisited = nodesVisited;
    lastStats.pathLength = 0;
    lastStats.time = elapsedTime;

    // cộng dồn
    totalStats.nodesVisited += nodesVisited;
    totalStats.time += elapsedTime;

    return null;
}


// ================== MAIN ==================
export default function nextStepAstar(xStart, yStart, xEnd, yEnd, grid) { // Hàm chính để tìm đường đi

    const src = new Node(xStart, yStart); 
    const dest = new Node(xEnd, yEnd);

    let distanceMap = null; // Bản đồ khoảng cách

    if (currentHeuristic === HeuristicType.BFS) { // Nếu sử dụng BFS
        distanceMap = buildDistanceMap(grid, xEnd, yEnd); // Tạo bản đồ khoảng cách cho BFS
    }

    const path = astarSearch(grid, src, dest, distanceMap); // Tìm đường đi

    if (!path || path.length < 2) return null; // Không tìm thấy đường đi hợp lệ

    const tile = path[1]; // Lấy ô tiếp theo trong đường đi

    if (tile.x - xStart === 1) return MovingDirection.down; // Di chuyển xuống
    if (tile.x - xStart === -1) return MovingDirection.up; // Di chuyển lên
    if (tile.y - yStart === 1) return MovingDirection.right; // Di chuyển sang phải
    if (tile.y - yStart === -1) return MovingDirection.left; // Di chuyển sang trái

    return null;
}