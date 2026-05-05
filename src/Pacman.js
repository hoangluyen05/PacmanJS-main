import MovingDirection from "./MovingDirection.js";

export default class Pacman {
    constructor(x, y, tileSize, velocity, tileMap){
        this.x = x; // vị trí của pacman trên trục x
        this.y = y; // vị trí của pacman trên trục y
        this.tileSize = tileSize; // kích thước của mỗi ô trong game
        this.velocity = velocity; // vận tốc di chuyển
        this.tileMap = tileMap; // map của game
        this.#loadPacmanImages(); // load hình ảnh pacman
        
        this.currentMovingDirection = null; // hướng di chuyển hiện tại
        this.requestedMovingDirection = null; // hướng di chuyển yêu cầu
 
        this.pacmanAnimationTimeDefault = 10; // thời gian chuyển đổi giữa các hình ảnh của pacman
        this.pacmanAnimationTimer = null; // thời gian chuyển đổi giữa các hình ảnh của pacman

        this.pacmanRotation = this.Rotation.right; // hướng quay của pacman

        this.wakaSound = new Audio('../sounds/waka.wav');
        this.powerDotSound = new Audio('../sounds/power_dot.wav');

        this.eatGhostSound = new Audio('../sounds/eat_ghost.wav');

        this.powerDotAboutToExpire = false; // biến kiểm tra power dot sắp hết hạn
        this.powerDotActive = false; // biến kiểm tra power dot còn hoạt động
        this.madeFirstMove = false; // biến kiểm tra pacman đã di chuyển lần đầu tiên
        this.timers = []; // mảng chứa các timer

        document.addEventListener('keydown', (event) => this.#keyDown(event)); // sự kiện keydown
    }

    // hàm quay pacman
    Rotation = {
        right: 0,
        down: 1,
        left: 2,
        up: 3
    };

    // hàm load hình ảnh pacman
    #loadPacmanImages(){
        const pacmanImage1 = new Image();
        pacmanImage1.src = '../images/pac0.png';

        const pacmanImage2 = new Image();
        pacmanImage2.src = '../images/pac1.png';

        const pacmanImage3 = new Image();
        pacmanImage3.src = '../images/pac2.png';

        const pacmanImage4 = new Image();
        pacmanImage4.src = '../images/pac1.png';

        this.pacmanImages = [pacmanImage1, pacmanImage2, pacmanImage3, pacmanImage4];
        this.pacmanImageIndex = 0;
    }

    // hàm xử lý sự kiện keydown
    #keyDown(event){
        if(event.keyCode == 38){
            if(this.currentMovingDirection == MovingDirection.down){
                this.currentMovingDirection = MovingDirection.up;
            }
            this.requestedMovingDirection = MovingDirection.up;
            this.madeFirstMove = true;
        }

        if(event.keyCode == 40){
            if(this.currentMovingDirection == MovingDirection.up){
                this.currentMovingDirection = MovingDirection.down;
            }
            this.requestedMovingDirection = MovingDirection.down;
            this.madeFirstMove = true;
        }

        if(event.keyCode == 37){
            if(this.currentMovingDirection == MovingDirection.right){
                this.currentMovingDirection = MovingDirection.left;
            }
            this.requestedMovingDirection = MovingDirection.left;
            this.madeFirstMove = true;
        }

