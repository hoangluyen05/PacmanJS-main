import MovingDirection from "./MovingDirection.js"; //import enum hướng di chuyển để trả kết quả cuối

// ================== HEURISTIC CONFIG ==================
export const HeuristicType = { // định nghĩa 3 loại heuristic
    MANHATTAN: 0,  
    BFS: 1,
    WEIGHTED_MANHATTAN: 2
};

export let currentHeuristic = HeuristicType.MANHATTAN; // mặc định dùng manhattan

export function setHeuristic(type){ // cho phép đổi heuristic runtime
    currentHeuristic = type;
}

// ================== STATS ==================
export let lastStats = { // lưu trữ thông tin thống kê
    nodesVisited: 0, // số lượng node đã thăm
    pathLength: 0,   // độ dài đường đi
    time: 0         // thời gian thực hiện
};

// ================== NODE ==================
class Node {  // đại diện cho một node trong lưới
    constructor(x, y, parent = null) {
        this.x = x; // tọa độ x
        this.y = y; // tọa độ y
        this.parent = parent; // dùng để truy cập ngược đường đi
        this.f = 0; // f=g+h
        this.g = 0; // chi phí từ start đến node
        this.h = 0; // heuristic (ước lượng tới đích)
    }

    calculateF() {
        this.f = this.g + this.h; 
    }
}

// ================== CHECK ==================
function isValid(x, y, grid) { // Kiểm tra tính hợp lệ của tọa độ
    return x >= 0 && x < grid.length && // Kiểm tra tọa độ x
           y >= 0 && y < grid[0].length &&
           grid[x][y] !== 1; // Kiểm tra ô không phải là tường
}

function isDestination(x, y, dest) { // Kiểm tra xem tọa độ có phải là đích không
    return x === dest.x && y === dest.y;
}

// ================== HEURISTIC FUNCTIONS ==================
function hManhattan(x, y, dest) { 
    return Math.abs(x - dest.x) + Math.abs(y - dest.y); // Manhattan distance
}

function hWeighted(x, y, dest, weight = 1.5) {
    return weight * (Math.abs(x - dest.x) + Math.abs(y - dest.y)); // Weighted Manhattan distance
}

function hBFS(x, y, distanceMap) {
    return distanceMap[x][y]; // BFS distance
}

