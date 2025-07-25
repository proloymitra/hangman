const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');
const gameDiv = document.getElementById('game');
const scoreSpan = document.getElementById('score');
const livesSpan = document.getElementById('lives');
const levelSpan = document.getElementById('level');
const pauseBtn = document.getElementById('pause');
const hintBtn = document.getElementById('hint');
const extendBtn = document.getElementById('extend');
const timeSpan = document.getElementById('time');

const bgMusic = document.getElementById('bgMusic');
const flipSound = document.getElementById('flipSound');
const matchSound = document.getElementById('matchSound');
const mismatchSound = document.getElementById('mismatchSound');
const hintSound = document.getElementById('hintSound');

let soundFxOn = true;
let musicOn = true;
let paused = false;
let score = 0;
let lives = 5;
let level = 1;
let hints = 0;
let extendsNum = 0;
let matches = 0;
let cards = [];
let flipped = [];
let matched = [];
let animating = false;
let timeLeft = 60;
let timer = null;

const CARD_RADIUS = 10;

const symbols = [
    { shape: 'circle', color: '#ff0000' },
    { shape: 'square', color: '#00ff00' },
    { shape: 'triangle', color: '#0000ff' },
    { shape: 'diamond', color: '#ffff00' },
    { shape: 'star', color: '#ff00ff' },
    { shape: 'heart', color: '#00ffff' },
    { shape: 'pentagon', color: '#ff9900' },
    { shape: 'hexagon', color: '#9900ff' },
    { shape: 'octagon', color: '#00ff99' },
    { shape: 'cross', color: '#ff0099' },
    // Enough for up to 100 levels by repeating if needed
];

document.getElementById('soundFx').addEventListener('click', () => {
    soundFxOn = !soundFxOn;
    document.getElementById('soundFx').textContent = `Sound Effects ${soundFxOn ? 'On' : 'Off'}`;
});

document.getElementById('music').addEventListener('click', () => {
    musicOn = !musicOn;
    document.getElementById('music').textContent = `Music ${musicOn ? 'On' : 'Off'}`;
    if (musicOn) {
        bgMusic.play().catch(() => {});
    } else {
        bgMusic.pause();
    }
});

document.getElementById('start').addEventListener('click', () => {
    menu.classList.add('hidden');
    gameDiv.classList.remove('hidden');
    if (musicOn) bgMusic.play().catch(() => {});
    startLevel();
});

pauseBtn.addEventListener('click', () => {
    paused = !paused;
    pauseBtn.textContent = paused ? 'Resume' : 'Pause';
    if (!paused) requestAnimationFrame(draw);
});

hintBtn.addEventListener('click', () => {
    if (hints > 0 && !animating && flipped.length < 2) {
        hints--;
        hintBtn.textContent = `Hint (${hints})`;
        showHint();
    }
});

if (extendBtn) {
    extendBtn.addEventListener('click', () => {
        if (extendsNum > 0 && !paused && timer) {
            extendsNum--;
            if (extendBtn) extendBtn.textContent = `Extend Time (${extendsNum})`;
            timeLeft += 30;
            if (timeSpan) timeSpan.textContent = `Time: ${timeLeft}`;
            if (soundFxOn) hintSound.play().catch(() => {});
        }
    });
}

canvas.addEventListener('click', handleClick);
canvas.addEventListener('touchstart', handleTouchStart);

window.addEventListener('resize', resizeCanvas);
function resizeCanvas() {
    if (window.innerWidth < window.innerHeight) {
        canvas.width = window.innerWidth * 0.9;
        canvas.height = window.innerHeight * 0.7;
        draw();
    }
}
resizeCanvas();

function startLevel() {
    scoreSpan.textContent = `Score: ${score}`;
    livesSpan.textContent = `Lives: ${lives}`;
    levelSpan.textContent = `Level: ${level}`;
    hintBtn.textContent = `Hint (${hints})`;
    if (extendBtn) extendBtn.textContent = `Extend Time (${extendsNum})`;
    timeLeft = 60;
    if (timeSpan) timeSpan.textContent = `Time: ${timeLeft}`;
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
        if (!paused) {
            timeLeft--;
            if (timeSpan) timeSpan.textContent = `Time: ${timeLeft}`;
            if (timeLeft <= 0) {
                clearInterval(timer);
                loseLife();
            }
        }
    }, 1000);
    flipped = [];
    matched = [];
    matches = 0;
    cards = generateCards();
    draw();
}

