import MovingDirection from "./MovingDirection.js ";
import nextStepAstar from "./Astar.js";
// Lớp Kẻ địch
export default class Enemy{


    // thêm thuộc tính
    constructor(x, y, tileSize, velocity, tileMap, heuristic = null){
        this.x = x; // Vị trí x
        this.y = y; // Vị trí y
        this.tileSize = tileSize; // Kích thước của mỗi ô trong game
        this.velocity = velocity; // Tốc độ di chuyển
        this.tileMap = tileMap; // TileMap

        this.heuristic = heuristic; 

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
            this.movingDirection = nextStepAstar(this.y/ this.tileSize, this.x/ this.tileSize, pacmanIdY, pacmanIdX, this.tileMap.map, this.heuristic); // Set hướng di chuyển theo A*
        }
        
    }

    // Set hướng di chuyển ngẫu nhiên
    #setDirectionRandom(){
        this.directionTimer--; // Giảm thời gian đếm ngược
        let newMoveDirection = null; // Hướng di chuyển mới
        if(this.directionTimer > 0){ // Nếu thời gian đếm ngược còn
            this.directionTimer = this.directionTimerDefault; // Reset thời gian đếm ngược
            newMoveDirection = Math.floor(Math.random() * Object.keys(MovingDirection).length); // Chọn hướng di chuyển ngẫu nhiên
        }

        if(newMoveDirection != null && this.movingDirection != newMoveDirection){ // Nếu hướng di chuyển mới khác hướng di chuyển hiện tại
            if(Number.isInteger(this.x/ this.tileSize) && Number.isInteger(this.y/ this.tileSize)){ // Nếu vị trí của ghost là số nguyên
                if(!this.tileMap.didCollideWithEnviroment(this.x, this.y, newMoveDirection)){ // Nếu không va chạm với môi trường
                    this.movingDirection = newMoveDirection; // Set hướng di chuyển mới
                }
            }
        }
    }

    // Di chuyển theo A*
    #moveAstar(){
        switch(this.movingDirection){
            case MovingDirection.up:
                this.y -= this.velocity; // Di chuyển lên
                break;
            case MovingDirection.down:
                this.y += this.velocity; // Di chuyển xuống
                break;
            case MovingDirection.left:
                this.x -= this.velocity; // Di chuyển sang trái
                break;
            case MovingDirection.right:
                this.x += this.velocity; // Di chuyển sang phải
                break;
        }
        
    }

    // Di chuyển ngẫu nhiên
    #moveRandom(){
        if(!this.tileMap.didCollideWithEnviroment(this.x, this.y, this.movingDirection)){ // Nếu không va chạm với môi trường
            switch(this.movingDirection){
                case MovingDirection.up:
                    this.y -= this.velocity; // Di chuyển lên
                    break;
                case MovingDirection.down:
                    this.y += this.velocity; // Di chuyển xuống
                    break;
                case MovingDirection.left:
                    this.x -= this.velocity; // Di chuyển sang trái
                    break;
                case MovingDirection.right:
                    this.x += this.velocity; // Di chuyển sang phải
                    break;
            }
        }
    }
    
    // Load hình ảnh
    #loadImages(){
        this.normalGhost = new Image(); // Tạo hình ảnh ma bình thường
        this.normalGhost.src = '../images/ghost.png'; 

        this.scaredGhost = new Image(); // Tạo hình ảnh ma sợ hãi
        this.scaredGhost.src = '../images/scaredGhost.png';

        this.scaredGhost2 = new Image(); // Tạo hình ảnh ma sợ hãi 2
        this.scaredGhost2.src = '../images/scaredGhost2.png';

        this.image = this.normalGhost;
    }

    
}

