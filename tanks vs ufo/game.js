const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let w = canvas.width = window.innerWidth;
let h = canvas.height = window.innerHeight;
window.addEventListener("resize", () => {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
});

const shootSound = document.getElementById("shootSound");
const explosionSound = document.getElementById("explosionSound");
const hitSound = document.getElementById("hitSound");
const bgMusic = document.getElementById("bgMusic");
bgMusic.volume = 0.1;

let tank, bullets, ufos, ufoBullets, explosions, score, hp, gameOver, ufoSpeed, gameStarted, level;
let ufoInterval, shootInterval, theme = 'day', tankColor = '#556B2F', barrelLength = 35;
let nightStars = [], forest = [];

function checkOptionsSelected() {
  const themeSel = document.getElementById("themeSelect").value;
  const colorSel = document.getElementById("tankColor").value;
  const barrelSel = document.getElementById("barrelLength").value;
  const allSet = themeSel && colorSel && barrelSel;
  document.querySelectorAll("#difficultyButtons button").forEach(btn => btn.disabled = !allSet);
}

function resetGameVars() {
  tank = { x: w / 2, y: h - 100 }; // now lower for larger size
  bullets = []; ufos = []; ufoBullets = []; explosions = [];
  score = 0; hp = 3; gameOver = false;
  createForest();
}

function createForest() {
  forest = [];
  for (let i = 0; i < w; i += 40) {
    let treeHeight = Math.random() * 50 + 50;
    forest.push({ x: i, height: treeHeight });
  }
}

function drawBackground() {
  ctx.fillStyle = theme === 'day' ? '#87CEEB' : '#0a0a2a';
  ctx.fillRect(0, 0, w, h);

  ctx.beginPath();
  ctx.arc(w - 100, 100, 50, 0, Math.PI * 2);
  ctx.fillStyle = theme === 'day' ? 'yellow' : '#ccc';
  ctx.fill();

  if (theme === 'night' && nightStars.length === 0) {
    for (let i = 0; i < 200; i++) {
      nightStars.push({ x: Math.random() * w, y: Math.random() * h });
    }
  }
  if (theme === 'night') {
    ctx.fillStyle = 'white';
    nightStars.forEach(star => {
      ctx.fillRect(star.x, star.y, 1.5, 1.5);
    });
  }

  drawForest();
}

function drawForest() {
  ctx.fillStyle = '#2E8B57';
  ctx.fillRect(0, h - 80, w, 80);
  forest.forEach(tree => {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(tree.x + 10, h - 80 - tree.height, 10, tree.height);
    ctx.beginPath();
    ctx.moveTo(tree.x, h - 80 - tree.height);
    ctx.lineTo(tree.x + 15, h - 100 - tree.height);
    ctx.lineTo(tree.x + 30, h - 80 - tree.height);
    ctx.closePath();
    ctx.fillStyle = 'darkgreen';
    ctx.fill();
  });
}

function drawTank() {
  const x = tank.x;
  const y = tank.y;

  // Gąsienice
  ctx.fillStyle = '#333';
  ctx.fillRect(x - 45, y + 35, 90, 15);

  // Kadłub
  ctx.fillStyle = tankColor;
  ctx.fillRect(x - 35, y, 70, 35);

  // Wieża
  ctx.beginPath();
  ctx.arc(x, y + 10, 20, 0, Math.PI * 2);
  ctx.fillStyle = '#3a3a3a';
  ctx.fill();

  // Lufa
  ctx.fillStyle = 'darkgray';
  ctx.fillRect(x - 5, y - barrelLength, 10, barrelLength);

  // Detale (np. klapa)
  ctx.beginPath();
  ctx.arc(x + 10, y + 5, 5, 0, Math.PI * 2);
  ctx.fillStyle = 'lightgray';
  ctx.fill();
}

function drawHUD() {
  ctx.fillStyle = 'black';
  ctx.font = '20px Arial';
  ctx.fillText(`Wynik: ${score}`, 20, 30);
  ctx.fillStyle = '#ff3333';
  ctx.fillText(`HP: ${'❤'.repeat(hp)}`, 20, 60);
}

