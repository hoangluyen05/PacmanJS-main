import MovingDirection from './MovingDirection.js';
import Enemy from './Enemy.js';
import Pacman from './Pacman.js';

// Map
export default class TileMap {
    constructor(tileSize) {
        this.tileSize = tileSize; // Kích thước của mỗi ô trong game

        this.yellowDot = new Image(); // Hình ảnh của dot
        this.yellowDot.src = '../images/yellowDot.png';

        this.wall = new Image(); // Hình ảnh của wall
        this.wall.src = '../images/wall.png';

        this.pinkDot = new Image(); // Hình ảnh của power dot
        this.pinkDot.src = '../images/pinkDot.png';

        this.powerDot = this.pinkDot;
        this.powerDotAnimationTimerDefault = 100; // Thời gian chuyển đổi giữa 2 hình ảnh power dot
        this.powerDotAnimationTimer = this.powerDotAnimationTimerDefault; // Thời gian chuyển đổi giữa 2 hình ảnh power dot
    }

    //1 - wall
    //0 - dots
    //4 - pacman
    //5 - empty space
    //6 - enemy
    //7 - power dot
    // Map
    map = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 1],
        [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 0, 4, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1],
        [1, 7, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];

    // Vẽ map
    draw(ctx) {
        for (let row = 0; row < this.map.length; row++) {
            for (let column = 0; column < this.map[row].length; column++) {
                let tile = this.map[row][column];
                if (tile === 1) {
                    this.#drawWall(ctx, column, row, this.tileSize);
                }
                else if (tile === 0) {
                    this.#drawDot(ctx, column, row, this.tileSize);
                }
                else if(tile === 7){
                    this.#drawPowerDot(ctx, column, row, this.tileSize);
                }
                else{
                    this.#drawBlank(ctx, column, row, this.tileSize);
                }
            }
        }
    }

    // Vẽ viên sức mạnh
    #drawPowerDot(ctx, column, row, size){
        this.powerDotAnimationTimer--;
        if(this.powerDotAnimationTimer == 0){
            this.powerDotAnimationTimer = this.powerDotAnimationTimerDefault;
            if(this.powerDot == this.pinkDot){
                this.powerDot = this.yellowDot;
            }else{
                this.powerDot = this.pinkDot;
            }
        }
        ctx.drawImage(this.powerDot, column * this.tileSize, row * this.tileSize, size, size);
    }

    // Vẽ vùng trống
    #drawBlank(ctx, column, row, size){
        ctx.fillStyle = 'black';
        ctx.fillRect(column * this.tileSize, row * this.tileSize, size, size);
    }

    //  Vẽ tường
    #drawWall(ctx, column, row, size) {
        ctx.drawImage(this.wall, column * this.tileSize, row * this.tileSize, size, size);
    }

    // Vẽ thức ăn
    #drawDot(ctx, column, row, size) {
        ctx.drawImage(this.yellowDot, column * this.tileSize, row * this.tileSize, size, size)
    }

    // Đếm số thức ăn còn lại
    #dotLeft(){
        return this.map.flat().filter((tile) => tile == 0).length;
    }

    // Set kích thước canvas
    setCanvasSize(canvas) {
        canvas.width = this.map[0].length * this.tileSize;
        canvas.height = this.map.length * this.tileSize;
    }

    // Lấy vị trí pacman ban đầu
    getPacman(velocity) {
        for (let row = 0; row < this.map.length; row++) {
            for (let column = 0; column < this.map[row].length; column++) {
                let tile = this.map[row][column];
                if (tile === 4) {
                    this.map[row][column] = 0;
                    return new Pacman(column * this.tileSize, row * this.tileSize, this.tileSize, velocity, this);
                }
            }
        }
    }

    // Lấy danh sách ghost
    getEnemies(velocity) {
        const enimes = [];

        for(let row=0; row<this.map.length; row++){
            for(let column=0; column < this.map[row].length; column++){
                const tile = this.map[row][column];
                if(tile === 6){
                    this.map[row][column] = 0;
                    enimes.push(new Enemy(column * this.tileSize, row * this.tileSize, this.tileSize, velocity, this));
                }
            }
        }

        return enimes;
    }

    // Ăn thức ăn
    eatDot(x, y){
        const row = y/this.tileSize;
        const column = x/this.tileSize;
        if(Number.isInteger(row) && Number.isInteger(column)){
            if(this.map[row][column] == 0){
                this.map[row][column] = 5;
                return true;
            }
        }
        return false;
    }

    // Ăn viên sức mạnh
    eatPowerDot(x, y){
        const row = y/this.tileSize;
        const column = x/this.tileSize;
        if(Number.isInteger(row) && Number.isInteger(column)){
            if(this.map[row][column] == 7){
                this.map[row][column] = 5;
                return true;
            }
        }
        return false;
    }

    // Kiểm tra va chạm với môi trường
    didCollideWithEnviroment(x, y, direction) {

        if(direction == null){
            return;
        }

        if (Number.isInteger(x / this.tileSize) && Number.isInteger(y / this.tileSize)) {
            let row = 0
            let column = 0;
            let nextRow = 0;
            let nextColumn = 0;

            switch (direction) {
                case MovingDirection.right:
                    nextColumn = x + this.tileSize;
                    column = nextColumn / this.tileSize;
                    row = y / this.tileSize;
                    break;
                case MovingDirection.left:
                    nextColumn = x - this.tileSize;
                    column = nextColumn / this.tileSize;
                    row = y / this.tileSize;
                    break;
                case MovingDirection.up:
                    nextRow = y - this.tileSize;
                    row = nextRow / this.tileSize;
                    column = x / this.tileSize;
                    break;
                case MovingDirection.down:
                    nextRow = y + this.tileSize;
                    row = nextRow / this.tileSize;
                    column = x / this.tileSize;
                    break;
            }

            const tile = this.map[row][column];
            if(tile === 1){
                return true;
            }
            return false;
        }
    }

    // Kiểm tra game over
    didGameWin(){
        return this.#dotLeft() == 0;
    }
    
    
}