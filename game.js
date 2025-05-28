export let words     = [];
export let score     = 0;
export let lives     = 3;
export let gameOver  = false;
export let isFrozen  = false;
export let paused    = false;

let canvas, ctx;
let baseSpeed          = 0.5;
let spawnInterval      = 2000;
let lastSpawnTime      = Date.now();
let spawnSpeedStart    = Date.now();
const speedDecreaseDur = 2 * 60 * 1000;  // 2 минуты
const minSpawnInterval = 300;            // 0.3 сек
const maxWordsOnScreen = 5;

const explosionSound = new Audio('sounds/explosion.mp3');
explosionSound.volume = 0.5;

const specialTypes = ['red','blue','green','cyan','purple','gold'];
const wordsSimple = [
  'cat','dog','sun','star','tree',
  'book','love','rain','fire','time',
  'water','smile','happy','light','music',
  'beach','cloud','grass','heart','dance'
];

const wordsNormal = [
  'hello','bright','example','silence','picture',
  'student','library','natural','holiday','meeting',
  'adventure','computer','keyboard','notebook','elephant',
  'umbrella','chocolate','pineapple','beautiful','newspaper'
];

const wordsHard = [
  'programming','multithreaded','sophisticated','communication','international',
  'transportation','administration','responsibility','environmental','classification',
  'infrastructure','characteristic','implementation','representation','mathematics',
  'relationship','congratulations','understanding','philosophical','microprocessor'
];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randOneOrTwoDigit() {
  return Math.random() < 0.5 ? randInt(1, 9) : randInt(10, 99);
}

export function initGame(cnv) {
  canvas = cnv;
  ctx    = canvas.getContext('2d');
  canvas.width  = 400;
  canvas.height = 600;
}

class Word {
  constructor(text, speed, type = null, isExpr = false, answer = null) {
    this.text       = text;
    this.x          = Math.random() * (canvas.width - 100);
    this.y          = 0;
    this.speed      = speed;
    this.type       = type;
    this.isExpr     = isExpr;
    this.answer     = answer;

    ctx.font   = '20px Arial';
    this.width = ctx.measureText(this.text).width;

    switch(type) {
      case 'red':    this.color = 'red';    this.multiplier = 1;  break;
      case 'blue':   this.color = 'blue';   this.multiplier = 1;  break;
      case 'green':  this.color = 'green';  this.multiplier = 1;  break;
      case 'cyan':   this.color = 'cyan';   this.multiplier = 1;  break;
      case 'purple': this.color = 'purple'; this.multiplier = 1;  break;
      case 'gold':   this.color = 'gold';   this.multiplier = 10; break;
      default:       this.color = 'black';  this.multiplier = 1;
    }
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.font      = '20px Arial';
    ctx.fillText(this.text, this.x, this.y);
  }

  update() {
    if (isFrozen || paused) return;
    this.y += this.speed;
    if (this.y > canvas.height) {
      lives--;
      words.splice(words.indexOf(this), 1);
    }
  }
}

function applyEffect(type) {
  switch(type) {
    case 'red':
      explosionSound.currentTime = 0;
      explosionSound.play();
      const num = words.length;
      window.dispatchEvent(new CustomEvent('explosion', { detail: { count: num } }));
      words = [];
      break;
    case 'blue':   freezeAll();      break;
    case 'green':  lives++;          break;
    case 'cyan':   slowDown();       break;
    case 'purple': replaceAllWords();break;
    case 'gold':   break;
  }
}

export function clearAll() {
  words = [];
}
export function freezeAll() {
  isFrozen = true;
  setTimeout(() => { isFrozen = false; }, 6000);
}

function slowDown() {
  baseSpeed *= 0.85;
  words.forEach(w => w.speed *= 0.85);
}

function replaceAllWords() {
  words.forEach(w => {
    let pool = w.text.length <= 5
      ? wordsSimple
      : w.text.length <= 10
        ? wordsNormal
        : wordsHard;

    const newText = pick(pool);

    w.text = newText;
    ctx.font = '20px Arial';
    w.width = ctx.measureText(newText).width;

    w.speed = newText.length <= 5
      ? baseSpeed
      : newText.length <= 10
        ? baseSpeed * 1.5
        : baseSpeed * 2;

    const newType     = pick(specialTypes);
    w.type           = newType;
    w.color          = newType;
    w.multiplier     = (newType === 'gold')
                      ? 10 
                      : 1;
  });
}


export function gameLoop() {
  if (gameOver) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const t = Date.now() - spawnSpeedStart;
  if (t < speedDecreaseDur) {
    const p = t / speedDecreaseDur;
    spawnInterval = Math.max(minSpawnInterval, 2000 - p * 1700);
  }

  let pool;
  if (t < 20000)       pool = wordsSimple;
  else if (t < 50000)  pool = wordsNormal;
  else if (t < 70000)  pool = wordsHard;
  else                 pool = [...wordsSimple, ...wordsNormal, ...wordsHard];

  if (!paused && Date.now() - lastSpawnTime > spawnInterval && words.length < maxWordsOnScreen) {
    let w;
    if (Math.random() < 0.2) {
      const isAdd = Math.random() < 0.5;
      let a = randOneOrTwoDigit();
      let b = randOneOrTwoDigit();
      if (!isAdd && a > 9 && b > 9) {
        if (Math.random() < 0.5) a = randInt(1,9);
        else                   b = randInt(1,9);
      }
      const text   = isAdd ? `${a}+${b}` : `${a}*${b}`;
      const answer = isAdd ? a + b : a * b;
      const spd    = baseSpeed;
      const type   = Math.random() < 0.2 ? specialTypes[Math.floor(Math.random()*specialTypes.length)] : null;
      w = new Word(text, spd, type, true, answer);
    } else {
      let txt = pool[Math.floor(Math.random()*pool.length)];
      while (words.some(x => x.text === txt)) {
        txt = pool[Math.floor(Math.random()*pool.length)];
      }
      const spd  = txt.length <= 5 ? baseSpeed
                 : txt.length <= 10 ? baseSpeed * 1.5
                 : baseSpeed * 2;
      const type = Math.random() < 0.2 ? specialTypes[Math.floor(Math.random()*specialTypes.length)] : null;
      w = new Word(txt, spd, type, false, null);
    }
    words.push(w);
    lastSpawnTime = Date.now();
  }

  words.forEach(w => { w.update(); w.draw(); });

  if (lives <= 0) {
    gameOver = true;
    window.dispatchEvent(new Event('gameover'));
    return;
  }
  requestAnimationFrame(gameLoop);
}

export function resetGame() {
  words = [];
  score = 0;
  lives = 5;
  gameOver = false;
  isFrozen = false;
  paused = false;
  baseSpeed = 0.5;
  spawnInterval = 2000;
  lastSpawnTime = Date.now();
  spawnSpeedStart = Date.now();
}

export function tryMatch(input) {
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const wordMatch = w.text.toLowerCase() === input.toLowerCase();
    const exprMatch = w.isExpr && input === String(w.answer);
    if (wordMatch || exprMatch) {
      if (w.type === 'red') {
        window.dispatchEvent(new CustomEvent('trigger-explosion', {
          detail: { x: w.x + w.width/2, y: w.y }
        }));
      }
      score += w.text.length * w.multiplier;
      if (w.type) applyEffect(w.type);
      words.splice(i, 1);
      return true;
    }
  }
  return false;
}

export function setPaused(val) {
  paused = val;
}
