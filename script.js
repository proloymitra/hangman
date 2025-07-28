// script.js

// --- DOM & Canvas Refs ---
const startBtn        = document.getElementById('start-btn');
const soundToggleBtn  = document.getElementById('sound-toggle');
const musicToggleBtn  = document.getElementById('music-toggle');
const otherGamesBtn   = document.getElementById('other-games-btn');
const exitBtn         = document.getElementById('exit-btn');
const menu            = document.getElementById('main-menu');
const hud             = document.getElementById('hud');
const hintEl          = document.getElementById('hint');
const scoreEl         = document.getElementById('score');
const livesEl         = document.getElementById('lives');
const pauseBtn        = document.getElementById('pause-btn');
const wordContainer   = document.getElementById('word-container');
const lettersContainer= document.getElementById('letters-container');

const canvas = document.getElementById('game-canvas');
const ctx    = canvas.getContext('2d');
canvas.width  = 375;
canvas.height = 300;

// --- Timer display ---
const timerEl = document.createElement('div');
timerEl.id = 'timer';
timerEl.style.margin = '5px';
timerEl.style.fontSize = '1em';
hud.appendChild(timerEl);

// --- Game State ---
let wordList       = [];
let availableWords = [];
let score          = 0;
let lives          = 5;
let chosenWord     = '';
let maskedWord     = [];
let timeLeft       = 0;
let timerInterval;
let gamePaused     = false;
let soundEnabled   = true;
let musicEnabled   = true;

// --- Audio ---
const bgMusic      = new Audio('sounds/background-music.mp3');
bgMusic.loop       = true;
const correctSound = new Audio('sounds/correct.mp3');
const wrongSound   = new Audio('sounds/wrong.mp3');

function playSound(sound) {
  if (soundEnabled) sound.play();
}

// --- Initial UI setup ---
startBtn.disabled    = true;
startBtn.textContent = 'Loading words...';

// --- Load words from local CSV ---
fetch('words.csv')
  .then(res => res.text())
  .then(text => {
    const lines = text.trim().split(/\r?\n/);
    // assume first line is header: Word,Hint
    lines.shift();
    wordList = lines.map(line => {
      const [w, h] = line.split(',');
      return { word: w.trim().toUpperCase(), hint: h.trim() };
    });
    console.log('Loaded', wordList.length, 'words');
  })
  .catch(err => {
    console.error('Failed to load words.csv:', err);
    wordList = [
      { word: 'JAVASCRIPT', hint: 'A popular scripting language' },
      { word: 'CANVAS',     hint: 'HTML5 drawing element'     },
      { word: 'HANGMAN',    hint: 'Classic word-guessing game'}
    ];
  })
  .finally(() => {
    availableWords = wordList.slice();
    startBtn.disabled    = false;
    startBtn.textContent = 'Start Game';
  });

// --- Event listeners ---
startBtn.addEventListener('click', startGame);
soundToggleBtn.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundToggleBtn.textContent = `Sound: ${soundEnabled ? 'On' : 'Off'}`;
});
musicToggleBtn.addEventListener('click', () => {
  musicEnabled = !musicEnabled;
  musicToggleBtn.textContent = `Music: ${musicEnabled ? 'On' : 'Off'}`;
  musicEnabled ? bgMusic.play() : bgMusic.pause();
});
otherGamesBtn.addEventListener('click', () => window.open('https://playinmo.com/', '_blank'));
exitBtn.addEventListener('click', () => window.close());
pauseBtn.addEventListener('click', () => {
  gamePaused = !gamePaused;
  pauseBtn.textContent = gamePaused ? 'Resume' : 'Pause';
  Array.from(lettersContainer.children).forEach(btn => btn.disabled = gamePaused);
});

// --- Game flow ---
function startGame() {
  menu.classList.add('hidden');
  hud.classList.remove('hidden');
  hintEl.classList.remove('hidden');
  canvas.classList.remove('hidden');
  wordContainer.classList.remove('hidden');
  lettersContainer.classList.remove('hidden');

  score = 0;
  availableWords = wordList.slice();
  nextRound();
}

