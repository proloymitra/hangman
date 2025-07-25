
+const canvas = document.getElementById('gameCanvas');
+const ctx = canvas.getContext('2d');
+const menu = document.getElementById('menu');
+const hud = document.getElementById('hud');
+const startBtn = document.getElementById('startBtn');
+const soundBtn = document.getElementById('soundBtn');
+const musicBtn = document.getElementById('musicBtn');
+const pauseBtn = document.getElementById('pauseBtn');
+const exitBtn = document.getElementById('exitBtn');
+const bgm = document.getElementById('bgm');
+const sfx = document.getElementById('sfx');
 
+let soundOn = true;
+let musicOn = true;
+let paused = false;
+let score = 0;
+let lives = 3;
+let playerLane = 1; // 0 left,1 center,2 right
+const laneX = [80, 180, 280];
+const obstacles = [];
+let lastTime = 0;
+
+function resetGame() {
+    obstacles.length = 0;
+    score = 0;
+    lives = 3;
+    playerLane = 1;
+    paused = false;
+    bgm.currentTime = 0;
+}
+
+function spawnObstacle() {
+    const lane = Math.floor(Math.random() * 3);
+    obstacles.push({ lane, y: -40 });
+}
+
+function update(delta) {
+    if (paused) return;
+    if (Math.random() < 0.02) spawnObstacle();
+    for (const o of obstacles) {
+        o.y += delta * 0.3;
+    }
+    while (obstacles.length && obstacles[0].y > canvas.height) {
+        obstacles.shift();
+        score++;
+    }
+    for (const o of obstacles) {
+        if (o.lane === playerLane && o.y + 40 > canvas.height - 80 && o.y < canvas.height - 40) {
+            obstacles.splice(obstacles.indexOf(o),1);
+            lives--;
+            if (soundOn) sfx.play();
+            if (lives <= 0) gameOver();
+        }
+    }
+    hud.querySelector('#score').textContent = `Score: ${score}`;
+    hud.querySelector('#lives').textContent = `Lives: ${lives}`;
+}
+
+function draw() {
+    ctx.clearRect(0,0,canvas.width,canvas.height);
+    ctx.fillStyle = '#222';
+    ctx.fillRect(0,0,canvas.width,canvas.height);
+    // lanes
+    ctx.strokeStyle = '#555';
+    ctx.lineWidth = 2;
+    ctx.beginPath();
+    ctx.moveTo(120,0); ctx.lineTo(120,canvas.height); // left lane line
+    ctx.moveTo(240,0); ctx.lineTo(240,canvas.height); // right lane line
+    ctx.stroke();
+    // player
+    ctx.fillStyle = '#0f0';
+    ctx.fillRect(laneX[playerLane]-20, canvas.height-60, 40, 40);
+    // obstacles
+    ctx.fillStyle = '#f00';
+    for (const o of obstacles) {
+        ctx.fillRect(laneX[o.lane]-20, o.y, 40, 40);
+    }
+}
+
+function loop(timestamp) {
+    const delta = timestamp - lastTime;
+    lastTime = timestamp;
+    update(delta);
+    draw();
+    requestAnimationFrame(loop);
+}
+
+function gameOver() {
+    paused = true;
+    alert('Game Over! Your score: ' + score);
+    menu.classList.remove('hidden');
+    hud.classList.add('hidden');
+}
+
+startBtn.onclick = () => {
+    resetGame();
+    menu.classList.add('hidden');
+    hud.classList.remove('hidden');
+    if (musicOn) bgm.play();
+    requestAnimationFrame(loop);
+};
+
+soundBtn.onclick = () => {
+    soundOn = !soundOn;
+    soundBtn.textContent = `Sound: ${soundOn ? 'On' : 'Off'}`;
+};
+
+musicBtn.onclick = () => {
+    musicOn = !musicOn;
+    musicBtn.textContent = `Music: ${musicOn ? 'On' : 'Off'}`;
+    if (!musicOn) bgm.pause();
+    else if (!bgm.paused) bgm.play();
+};
+
+pauseBtn.onclick = () => {
+    paused = !paused;
+    pauseBtn.textContent = paused ? 'Resume' : 'Pause';
+    if (paused) bgm.pause();
+    else if (musicOn) bgm.play();
+};
+
+document.addEventListener('keydown', (e) => {
+    if (e.key === 'ArrowLeft' && playerLane > 0) playerLane--;
+    if (e.key === 'ArrowRight' && playerLane < 2) playerLane++;
+});
+
+canvas.addEventListener('touchstart', (e) => {
+    const x = e.touches[0].clientX - canvas.getBoundingClientRect().left;
+    if (x < canvas.width/2 && playerLane > 0) playerLane--;
+    else if (x >= canvas.width/2 && playerLane < 2) playerLane++;
+});
+
+exitBtn.onclick = () => {
+    window.close();
+};
 
EOF
)
