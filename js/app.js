/* app.js — Chessy: a cute, self-contained chess game */
"use strict";

/* ---------- piece glyphs ---------- */
const GLYPH = {
  K:"\u2654", Q:"\u2655", R:"\u2656", B:"\u2657", N:"\u2658", P:"\u2659",
  k:"\u265A", q:"\u265B", r:"\u265C", b:"\u265D", n:"\u265E", p:"\u265F"
};
const glyph = (p) => (p ? GLYPH[p] : "");

/* ---------- WebAudio sounds ---------- */
let audioCtx = null;
function blip(freq, dur, type = "sine", gain = 0.10) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(gain, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur);
  } catch (e) { /* no audio */ }
}
const sMove    = () => blip(520, 0.08, "sine", 0.09);
const sCapture = () => { blip(700, 0.07, "triangle", 0.09); blip(460, 0.09, "sine", 0.07); };
const sWin     = () => [523,659,784].forEach((f,i) => setTimeout(() => blip(f,0.2,"triangle",0.12), i*130));
const sHint    = () => blip(880, 0.1, "sine", 0.08);

/* ---------- DOM ---------- */
const boardEl     = document.getElementById("board");
const bannerEl    = document.getElementById("banner");
const turnEl      = document.getElementById("turn");
const moveListEl  = document.getElementById("moveList");
const capWhiteEl  = document.getElementById("capWhite");
const capBlackEl  = document.getElementById("capBlack");
const vsAIEl      = document.getElementById("vsAI");
const levelEl     = document.getElementById("level");
const promoModal  = document.getElementById("promoModal");
const promoChoices= document.getElementById("promoChoices");
const undoBtn     = document.getElementById("undo");
const newGameBtn  = document.getElementById("newGame");
const hintBtn     = document.getElementById("hint");

/* ---------- game state ---------- */
let state = null;
let preStates = [];
let movesPlayed = [];   // {san, cap, ai}
let selected = null;    // {r,c}
let legalTargets = null;
let lastMove = null;    // {fr,fc,tr,tc}
let pendingPromo = null;
let thinking = false;
let hintMove = null;

const squareOf = (r, c) => boardEl.querySelector(`.sq[data-r="${r}"][data-c="${c}"]`);

/* ---------- board build ---------- */
function buildBoard() {
  boardEl.innerHTML = "";
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const sq = document.createElement("div");
      sq.className = "sq " + ((r + c) % 2 === 0 ? "light" : "dark");
      sq.dataset.r = r; sq.dataset.c = c;
      if (c === 0) { const lab = document.createElement("span"); lab.className = "coord rank"; lab.textContent = 8 - r; sq.appendChild(lab); }
      if (r === 7) { const lab = document.createElement("span"); lab.className = "coord file"; lab.textContent = "abcdefgh"[c]; sq.appendChild(lab); }
      const piece = document.createElement("span");
      piece.className = "piece";
      sq.appendChild(piece);
      sq.addEventListener("click", () => onSquareClick(r, c));
      boardEl.appendChild(sq);
    }
  }
}

/* ---------- rendering ---------- */
function render() {
  const st = getStatus(state);

  // update squares
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const sq = squareOf(r, c);
      sq.className = "sq " + ((r + c) % 2 === 0 ? "light" : "dark");
      const p = state.board[r][c];
      const span = sq.querySelector(".piece");
      span.textContent = glyph(p);
      span.className = "piece" + (p ? " " + pieceColor(p) : "");
    }
  }

  // selection highlight
  if (selected) squareOf(selected.r, selected.c).classList.add("selected");

  // legal targets
  if (legalTargets) {
    for (const m of legalTargets) {
      squareOf(m.tr, m.tc).classList.add(state.board[m.tr][m.tc] ? "move-capture" : "move-dot");
    }
  }

  // last move
  if (lastMove) {
    squareOf(lastMove.fr, lastMove.fc).classList.add("last");
    squareOf(lastMove.tr, lastMove.tc).classList.add("last");
  }

  // hint
  if (hintMove) {
    squareOf(hintMove.fr, hintMove.fc).classList.add("hint-src");
    squareOf(hintMove.tr, hintMove.tc).classList.add("hint-dst");
  }

  // check pulse on king
  if (st.check) {
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const p = state.board[r][c];
      if (p && pieceColor(p) === state.turn && p.toLowerCase() === "k") {
        squareOf(r, c).classList.add("check");
      }
    }
  }

  // banner & turn label
  if (st.over) {
    bannerEl.textContent = st.text;
    bannerEl.classList.remove("hidden");
    turnEl.textContent = "Game over";
    turnEl.classList.remove("check-text");
  } else {
    bannerEl.classList.add("hidden");
    turnEl.textContent = (state.turn === "w" ? "White" : "Black") + " to move";
    turnEl.classList.toggle("check-text", !!st.check);
  }

  renderMoves();
  renderCaptured();
}

