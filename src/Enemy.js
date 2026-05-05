import MovingDirection from "./MovingDirection.js ";
import nextStepAstar from "./Astar.js";
// Lớp Kẻ địch
export default class Enemy{

    constructor(x, y, tileSize, velocity, tileMap){
        this.x = x; // Vị trí x
        this.y = y; // Vị trí y
        this.tileSize = tileSize; // Kích thước của mỗi ô trong game
        this.velocity = velocity; // Tốc độ di chuyển
        this.tileMap = tileMap; // TileMap

        this.#loadImages(); // Load hình ảnh

        this.movingDirection = Math.floor(Math.random() * Object.keys(MovingDirection).length); // Hướng di chuyển

        
        this.chaseAstarTimerDefault = 80; // Thời gian chạy A* mặc định
        this.chaseAstarTimer = 0; // Thời gian chạy A*

        this.directionTimerDefault = 10; // Thời gian chuyển hướng ngẫu nhiên mặc định
        this.directionTimer = this.directionTimerDefault; // Thời gian chuyển hướng ngẫu nhiên

        this.scaredAboutToExpireTimerDefault = 10; // Thời gian ma hết sợ mặc định
        this.scaredAboutToExpireTimer = this.scaredAboutToExpireTimerDefault; // Thời ma gian hết sợ
    }

    // Vẽ kẻ địch
    draw(ctx, pause, pacman){
        this.#setPacmanPosition(pacman); // Lấy vị trí của pacman
        if(!pause){ // Nếu game không bị tạm dừng
            if(!pacman.powerDotActive){ // Nếu phát hiện pacman và pacman không ăn được ghost
                this.#setDirectionAstar(); // Set hướng di chuyển theo A*
                this.#moveAstar(); // Di chuyển theo A*
            }
            else{
                this.#setDirectionRandom(); // Set hướng di chuyển ngẫu nhiên
                this.#moveRandom(); // Di chuyển ngẫu nhiên
            }
        }
        this.#setImage(ctx, pacman); // Set hình ảnh
    }

    // Kiểm tra va chạm với pacman
    collideWith(pacman){
        /* 
            Điều kiện va chạm giữa pacman và ghost tham khảo ở đường link sau
            https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection
        */
        const size = this.tileSize / 2;
        if(
            this.x < pacman.x + size && 
            this.x + size > pacman.x &&
            this.y < pacman.y + size &&
            this.y + size > pacman.y
        ){
            return true;
        }

        return false;
    }