function startGame(lvl) {
  document.getElementById("menu").style.display = "none";
  document.getElementById("gameover").style.display = "none";
  level = lvl; resetGameVars(); gameStarted = true;
  theme = document.getElementById("themeSelect").value;
  tankColor = document.getElementById("tankColor").value;
  barrelLength = parseInt(document.getElementById("barrelLength").value);
  nightStars = [];

  if (level === 'easy') ufoSpeed = 0.5;
  else if (level === 'medium') ufoSpeed = 1;
  else if (level === 'hard') {
    ufoSpeed = 1.5;
    shootInterval = setInterval(() => {
      ufos.forEach(u => ufoBullets.push({ x: u.x, y: u.y + 10, dy: 4 }));
    }, 2000);
  }

  ufoInterval = setInterval(() => {
    const x = Math.random() * (w - 60) + 30;
    const typeChance = Math.random();
    let ufoType = "gray", hp = 1, speed = ufoSpeed, color = "silver";
    if (typeChance < 0.2) {
      ufoType = "red"; hp = 2; color = "red";
    } else if (typeChance < 0.4) {
      ufoType = "blue"; speed = ufoSpeed * 1.8; color = "blue";
    }
    ufos.push({ x, y: 30, dx: (Math.random() - 0.5) * 2, speed, hp, type: ufoType, color });
  }, 1500);

  bgMusic.currentTime = 0;
  bgMusic.play();
  update();
}

function update() {
  ctx.clearRect(0, 0, w, h);
  drawBackground();
  drawTank();

  bullets.forEach((b, i) => {
    b.y += b.dy;
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
    ctx.fill();
    if (b.y < 0) bullets.splice(i, 1);
  });

  ufoBullets.forEach((b, i) => {
    b.y += b.dy;
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
    ctx.fill();
    if (Math.abs(b.x - tank.x) < 30 && Math.abs(b.y - tank.y) < 30) {
      hp--;
      hitSound.currentTime = 0;
      hitSound.play();
      ufoBullets.splice(i, 1);
    } else if (b.y > h) ufoBullets.splice(i, 1);
  });

  ufos.forEach((u, i) => {
    u.x += u.dx;
    u.y += u.speed;
    if (u.x < 30 || u.x > w - 30) u.dx *= -1;

    let gradient = ctx.createRadialGradient(u.x, u.y, 10, u.x, u.y, 30);
    gradient.addColorStop(0, 'white');
    gradient.addColorStop(1, u.color);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(u.x, u.y, 35, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(u.x, u.y - 12, 15, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(173,216,230,0.7)';
    ctx.fill(); ctx.strokeStyle = 'white'; ctx.stroke();

    for (let j = -20; j <= 20; j += 10) {
      ctx.beginPath();
      ctx.arc(u.x + j, u.y + 10, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = Math.random() > 0.5 ? 'yellow' : 'lime';
      ctx.fill();
    }

    bullets.forEach((b, j) => {
      if (Math.abs(b.x - u.x) < 30 && Math.abs(b.y - u.y) < 20) {
        bullets.splice(j, 1);
        u.hp--;
        if (u.hp <= 0) {
          ufos.splice(i, 1);
          score++;
          explosionSound.currentTime = 0;
          explosionSound.play();
        }
      }
    });

    if (u.y > h - 100) {
      ufos.splice(i, 1);
      hp--;
      explosionSound.currentTime = 0;
      explosionSound.play();
    }
  });

  drawHUD();

  if (hp <= 0) {
    gameOver = true;
    showGameOver();
  } else {
    requestAnimationFrame(update);
  }
}

function showGameOver() {
  clearInterval(ufoInterval);
  clearInterval(shootInterval);
  bgMusic.pause();
  document.getElementById("gameover").style.display = "flex";
  document.getElementById("finalScore").innerText = "Wynik: " + score;
  const best = Math.max(score, localStorage.getItem("bestScore") || 0);
  localStorage.setItem("bestScore", best);
  document.getElementById("bestScore").innerText = "Najlepszy wynik: " + best;
}

function restart() {
  document.getElementById("menu").style.display = "flex";
  document.getElementById("gameover").style.display = "none";
}

window.addEventListener("mousemove", e => tank.x = e.clientX);
window.addEventListener("touchmove", e => {
  if (e.touches.length > 0) tank.x = e.touches[0].clientX;
});
window.addEventListener("click", shoot);
window.addEventListener("touchstart", shoot);

function shoot() {
  if (!gameStarted || gameOver) return;
  bullets.push({ x: tank.x, y: tank.y - barrelLength, dy: -6 });
  shootSound.currentTime = 0;
  shootSound.play();
}