// ================== MIN HEAP ==================
class MinHeap { // MinHeap implementation
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
        if (child.f !== parent.f) return child.f < parent.f; // ưu tiên f nhỏ hơn
        return child.g > parent.g; // nếu f bằng thì ưu tiên g lớn hơn
    }

    bubbleUp(index) { // Đẩy phần tử lên
        while (index > 0) {
            const parent = Math.floor((index - 1) / 2);
            if (!this.isBetter(index, parent)) break; // Nếu không tốt hơn thì dừng
            this.swap(parent, index); // Hoán đổi vị trí
            index = parent; // Cập nhật chỉ số
        }
    }

    bubbleDown(index) { // Đẩy phần tử xuống
        const length = this.heap.length; // Lấy chiều dài của heap
        while (true) {
            let best  = index;
            const left  = 2 * index + 1;
            const right = 2 * index + 2;

            if (left  < length && this.isBetter(left,  best)) best = left; // Nếu con trái tốt hơn thì cập nhật
            if (right < length && this.isBetter(right, best)) best = right; // Nếu con phải tốt hơn thì cập nhật

            if (best === index) break; // Nếu không còn tốt hơn thì dừng
            this.swap(index, best);
            index = best;
        }
    }

    insert(node) { // Chèn một node mới vào heap
        this.heap.push(node); // Thêm node vào cuối heap
        const index = this.heap.length - 1; // Lấy chỉ số của node vừa chèn
        this.positionMap.set(this.getKey(node), index); // Lưu vị trí của node trong map
        this.bubbleUp(index); // Đẩy phần tử lên
    }

    extractMin() { // Lấy phần tử nhỏ nhất
        if (this.heap.length === 0) return null; // Nếu heap rỗng thì trả null

        const root = this.heap[0]; // Lấy phần tử gốc
        const last = this.heap.pop(); // Lấy phần tử cuối
        this.positionMap.delete(this.getKey(root)); // Xóa vị trí của phần tử gốc

        if (this.heap.length > 0) { // Nếu heap không rỗng
            this.heap[0] = last; // Đưa phần tử cuối lên gốc
            this.positionMap.set(this.getKey(last), 0); // Cập nhật vị trí của phần tử cuối
            this.bubbleDown(0); // Đẩy phần tử xuống
        }

        return root; // Trả về phần tử nhỏ nhất
    }

    isEmpty() {
        return this.heap.length === 0; // Kiểm tra xem heap có rỗng không
    }

    contains(x, y) {
        return this.positionMap.has(`${x},${y}`); // Kiểm tra xem heap có chứa node không
    }

    getNode(x, y) {
        const idx = this.positionMap.get(`${x},${y}`); // Lấy chỉ số của node trong heap
        return idx !== undefined ? this.heap[idx] : null; // Trả về node nếu tồn tại
    }

    // Update node nếu đã tồn tại, insert nếu chưa có
    update(node) {
        const key = this.getKey(node); // Lấy key của node
        if (!this.positionMap.has(key)) { // Nếu node chưa tồn tại trong heap
            this.insert(node); // Chèn node mới vào heap
            return;
        }
        const idx = this.positionMap.get(key); // Lấy chỉ số của node trong heap
        this.heap[idx] = node; // Cập nhật node trong heap
        // Chạy cả 2 để đảm bảo heap property đúng sau khi f thay đổi
        this.bubbleUp(idx); // Đẩy phần tử lên
        this.bubbleDown(this.positionMap.get(key)); // idx có thể đã đổi sau bubbleUp
    }
}

// ================== BFS HEURISTIC ==================
function buildDistanceMap(grid, targetX, targetY) { // Xây dựng bản đồ khoảng cách
    const rows = grid.length; // Lấy số hàng của grid
    const cols = grid[0].length; // Lấy số cột của grid

    const dist = Array.from({ length: rows }, () => 
        Array(cols).fill(Infinity) // Khởi tạo bản đồ khoảng cách
    );

    const queue = []; // Khởi tạo hàng đợi
    queue.push([targetX, targetY]); // Thêm tọa độ mục tiêu vào hàng đợi
    dist[targetX][targetY] = 0; // Đặt khoảng cách của mục tiêu là 0

    const directions = [
        [-1,0],[1,0],[0,-1],[0,1] // Các hướng di chuyển
    ];

    while (queue.length) { // Trong khi hàng đợi còn phần tử
        const [x, y] = queue.shift(); // Lấy tọa độ của phần tử đầu tiên trong hàng đợi

        for (const [dx, dy] of directions) { // Duyệt qua các hướng di chuyển
            const nx = x + dx; // Tính toán tọa độ x mới
            const ny = y + dy; // Tính toán tọa độ y mới

            if (isValid(nx, ny, grid)) { // Kiểm tra tính hợp lệ của tọa độ mới
                if (dist[nx][ny] > dist[x][y] + 1) { // Nếu khoảng cách mới ngắn hơn khoảng cách cũ
                    dist[nx][ny] = dist[x][y] + 1; // Cập nhật khoảng cách mới
                    queue.push([nx, ny]); // Thêm tọa độ mới vào hàng đợi
                }
            }
        }
    }

    return dist;
}