function generateCards() {
    const numPairs = level + 1; // Increase with level, up to 100
    const totalCards = numPairs * 2;
    const gridSize = Math.ceil(Math.sqrt(totalCards));
    const rows = gridSize;
    const cols = Math.ceil(totalCards / rows);
    const cardSymbols = [];
    for (let i = 0; i < numPairs; i++) {
        const sym = symbols[i % symbols.length];
        cardSymbols.push(sym);
        cardSymbols.push(sym);
    }
    cardSymbols.sort(() => Math.random() - 0.5);
    const cardArray = [];
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const index = i * cols + j;
            if (index < totalCards) {
                cardArray.push({
                    symbol: cardSymbols[index],
                    flipped: false,
                    matched: false,
                    flipProgress: 0,
                    targetFlip: 0,
                    x: j * (canvas.width / cols),
                    y: i * (canvas.height / rows),
                    width: canvas.width / cols,
                    height: canvas.height / rows
                });
            }
        }
    }
    return cardArray;
}

function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    cards.forEach(card => {
        ctx.save();
        ctx.translate(card.x + card.width / 2, card.y + card.height / 2);
        const scaleX = Math.cos(card.flipProgress * Math.PI);
        ctx.scale(scaleX, 1);
        const halfW = card.width / 2;
        const halfH = card.height / 2;
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 5;
        drawRoundedRect(ctx, -halfW, -halfH, card.width, card.height, CARD_RADIUS);
        if (scaleX < 0) {
            // Front side
            ctx.scale(-1, 1); // Unflip
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.shadowColor = 'transparent';
            drawSymbol(card.symbol, 0, 0, Math.min(card.width, card.height) / 3);
        } else {
            // Back side
            const gradient = ctx.createLinearGradient(0, -halfH, 0, halfH);
            gradient.addColorStop(0, '#4b5563');
            gradient.addColorStop(1, '#1f2937');
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.beginPath();
            ctx.arc(0, 0, Math.min(halfW, halfH) / 2, 0, 2 * Math.PI);
            ctx.fill();
        }
        ctx.restore();
        if (card.matched) {
            ctx.save();
            ctx.shadowColor = 'transparent';
            ctx.fillStyle = 'rgba(34,197,94, 0.3)';
            drawRoundedRect(ctx, card.x, card.y, card.width, card.height, CARD_RADIUS);
            ctx.fill();
            ctx.restore();
        }
    });
    if (!paused && animating) requestAnimationFrame(animateFlip);
}

