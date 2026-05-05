import MovingDirection from "./MovingDirection.js";

// ================== HEURISTIC CONFIG ==================
export const HeuristicType = {
    MANHATTAN: 0,
    BFS: 1,
    WEIGHTED_MANHATTAN: 2
};

export let currentHeuristic = HeuristicType.MANHATTAN;

export function setHeuristic(type){
    currentHeuristic = type;
}

// ================== STATS ==================
export let lastStats = {
    nodesVisited: 0,
    pathLength: 0,
    time: 0
};

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
    return x >= 0 && x < grid.length &&
           y >= 0 && y < grid[0].length &&
           grid[x][y] !== 1;
}

function isDestination(x, y, dest) {
    return x === dest.x && y === dest.y;
}

// ================== HEURISTIC FUNCTIONS ==================
function hManhattan(x, y, dest) {
    return Math.abs(x - dest.x) + Math.abs(y - dest.y);
}

function hWeighted(x, y, dest, weight = 1.5) {
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
        return `${node.x},${node.y}`;
    }

    swap(i, j) {
        [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
        this.positionMap.set(this.getKey(this.heap[i]), i);
        this.positionMap.set(this.getKey(this.heap[j]), j);
    }

    // Tie-breaking: ưu tiên node có g cao hơn (gần đích hơn) khi f bằng nhau
    isBetter(childIdx, parentIdx) {
        const child  = this.heap[childIdx];
        const parent = this.heap[parentIdx];
        if (child.f !== parent.f) return child.f < parent.f;
        return child.g > parent.g; // tie-break: prefer larger g
    }

    bubbleUp(index) {
        while (index > 0) {
            const parent = Math.floor((index - 1) / 2);
            if (!this.isBetter(index, parent)) break;
            this.swap(parent, index);
            index = parent;
        }
    }

    bubbleDown(index) {
        const length = this.heap.length;
        while (true) {
            let best  = index;
            const left  = 2 * index + 1;
            const right = 2 * index + 2;

            if (left  < length && this.isBetter(left,  best)) best = left;
            if (right < length && this.isBetter(right, best)) best = right;

            if (best === index) break;
            this.swap(index, best);
            index = best;
        }
    }

    insert(node) {
        this.heap.push(node);
        const index = this.heap.length - 1;
        this.positionMap.set(this.getKey(node), index);
        this.bubbleUp(index);
    }

    extractMin() {
        if (this.heap.length === 0) return null;

        const root = this.heap[0];
        const last = this.heap.pop();
        this.positionMap.delete(this.getKey(root));

        if (this.heap.length > 0) {
            this.heap[0] = last;
            this.positionMap.set(this.getKey(last), 0);
            this.bubbleDown(0);
        }

        return root;
    }

    isEmpty() {
        return this.heap.length === 0;
    }

    contains(x, y) {
        return this.positionMap.has(`${x},${y}`);
    }

    getNode(x, y) {
        const idx = this.positionMap.get(`${x},${y}`);
        return idx !== undefined ? this.heap[idx] : null;
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
        [-1,0],[1,0],[0,-1],[0,1]
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
    openList.insert(src);

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

            lastStats.nodesVisited = nodesVisited;
            lastStats.pathLength   = path.length;
            lastStats.time         = (performance.now() - startTime).toFixed(3);

            return path.reverse();
        }

        for (const [dx, dy] of directions) {
            const newX = currentNode.x + dx;
            const newY = currentNode.y + dy;
            const neighborKey = `${newX},${newY}`;

            if (!isValid(newX, newY, grid) || closedSet.has(neighborKey)) continue;

            const newNode  = new Node(newX, newY, currentNode);
            newNode.g = currentNode.g + 1;

            if (currentHeuristic === HeuristicType.MANHATTAN) {
                newNode.h = hManhattan(newX, newY, dest);
            } else if (currentHeuristic === HeuristicType.WEIGHTED_MANHATTAN) {
                newNode.h = hWeighted(newX, newY, dest);
            } else {
                newNode.h = hBFS(newX, newY, distanceMap);
            }

            newNode.calculateF();

            const existing = openList.getNode(newX, newY);
            if (!existing || newNode.g < existing.g) {
                openList.update(newNode);
            }
        }
    }

    // Không tìm được đường
    lastStats.nodesVisited = nodesVisited;
    lastStats.pathLength = 0;
    lastStats.time = (performance.now() - startTime).toFixed(3);

    return null;
}


// ================== MAIN ==================
export default function nextStepAstar(xStart, yStart, xEnd, yEnd, grid) {

    const src = new Node(xStart, yStart);
    const dest = new Node(xEnd, yEnd);

    let distanceMap = null;

    if (currentHeuristic === HeuristicType.BFS) {
        distanceMap = buildDistanceMap(grid, xEnd, yEnd);
    }

    const path = astarSearch(grid, src, dest, distanceMap);

    if (!path || path.length < 2) return null;

    const tile = path[1];

    if (tile.x - xStart === 1) return MovingDirection.down;
    if (tile.x - xStart === -1) return MovingDirection.up;
    if (tile.y - yStart === 1) return MovingDirection.right;
    if (tile.y - yStart === -1) return MovingDirection.left;

    return null;
}