        if(event.keyCode == 39){
            if(this.currentMovingDirection == MovingDirection.left){
                this.currentMovingDirection = MovingDirection.right;
            }
            this.requestedMovingDirection = MovingDirection.right;
            this.madeFirstMove = true;
        }
    }

    // hàm di chuyển pacman
    #move(){
        if(this.currentMovingDirection != this.requestedMovingDirection){ // nếu hướng di chuyển hiện tại khác hướng di chuyển yêu cầu
            if(Number.isInteger(this.x/ this.tileSize) && Number.isInteger(this.y/ this.tileSize)){ // nếu vị trí hiện tại của pacman nằm trên một ô
                if(!this.tileMap.didCollideWithEnviroment(this.x, this.y, this.requestedMovingDirection)){ // nếu không va chạm với môi trường
                    this.currentMovingDirection = this.requestedMovingDirection; // hướng di chuyển hiện tại bằng hướng di chuyển yêu cầu
                }
            }
        }
        if(this.tileMap.didCollideWithEnviroment(this.x, this.y, this.requestedMovingDirection)){ // nếu va chạm với môi trường
            this.pacmanAnimationTimer = null; // dừng chuyển đổi giữa các hình ảnh của pacman
            this.pacmanImageIndex = 1;// hiển thị hình ảnh pacman mở miệng
            return;
        }else if(this.currentMovingDirection != null && this.pacmanAnimationTimer == null){ // nếu hướng di chuyển hiện tại khác null và thời gian chuyển đổi giữa các hình ảnh của pacman bằng null
            this.pacmanAnimationTimer = this.pacmanAnimationTimeDefault; // thời gian chuyển đổi giữa các hình ảnh của pacman bằng thời gian mặc định
        }
        // di chuyển theo hướng di chuyển hiện tại
        switch(this.currentMovingDirection){
            case MovingDirection.up:
                this.y -= this.velocity; // di chuyển lên trên
                this.pacmanRotation = this.Rotation.up; // quay pacman lên trên
                break;
            case MovingDirection.down:
                this.y += this.velocity;
                this.pacmanRotation = this.Rotation.down;
                break;
            case MovingDirection.left:
                this.x -= this.velocity;
                this.pacmanRotation = this.Rotation.left;
                break;
            case MovingDirection.right:
                this.x += this.velocity;
                this.pacmanRotation = this.Rotation.right;
                break;
        }
    }

    // hàm chuyển đổi giữa các hình ảnh của pacman
    #animate(){
        if(this.pacmanAnimationTimer == null){
           return;
        }
        this.pacmanAnimationTimer--;
        if(this.pacmanAnimationTimer == 0){
            this.pacmanAnimationTimer = this.pacmanAnimationTimeDefault;
            this.pacmanImageIndex++;
            if(this.pacmanImageIndex == this.pacmanImages.length){
                this.pacmanImageIndex = 0;
            }
        }

    }

    // hàm ăn thức ăn
    #eatDot(){
        if(this.tileMap.eatDot(this.x, this.y) && this.madeFirstMove){
            this.wakaSound.play();
        }
    }

    // hàm ăn viên sức mạnh
    #eatPowerDot(){
        if(this.tileMap.eatPowerDot(this.x, this.y)){ // nếu ăn viên sức mạnh
            this.powerDotSound.play(); // phát âm thanh
            this.powerDotActive = true; // power dot hoạt động
            this.powerDotAboutToExpire = false; // power dot chưa hết hạn
            this.timers.forEach((timer)=> clearTimeout(timer)); // xóa các timer
            this.timers = []; // khởi tạo lại mảng timer

            let powerDotTimer = setTimeout(() => { // tạo timer cho power dot
                this.powerDotActive = false; // power dot không hoạt động
                this.powerDotAboutToExpire = false; // power dot chưa hết hạn
            },1000*6);
            this.timers.push(powerDotTimer); // thêm timer vào mảng timer

            let powerDotAboutToExpireTimer = setTimeout(() => { // tạo timer cho power dot sắp hết hạn
                this.powerDotAboutToExpire = true; // power dot sắp hết hạn
            },1000*3);

            this.timers.push(powerDotAboutToExpireTimer); // thêm timer vào mảng timer
        }
    }

    // hàm ăn ghost
    #eatGhost(enimes){
        if(this.powerDotActive){ // nếu power dot hoạt động
            enimes.forEach((enemy) => { // duyệt qua danh sách ghost
                if(enemy.collideWith(this)){  // nếu pacman va chạm với ghost
                    this.eatGhostSound.play(); // phát âm thanh
                    enimes.splice(enimes.indexOf(enemy), 1); // xóa ghost khỏi danh sách ghost
                }
            });
        }
    }


    // hàm vẽ pacman
    draw(ctx, pause, enimes){
        if(!pause){
            this.#move(); // di chuyển
            this.#animate(); // chuyển đổi giữa các hình ảnh của pacman
        }
        this.#eatDot(); // ăn thức ăn
        this.#eatPowerDot(); // ăn viên sức mạnh
        this.#eatGhost(enimes); // ăn ghost
        const size = this.tileSize / 2;

        ctx.save(); // lưu trạng thái của canvas
        ctx.translate(this.x + size, this.y + size); // di chuyển tọa độ của canvas
        ctx.rotate((this.pacmanRotation * 90 * Math.PI) / 180 ); // quay canvas

        ctx.drawImage(this.pacmanImages[this.pacmanImageIndex], -size, -size, this.tileSize, this.tileSize); // vẽ pacman

        ctx.restore(); // khôi phục trạng thái của canvas
    }
    

}