// ================== A* ==================
function astarSearch(grid, src, dest, distanceMap) { // Tìm kiếm A*

    let nodesVisited = 0; // Số lượng node đã thăm
    const startTime = performance.now(); // Thời gian bắt đầu

    const openList = new MinHeap(); // Khởi tạo danh sách mở
    const closedSet = new Set(); // Khởi tạo danh sách đóng
    openList.insert(src); // Thêm node bắt đầu vào danh sách mở

    const directions = [
        [-1, 0], [1, 0], [0, -1], [0, 1]
    ];

    while (!openList.isEmpty()) { // Trong khi danh sách mở còn phần tử
        const currentNode = openList.extractMin(); // Lấy node có giá trị f nhỏ nhất
        const key = `${currentNode.x},${currentNode.y}`; // Tạo key cho node hiện tại

        if (closedSet.has(key)) continue; // Nếu node đã được thăm, bỏ qua
        closedSet.add(key); // Thêm node vào danh sách đóng
        nodesVisited++; // Tăng số lượng node đã thăm

        if (isDestination(currentNode.x, currentNode.y, dest)) { // Nếu node hiện tại là đích
            const path = []; // Khởi tạo đường đi
            let cur = currentNode; // Khởi tạo con trỏ cur
            while (cur !== null) { // Duyệt qua các node cha để tạo đường đi
                path.push({ x: cur.x, y: cur.y }); // Thêm tọa độ của node vào đường đi
                cur = cur.parent; // Di chuyển con trỏ cur về node cha
            }

            lastStats.nodesVisited = nodesVisited; // Cập nhật số lượng node đã thăm
            lastStats.pathLength   = path.length; // Cập nhật độ dài đường đi
            lastStats.time         = (performance.now() - startTime).toFixed(3); // Cập nhật thời gian thực hiện

            return path.reverse(); // Trả về đường đi
        }

        for (const [dx, dy] of directions) { // Duyệt qua các hướng di chuyển
            const newX = currentNode.x + dx; // Tính toán tọa độ x mới
            const newY = currentNode.y + dy; // Tính toán tọa độ y mới
            const neighborKey = `${newX},${newY}`; // Tạo key cho node láng giềng

            if (!isValid(newX, newY, grid) || closedSet.has(neighborKey)) continue; // Nếu node không hợp lệ hoặc đã được thăm, bỏ qua

            const newNode  = new Node(newX, newY, currentNode);// Khởi tạo node mới
            newNode.g = currentNode.g + 1; // Cập nhật giá trị g

            if (currentHeuristic === HeuristicType.MANHATTAN) { // Nếu heuristic là Manhattan
                newNode.h = hManhattan(newX, newY, dest); // Tính toán giá trị h cho node mới
            } else if (currentHeuristic === HeuristicType.WEIGHTED_MANHATTAN) {
                newNode.h = hWeighted(newX, newY, dest);
            } else {
                newNode.h = hBFS(newX, newY, distanceMap);
            }

            newNode.calculateF(); // Tính toán giá trị f cho node mới

            const existing = openList.getNode(newX, newY); // Lấy node đã tồn tại trong danh sách mở
            if (!existing || newNode.g < existing.g) { // Nếu node không tồn tại hoặc có giá trị g nhỏ hơn
                openList.update(newNode); // Cập nhật node trong danh sách mở
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
export default function nextStepAstar(xStart, yStart, xEnd, yEnd, grid) { // Hàm chính để tìm đường đi

    const src = new Node(xStart, yStart); // Khởi tạo node nguồn
    const dest = new Node(xEnd, yEnd); // Khởi tạo node đích

    let distanceMap = null; // Khởi tạo bản đồ khoảng cách

    if (currentHeuristic === HeuristicType.BFS) {
        distanceMap = buildDistanceMap(grid, xEnd, yEnd); // Xây dựng bản đồ khoảng cách cho BFS
    }

    const path = astarSearch(grid, src, dest, distanceMap); // Tìm đường đi bằng A*

    if (!path || path.length < 2) return null; // Nếu không tìm thấy đường đi hợp lệ

    const tile = path[1]; // Lấy tile tiếp theo trong đường đi

    if (tile.x - xStart === 1) return MovingDirection.down;
    if (tile.x - xStart === -1) return MovingDirection.up;
    if (tile.y - yStart === 1) return MovingDirection.right;
    if (tile.y - yStart === -1) return MovingDirection.left;

    return null;
}
// 12344