function nextRound() {
  if (!availableWords.length) availableWords = wordList.slice();

  lives = 5;
  updateHUD();
  resetCanvas();

  const idx = Math.floor(Math.random() * availableWords.length);
  const entry = availableWords.splice(idx, 1)[0];
  chosenWord = entry.word;
  maskedWord = Array(chosenWord.length).fill('_');
  hintEl.textContent = `Hint: ${entry.hint}`;
  renderWord();
  renderLetters();

  clearInterval(timerInterval);
  timeLeft = 90;
  timerEl.textContent = `Time: ${timeLeft}s`;
  timerInterval = setInterval(() => {
    if (!gamePaused) {
      if (--timeLeft <= 0) {
        clearInterval(timerInterval);
        onRoundEnd(false);
      }
      timerEl.textContent = `Time: ${timeLeft}s`;
    }
  }, 1000);

  if (musicEnabled) bgMusic.play();
}

function updateHUD() {
  scoreEl.textContent = `Score: ${score}`;
  livesEl.textContent = `Lives: ${lives}`;
}

function renderWord() {
  wordContainer.innerHTML = '';
  maskedWord.forEach(ch => {
    const span = document.createElement('span');
    span.textContent = ch;
    span.classList.add('letter');
    wordContainer.appendChild(span);
  });
}

function renderLetters() {
  lettersContainer.innerHTML = '';
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(letter => {
    const btn = document.createElement('button');
    btn.textContent = letter;
    btn.classList.add('letter-btn');
    btn.addEventListener('click', () => handleGuess(letter, btn));
    lettersContainer.appendChild(btn);
  });
}

function handleGuess(letter, btn) {
  if (gamePaused) return;
  btn.disabled = true;
  let correct = false;
  for (let i = 0; i < chosenWord.length; i++) {
    if (chosenWord[i] === letter) {
      maskedWord[i] = letter;
      correct = true;
    }
  }
  if (correct) {
    playSound(correctSound); score += 10; renderWord();
  } else {
    playSound(wrongSound); lives--; drawNext(); updateHUD();
  }
  if (!maskedWord.includes('_')) onRoundEnd(true);
  else if (lives <= 0) onRoundEnd(false);
}

function onRoundEnd(won) {
  clearInterval(timerInterval);
  if (won) animateWin(); else animateLoss();
  setTimeout(() => nextRound(), 1000);
}

// --- Canvas & animations ---
let bodyPartsDrawn = 0;
function resetCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#333'; ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(50, 280); ctx.lineTo(350, 280);
  ctx.moveTo(100, 280); ctx.lineTo(100, 50);
  ctx.lineTo(200, 50); ctx.lineTo(200, 80);
  ctx.stroke(); bodyPartsDrawn = 0;
}

function drawNext() {
  bodyPartsDrawn++;
  ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 4;
  switch (bodyPartsDrawn) {
    case 1: drawHead(); break;
    case 2: drawBody(); break;
    case 3: drawArm(-1); break;
    case 4: drawArm(1); break;
    case 5: drawLeg(-1); break;
    case 6: drawLeg(1); break;
  }
}
function drawHead() { ctx.beginPath(); ctx.arc(200,110,30,0,Math.PI*2); ctx.stroke(); }
function drawBody() { ctx.beginPath(); ctx.moveTo(200,140); ctx.lineTo(200,220); ctx.stroke(); }
function drawArm(dir)  { ctx.beginPath(); ctx.moveTo(200,160); ctx.lineTo(200+dir*50,200); ctx.stroke(); }
function drawLeg(dir)  { ctx.beginPath(); ctx.moveTo(200,220); ctx.lineTo(200+dir*50,270); ctx.stroke(); }

function animateWin() {
  const colors=['#ff4d4d','#4dff4d','#4d4dff','#ffff4d'];
  for (let i=0;i<50;i++){
    const x=Math.random()*canvas.width, y=Math.random()*canvas.height;
    ctx.fillStyle=colors[Math.floor(Math.random()*colors.length)];
    ctx.fillRect(x,y,8,8);
  }
}
function animateLoss(){ ctx.fillStyle='rgba(255,0,0,0.5)'; ctx.fillRect(0,0,canvas.width,canvas.height); }
