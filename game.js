const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let isGameOver = false;
let isPaused = false;
let currentCorrectAnswer = 0;

// Car Data
const carData = [
    { brand: "Ferrari", image: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" },
    { brand: "Porsche", image: "https://images.unsplash.com/photo-1503376713356-20f6266b4466?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" },
    { brand: "Lamborghini", image: "https://images.unsplash.com/photo-1519245659620-e859806a8d3b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" },
    { brand: "Bugatti", image: "https://images.unsplash.com/photo-1600713898863-149b1a774136?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" },
    { brand: "Aston Martin", image: "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" },
    { brand: "McLaren", image: "https://images.unsplash.com/photo-1621535492211-1ee116491753?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" }
];

// Player
const player = {
    x: 50,
    y: 500,
    width: 40,
    height: 40,
    vx: 0,
    vy: 0,
    speed: 5,
    jumpStrength: -12,
    grounded: false,
    color: 'red'
};

// Physics
const gravity = 0.5;

// Platforms
const platforms = [
    { x: 0, y: 560, width: 800, height: 40 } // Ground
];

// Bricks
const bricks = [
    { x: 200, y: 400, width: 40, height: 40, hit: false },
    { x: 300, y: 300, width: 40, height: 40, hit: false },
    { x: 400, y: 400, width: 40, height: 40, hit: false },
    { x: 500, y: 300, width: 40, height: 40, hit: false }
];

// Keys
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false
};

document.addEventListener('keydown', (e) => {
    if (isPaused) {
        // Handle quiz answers
        if (e.key === '1' || e.key === '2' || e.key === '3') {
            checkAnswer(parseInt(e.key));
        }
        return;
    }

    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = false;
    }
});

function update() {
    if (isGameOver || isPaused) return;

    // Movement
    if (keys.ArrowLeft) {
        player.vx = -player.speed;
    } else if (keys.ArrowRight) {
        player.vx = player.speed;
    } else {
        player.vx = 0;
    }

    // Jumping
    if (keys.ArrowUp && player.grounded) {
        player.vy = player.jumpStrength;
        player.grounded = false;
    }

    // Apply gravity
    player.vy += gravity;

    // Update position
    player.x += player.vx;
    player.y += player.vy;

    // Screen bounds
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Collision with platforms
    player.grounded = false;
    for (let p of platforms) {
        if (player.x < p.x + p.width &&
            player.x + player.width > p.x &&
            player.y < p.y + p.height &&
            player.y + player.height > p.y) {

            // Top collision (landing)
            if (player.vy > 0 && player.y + player.height - player.vy <= p.y) {
                player.grounded = true;
                player.y = p.y - player.height;
                player.vy = 0;
            }
        }
    }

    // Collision with bricks
    for (let b of bricks) {
        if (!b.hit &&
            player.x < b.x + b.width &&
            player.x + player.width > b.x &&
            player.y < b.y + b.height &&
            player.y + player.height > b.y) {

            // Bottom collision (hitting from below)
            if (player.vy < 0 && player.y - player.vy >= b.y + b.height) {
                player.y = b.y + b.height;
                player.vy = 0; // stop upward movement
                hitBrick(b);
            }
            // Top collision (landing on brick)
            else if (player.vy > 0 && player.y + player.height - player.vy <= b.y) {
                player.grounded = true;
                player.y = b.y - player.height;
                player.vy = 0;
            }
            // Side collisions
            else {
                if (player.vx > 0) { // moving right
                    player.x = b.x - player.width;
                } else if (player.vx < 0) { // moving left
                    player.x = b.x + b.width;
                }
            }
        }
    }
}

function hitBrick(brick) {
    brick.hit = true;
    isPaused = true;
    showQuiz();
}

function showQuiz() {
    const modal = document.getElementById('quiz-modal');
    const carImage = document.getElementById('car-image');

    // Select random car
    const targetCar = carData[Math.floor(Math.random() * carData.length)];
    carImage.src = targetCar.image;

    // Generate options
    let options = [targetCar.brand];
    while(options.length < 3) {
        let randomBrand = carData[Math.floor(Math.random() * carData.length)].brand;
        if (!options.includes(randomBrand)) {
            options.push(randomBrand);
        }
    }

    // Shuffle options
    options.sort(() => Math.random() - 0.5);

    // Set text and find correct answer
    for(let i=0; i<3; i++) {
        document.getElementById(`choice-${i+1}`).innerText = options[i];
        if (options[i] === targetCar.brand) {
            currentCorrectAnswer = i + 1;
        }
    }

    modal.classList.remove('hidden');
}

function checkAnswer(choice) {
    if (choice === currentCorrectAnswer) {
        console.log("Correct!");
    } else {
        console.log("Wrong!");
    }
    // For now, always resume game
    closeQuiz();
}

function closeQuiz() {
    document.getElementById('quiz-modal').classList.add('hidden');
    isPaused = false;

    // Reset keys to prevent sticking
    keys.ArrowLeft = false;
    keys.ArrowRight = false;
    keys.ArrowUp = false;
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw platforms
    ctx.fillStyle = 'green';
    for (let p of platforms) {
        ctx.fillRect(p.x, p.y, p.width, p.height);
    }

    // Draw bricks
    ctx.fillStyle = 'brown';
    for (let b of bricks) {
        if (!b.hit) {
            ctx.fillRect(b.x, b.y, b.width, b.height);
            // Draw brick texture lines
            ctx.strokeStyle = 'black';
            ctx.strokeRect(b.x, b.y, b.width, b.height);
        }
    }

    // Draw player
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// Start game
loop();
