# Pacman Game

Đây là một dự án tái tạo trò chơi Pacman cổ điển bằng JavaScript.

## Cấu trúc Dự án

Dự án này bao gồm các file JavaScript sau:

- `Astar.js`: Chứa thuật toán A* để tính toán đường đi ngắn nhất từ một điểm đến một điểm khác trên bản đồ.
- `Enemy.js`: Định nghĩa lớp Enemy, đại diện cho các kẻ thù mà Pacman cần tránh.
- `Game.js`: Điều khiển logic chính của trò chơi, bao gồm việc kiểm tra trạng thái game over và game win, cũng như vẽ các thành phần của trò chơi lên màn hình.
- `MovingDirection.js`: Định nghĩa các hướng di chuyển mà Pacman và kẻ thù có thể đi.
- `Pacman.js`: Định nghĩa lớp Pacman, đại diện cho nhân vật chính của trò chơi.
- `TileMap.js`: Định nghĩa lớp TileMap, được sử dụng để vẽ bản đồ gạch của trò chơi.

Dự án cũng bao gồm các thư mục `images/` và `sounds/`, chứa các tệp hình ảnh và âm thanh được sử dụng trong trò chơi.

## Cách Chơi

Để chơi trò chơi, mở file `index.html` trong trình duyệt của bạn. Sử dụng các phím mũi tên để di chuyển Pacman. Mục tiêu của trò chơi là ăn tất cả các chấm vàng mà tránh bị các kẻ thù bắt.