function drawSymbol(symbol, x, y, size) {
    ctx.save();
    let shadowColor = symbol.color.replace('#', 'rgba(') + ',0.5)';
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = symbol.color;
    ctx.beginPath();
    switch (symbol.shape) {
        case 'circle':
            ctx.arc(x, y, size, 0, 2 * Math.PI);
            break;
        case 'square':
            ctx.rect(x - size, y - size, size * 2, size * 2);
            break;
        case 'triangle':
            ctx.moveTo(x, y - size);
            ctx.lineTo(x - size, y + size);
            ctx.lineTo(x + size, y + size);
            break;
        case 'diamond':
            ctx.moveTo(x, y - size);
            ctx.lineTo(x - size, y);
            ctx.lineTo(x, y + size);
            ctx.lineTo(x + size, y);
            break;
        case 'star':
            // 5-point star
            const outer = size;
            const inner = size / 2;
            ctx.moveTo(x, y - outer);
            for (let i = 0; i < 5; i++) {
                ctx.lineTo(x + outer * Math.sin((i * 72 + 36) * Math.PI / 180), y - outer * Math.cos((i * 72 + 36) * Math.PI / 180));
                ctx.lineTo(x + inner * Math.sin((i * 72 + 72) * Math.PI / 180), y - inner * Math.cos((i * 72 + 72) * Math.PI / 180));
            }
            break;
        case 'heart':
            ctx.moveTo(x, y + size / 4);
            ctx.bezierCurveTo(x + size / 2, y - size / 2, x + size, y + size / 4, x, y + size);
            ctx.bezierCurveTo(x - size, y + size / 4, x - size / 2, y - size / 2, x, y + size / 4);
            break;
        case 'pentagon':
            drawPolygon(x, y, size, 5);
            break;
        case 'hexagon':
            drawPolygon(x, y, size, 6);
            break;
        case 'octagon':
            drawPolygon(x, y, size, 8);
            break;
        case 'cross':
            ctx.rect(x - size / 4, y - size, size / 2, 2 * size);
            ctx.rect(x - size, y - size / 4, 2 * size, size / 2);
            break;
       default:
            ctx.rect(x - size, y - size, size * 2, size * 2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
}

function drawPolygon(x, y, size, sides) {
    const angle = 2 * Math.PI / sides;
    ctx.moveTo(x + size * Math.cos(0), y + size * Math.sin(0));
    for (let i = 1; i < sides; i++) {
        ctx.lineTo(x + size * Math.cos(i * angle), y + size * Math.sin(i * angle));
    }
}

function animateFlip() {
    animating = false;
    cards.forEach(card => {
        const diff = card.targetFlip - card.flipProgress;
        if (Math.abs(diff) > 0.001) {
            card.flipProgress += diff * 0.2;
            animating = true;
        } else {
            card.flipProgress = card.targetFlip;
        }
    });
    draw();
    if (animating && !paused) requestAnimationFrame(animateFlip);
}

function flipCardAt(x, y) {
    const card = cards.find(c => x >= c.x && x < c.x + c.width && y >= c.y && y < c.y + c.height && !c.flipped && !c.matched);
    if (card) {
        card.targetFlip = 1;
        card.flipped = true;
        flipped.push(card);
        if (soundFxOn) flipSound.play().catch(() => {});
        animating = true;
        requestAnimationFrame(animateFlip);
        if (flipped.length === 2) setTimeout(checkMatch, 1000);
    }
}

function handleClick(e) {
    if (paused || animating || flipped.length >= 2) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    flipCardAt(x, y);
}

function handleTouchStart(e) {
    if (paused || animating || flipped.length >= 2) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    flipCardAt(x, y);
}

function checkMatch() {
    const [card1, card2] = flipped;
    if (card1.symbol.shape === card2.symbol.shape && card1.symbol.color === card2.symbol.color) {
        card1.matched = true;
        card2.matched = true;
        matched.push(card1, card2);
        score += 10 * level;
        scoreSpan.textContent = `Score: ${score}`;
        matches++;
        if (matches % 3 === 0) {
            hints++;
            hintBtn.textContent = `Hint (${hints})`;
        }
        if (matches % 5 === 0) {
            extendsNum++;
            if (extendBtn) extendBtn.textContent = `Extend Time (${extendsNum})`;
        }
        if (soundFxOn) matchSound.play().catch(() => {});
        if (matched.length === cards.length) {
            clearInterval(timer);
            level++;
            if (level > 100) {
                alert('You won the game!');
                resetGame();
            } else {
                setTimeout(startLevel, 1000);
            }
        }
    } else {
        card1.targetFlip = 0;
        card2.targetFlip = 0;
        card1.flipped = false;
        card2.flipped = false;
        if (soundFxOn) mismatchSound.play().catch(() => {});
        animating = true;
        requestAnimationFrame(animateFlip);
    }
    flipped = [];
}

function showHint() {
    const unmatched = cards.filter(c => !c.matched);
    if (unmatched.length >= 2) {
        const hintCard1 = unmatched[0];
        const hintCard2 = unmatched.find(c => c !== hintCard1 && c.symbol.shape === hintCard1.symbol.shape && c.symbol.color === hintCard1.symbol.color);
        if (hintCard2) {
            const pair = [hintCard1, hintCard2];
            pair.forEach(card => {
                card.targetFlip = 1;
                card.flipped = true;
            });
            animating = true;
            requestAnimationFrame(animateFlip);
            if (soundFxOn) hintSound.play().catch(() => {});
            setTimeout(() => {
                pair.forEach(card => {
                    if (!card.matched) {
                        card.targetFlip = 0;
                        card.flipped = false;
                    }
                });
                animating = true;
                requestAnimationFrame(animateFlip);
            }, 1000);
        }
    }
}

function loseLife() {
    lives--;
    livesSpan.textContent = `Lives: ${lives}`;
    if (lives <= 0) {
        alert('Game Over!');
        resetGame();
    } else {
        startLevel();
    }
}

function resetGame() {
    score = 0;
    lives = 5;
    level = 1;
    hints = 0;
    extendsNum = 0;
    matches = 0;
    menu.classList.remove('hidden');
    gameDiv.classList.add('hidden');
    bgMusic.pause();
}