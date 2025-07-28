// script.js - simple infinite vertical runner

// ------- DOM references -------
const menu        = document.getElementById('main-menu');
const startBtn    = document.getElementById('start-btn');
const soundBtn    = document.getElementById('sound-btn');
const musicBtn    = document.getElementById('music-btn');
const otherGames  = document.getElementById('other-games');
const exitBtn     = document.getElementById('exit-btn');
const hud         = document.getElementById('hud');
const scoreEl     = document.getElementById('score');
const livesEl     = document.getElementById('lives');
const pauseBtn    = document.getElementById('pause-btn');
const canvas      = document.getElementById('game-canvas');
const ctx         = canvas.getContext('2d');

// ------- audio -------
// Royalty free audio from pixabay
const bgMusic  = new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_be2243ab70.mp3?filename=cheery-monday-110997.mp3');
const hitSound = new Audio('https://cdn.pixabay.com/download/audio/2022/03/09/audio_afbff0ee28.mp3?filename=lose-120199.mp3');
bgMusic.loop = true;

let soundOn = true;
let musicOn = true;
let lives   = 3;
let score   = 0;
let level   = 1;
let paused  = false;
let player;
let obstacles = [];
let lastTime  = 0;
let spawnTimer = 0;

// constants
const MAX_LEVEL = 50;

// ------- event listeners -------
startBtn.addEventListener('click', startGame);
soundBtn.addEventListener('click', () => {
  soundOn = !soundOn;
  soundBtn.textContent = `Sound: ${soundOn ? 'On' : 'Off'}`;
});
musicBtn.addEventListener('click', () => {
  musicOn = !musicOn;
  musicBtn.textContent = `Music: ${musicOn ? 'On' : 'Off'}`;
  if (musicOn) bgMusic.play(); else bgMusic.pause();
});
otherGames.addEventListener('click', () => window.open('https://playinmo.com/', '_blank'));
exitBtn.addEventListener('click', () => window.close());
pauseBtn.addEventListener('click', () => {
  paused = !paused;
  pauseBtn.textContent = paused ? 'Resume' : 'Pause';
  if (!paused) requestAnimationFrame(gameLoop);
});

document.addEventListener('keydown', e => {
  if (!player) return;
  if (e.key === 'ArrowLeft') player.x -= 30;
  if (e.key === 'ArrowRight') player.x += 30;
});

canvas.addEventListener('pointermove', e => {
  if (player) {
    const rect = canvas.getBoundingClientRect();
    player.x = e.clientX - rect.left - player.w / 2;
  }
});

// ------- game functions -------
function startGame() {
  menu.classList.add('hidden');
  hud.classList.remove('hidden');
  canvas.classList.remove('hidden');

  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  player = { w: 40, h: 40, x: canvas.width / 2 - 20, y: canvas.height - 60, color: '#409eff' };

  lives = 3;
  score = 0;
  level = 1;
  obstacles = [];
  spawnTimer = 0;
  lastTime = performance.now();

  if (musicOn) bgMusic.play();

  requestAnimationFrame(gameLoop);
}

function gameLoop(now) {
  if (paused) return;
  const dt = now - lastTime;
  lastTime = now;
  update(dt);
  render();
  if (lives > 0 && level <= MAX_LEVEL) requestAnimationFrame(gameLoop);
  else endGame();
}

function update(dt) {
  // increase level based on score
  level = 1 + Math.floor(score / 100);
  if (level > MAX_LEVEL) level = MAX_LEVEL + 1;

  const speed = 2 + level * 0.3;          // obstacle speed
  const spawnRate = Math.max(30, 100 - level * 2); // spawn interval in ms

  spawnTimer += dt;
  if (spawnTimer > spawnRate) {
    spawnTimer = 0;
    obstacles.push({
      x: Math.random() * (canvas.width - 40),
      y: -40,
      size: 30 + Math.random() * 30,
      color: `hsl(${Math.random()*360},70%,60%)`
    });
  }

  // update obstacles
  obstacles.forEach(o => o.y += speed);
  obstacles = obstacles.filter(o => o.y < canvas.height + o.size);

  // collision detection
  obstacles.forEach(o => {
    if (rectsOverlap(player.x, player.y, player.w, player.h, o.x, o.y, o.size, o.size)) {
      o.y = canvas.height + 100; // move off screen
      if (soundOn) hitSound.play();
      lives -= 1;
    }
  });

  // keep player inside bounds
  if (player.x < 0) player.x = 0;
  if (player.x + player.w > canvas.width) player.x = canvas.width - player.w;

  score += dt * 0.01; // increment score with time
  scoreEl.textContent = `Score: ${Math.floor(score)}`;
  livesEl.textContent = `Lives: ${lives}`;
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw player
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.w, player.h);

  // draw obstacles
  obstacles.forEach(o => {
    ctx.fillStyle = o.color;
    ctx.fillRect(o.x, o.y, o.size, o.size);
  });
}

function rectsOverlap(x1,y1,w1,h1,x2,y2,w2,h2) {
  return x1 < x2 + w2 &&
         x1 + w1 > x2 &&
         y1 < y2 + h2 &&
         y1 + h1 > y2;
}

function endGame() {
  bgMusic.pause();
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#333';
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over!', canvas.width/2, canvas.height/2 - 20);
  ctx.fillText(`Score: ${Math.floor(score)}`, canvas.width/2, canvas.height/2 + 20);
  setTimeout(() => {
    menu.classList.remove('hidden');
    hud.classList.add('hidden');
    canvas.classList.add('hidden');
  }, 2000);
}