    // Set hình ảnh
    #setImage(ctx, pacman){
        if(pacman.powerDotActive){ // Nếu pacman ăn được ghost
            this.#setImageWhenPowerDotIsActive(pacman); // Set hình ảnh khi pacman ăn được ghost
        }
        else{
            this.image = this.normalGhost; // Set hình ảnh khi pacman không ăn được ghost
        }
        ctx.drawImage(this.image, this.x, this.y, this.tileSize, this.tileSize); // Vẽ hình ảnh
    }

    // Set hình ảnh khi pacman ăn được ghost
    #setImageWhenPowerDotIsActive(pacman){ // Set hình ảnh khi pacman ăn được ghost
        if(pacman.powerDotAboutToExpire){ // Nếu thời gian ăn được ghost sắp hết
            this.scaredAboutToExpireTimer--; // Giảm thời gian ăn được ghost sắp hết
            if(this.scaredAboutToExpireTimer == 0){ // Nếu thời gian ăn được ghost sắp hết
                this.scaredAboutToExpireTimer = this.scaredAboutToExpireTimerDefault; // Reset thời gian ăn được ghost sắp hết
                if(this.image === this.scaredGhost){ 
                    this.image = this.scaredGhost2;
                }
                else{ 
                    this.image = this.scaredGhost;
                }
            }
        }
        else{
            this.image = this.scaredGhost;
        }
    }

    // Lấy vị trí của pacman
    #setPacmanPosition(pacman){
        this.pacmanX = pacman.x;
        this.pacmanY = pacman.y;
    }

    // Set hướng di chuyển theo A*
    #setDirectionAstar(){
        if(Number.isInteger(this.x/ this.tileSize) && Number.isInteger(this.y/ this.tileSize)){ // Nếu vị trí của ghost là số nguyên
            let pacmanIdX = Math.floor(this.pacmanX/this.tileSize); // Lấy vị trí x của pacman
            let pacmanIdY = Math.floor(this.pacmanY/this.tileSize); // Lấy vị trí y của pacman
            this.movingDirection = nextStepAstar(this.y/ this.tileSize, this.x/ this.tileSize, pacmanIdY, pacmanIdX, this.tileMap.map); // Set hướng di chuyển theo A*
        }
        
    }

    // Set hướng di chuyển ngẫu nhiên
    #setDirectionRandom(){
        this.directionTimer--;
        let newMoveDirection = null;
        if(this.directionTimer > 0){
            this.directionTimer = this.directionTimerDefault;
            newMoveDirection = Math.floor(Math.random() * Object.keys(MovingDirection).length);
        }

        if(newMoveDirection != null && this.movingDirection != newMoveDirection){
            if(Number.isInteger(this.x/ this.tileSize) && Number.isInteger(this.y/ this.tileSize)){
                if(!this.tileMap.didCollideWithEnviroment(this.x, this.y, newMoveDirection)){
                    this.movingDirection = newMoveDirection;
                }
            }
        }
    }

    // Di chuyển theo A*
    #moveAstar(){
        switch(this.movingDirection){
            case MovingDirection.up:
                this.y -= this.velocity;
                break;
            case MovingDirection.down:
                this.y += this.velocity;
                break;
            case MovingDirection.left:
                this.x -= this.velocity;
                break;
            case MovingDirection.right:
                this.x += this.velocity;
                break;
        }
        
    }

    // Di chuyển ngẫu nhiên
    #moveRandom(){
        if(!this.tileMap.didCollideWithEnviroment(this.x, this.y, this.movingDirection)){
            switch(this.movingDirection){
                case MovingDirection.up:
                    this.y -= this.velocity;
                    break;
                case MovingDirection.down:
                    this.y += this.velocity;
                    break;
                case MovingDirection.left:
                    this.x -= this.velocity;
                    break;
                case MovingDirection.right:
                    this.x += this.velocity;
                    break;
            }
        }
    }
    
    // Load hình ảnh
    #loadImages(){
        this.normalGhost = new Image();
        this.normalGhost.src = '../images/ghost.png';

        this.scaredGhost = new Image();
        this.scaredGhost.src = '../images/scaredGhost.png';

        this.scaredGhost2 = new Image();
        this.scaredGhost2.src = '../images/scaredGhost2.png';

        this.image = this.normalGhost;
    }

    // // Phát hiện pacman
    // #detectPacman(){
    //     let indexX = Math.floor(this.x/this.tileSize); // Lấy vị trí x của ghost
    //     let indexY = Math.floor(this.y/this.tileSize); // Lấy vị trí y của ghost
    //     let pacmanIndexX = Math.floor(this.pacmanX/this.tileSize); // Lấy vị trí x của pacman
    //     let pacmanIndexY = Math.floor(this.pacmanY/this.tileSize); // Lấy vị trí y của pacman
    //     if( (indexX == pacmanIndexX && this.#noWallInColumnBetween(indexX, indexY,pacmanIndexY)) || (indexY == pacmanIndexY && this.#noWallInRowBetween(indexY, indexX, pacmanIndexX)) ){
    //         // Nếu ghost và pacman cùng hàng hoặc cùng cột và không có tường giữa
    //         this.chaseAstarTimer = this.chaseAstarTimerDefault; // Set thời gian chạy A*
    //         return true;
    //     }
    //     if(this.chaseAstarTimer > 0){ // Nếu thời gian chạy A* còn lớn hơn 0
    //         this.chaseAstarTimer--; // Giảm thời gian chạy A*
    //         return true;
    //     }
    //     return false;
    // }
    
    // // Kiểm tra cột có tường giữa ghost và pacman không
    // #noWallInColumnBetween(collumnIndex, indexY, pacmanIndexY){

    //     const [start, end] = indexY < pacmanIndexY ? [indexY, pacmanIndexY] : [pacmanIndexY, indexY];

    //     for(let row = start + 1; row < end; row++){
    //         if(this.tileMap.map[row][collumnIndex] == 1){
    //             return false;
    //         }
    //     }
    //     return true;
    // }

    // // Kiểm tra hàng có tường giữa ghost và pacman không
    // #noWallInRowBetween(rowIndex, indexX, pacmanIndexX){
    //     const [start, end] = indexX < pacmanIndexX ? [indexX, pacmanIndexX] : [pacmanIndexX, indexX];
    //     for(let collumn = start + 1; collumn < end; collumn++){
    //         if(this.tileMap.map[rowIndex][collumn] == 1){
    //             return false;
    //         }
    //     }
    //     return true;
    // }
    
}