function renderMoves() {
  moveListEl.innerHTML = "";
  movesPlayed.forEach((m, i) => {
    if (i % 2 === 0) {
      const li = document.createElement("li");
      li.className = "n";
      li.textContent = Math.floor(i / 2) + 1 + ".";
      moveListEl.appendChild(li);
    }
    const li = document.createElement("li");
    li.className = "m";
    li.textContent = m.san;
    moveListEl.appendChild(li);
  });
  moveListEl.scrollTop = moveListEl.scrollHeight;
}

function renderCaptured() {
  let whiteTook = [], blackTook = [];
  for (const m of movesPlayed) {
    if (!m.cap) continue;
    if (pieceColor(m.cap) === "w") blackTook.push(m.cap);
    else whiteTook.push(m.cap);
  }
  capWhiteEl.innerHTML = whiteTook.map(p => '<span>' + glyph(p) + "</span>").join("");
  capBlackEl.innerHTML = blackTook.map(p => '<span>' + glyph(p) + "</span>").join("");
}

/* ---------- interactions ---------- */
function onSquareClick(r, c) {
  if (thinking || !state || getStatus(state).over) return;
  if (pendingPromo) return;
  const vsAI = vsAIEl.checked;
  if (vsAI && state.turn !== "w") return;

  const p = state.board[r][c];
  const legal = legalMoves(state);

  // clicking a legal target of selected piece -> move
  if (selected) {
    const m = legalTargets && legalTargets.find((mm) => mm.tr === r && mm.tc === c);
    if (m) {
      if (m.promo) {
        pendingPromo = m;
        selected = null; legalTargets = null;
        openPromo(state.turn);
      } else {
        playMove(m, false);
      }
      return;
    }
  }

  // select own piece
  if (p && pieceColor(p) === state.turn) {
    selected = { r, c };
    legalTargets = legal.filter((mm) => mm.fr === r && mm.fc === c);
  } else {
    selected = null; legalTargets = null;
  }
  render();
}

function playMove(m, ai) {
  const san = moveToSAN(state, m);
  const captured = state.board[m.tr][m.tc] || (m.ep ? (state.turn === "w" ? "p" : "P") : null);
  preStates.push(cloneState(state));
  state = applyMove(state, m);
  movesPlayed.push({ san, cap: captured, ai });
  lastMove = { fr: m.fr, fc: m.fc, tr: m.tr, tc: m.tc };
  selected = null; legalTargets = null; hintMove = null; pendingPromo = null;

  if (captured) sCapture(); else sMove();

  render();
  if (getStatus(state).over && getStatus(state).result === "checkmate") sWin();
  scheduleAI();
}

function scheduleAI() {
  if (getStatus(state).over) return;
  if (vsAIEl.checked && state.turn !== "w") {
    thinking = true;
    turnEl.textContent = "Computer thinking\u2026";
    setTimeout(() => {
      const m = chooseAIMove(state, parseInt(levelEl.value, 10) || 2);
      thinking = false;
      if (m) playMove(m, true);
      else render();
    }, 380);
  }
}

/* ---------- promotion modal ---------- */
function openPromo(color) {
  const letters = color === "w" ? ["Q", "R", "B", "N"] : ["q", "r", "b", "n"];
  promoChoices.innerHTML = "";
  for (const ch of letters) {
    const btn = document.createElement("div");
    btn.className = "promo-choice " + color;
    btn.textContent = glyph(ch);
    btn.addEventListener("click", () => {
      pendingPromo.promo = ch;
      const m = pendingPromo;
      pendingPromo = null;
      closePromo();
      playMove(m, false);
    });
    promoChoices.appendChild(btn);
  }
  promoModal.classList.remove("hidden");
}
function closePromo() { promoModal.classList.add("hidden"); }

/* ---------- controls ---------- */
function newGame() {
  state = initialState();
  preStates = [];
  movesPlayed = [];
  selected = null; legalTargets = null; lastMove = null;
  pendingPromo = null; thinking = false; hintMove = null;
  closePromo();
  render();
}

function undoMove() {
  if (!preStates.length || thinking) return;
  const vsAI = vsAIEl.checked;
  let pops = vsAI ? 2 : 1;
  // Don't pop more than available
  pops = Math.min(pops, preStates.length);
  while (pops-- > 0) {
    state = preStates.pop();
    movesPlayed.pop();
  }
  selected = null; legalTargets = null; lastMove = null;
  pendingPromo = null; hintMove = null; thinking = false;
  render();
}

function hint() {
  if (getStatus(state).over || thinking) return;
  if (vsAIEl.checked && state.turn !== "w") return;
  const m = chooseAIMove(state, 2);
  if (m) { hintMove = { fr: m.fr, fc: m.fc, tr: m.tr, tc: m.tc }; sHint(); render(); }
}

/* ---------- boot ---------- */
newGameBtn.addEventListener("click", newGame);
undoBtn.addEventListener("click", undoMove);
hintBtn.addEventListener("click", hint);
buildBoard();
newGame();
