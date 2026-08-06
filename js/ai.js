/* ai.js — tiny cute minimax AI with alpha-beta pruning + piece-square tables */
"use strict";

const PIECE_VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

// piece-square tables, indexed a8..h1 (r*8+c), from WHITE's perspective
const PST = {
  p: [
     0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
     5,  5, 10, 25, 25, 10,  5,  5,
     0,  0,  0, 20, 20,  0,  0,  0,
     5, -5,-10,  0,  0,-10, -5,  5,
     5, 10, 10,-20,-20, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0
  ],
  n: [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50
  ],
  b: [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -20,-10,-10,-10,-10,-10,-10,-20
  ],
  r: [
     0,  0,  0,  0,  0,  0,  0,  0,
     5, 10, 10, 10, 10, 10, 10,  5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
     0,  0,  0,  5,  5,  0,  0,  0
  ],
  q: [
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5,  5,  5,  5,  0,-10,
     -5,  0,  5,  5,  5,  5,  0, -5,
      0,  0,  5,  5,  5,  5,  0, -5,
    -10,  5,  5,  5,  5,  5,  0,-10,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20
  ],
  k: [
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -10,-20,-20,-20,-20,-20,-20,-10,
     20, 20,  0,  0,  0,  0, 20, 20,
     20, 30, 10,  0,  0, 10, 30, 20
  ]
};

function evalBoard(board) {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      const t = p.toLowerCase();
      const white = pieceColor(p) === "w";
      const idx = white ? r * 8 + c : (7 - r) * 8 + c;
      const v = PIECE_VAL[t] + (PST[t] ? PST[t][idx] : 0);
      score += white ? v : -v;
    }
  }
  return score;
}

function orderMoves(state, moves) {
  const b = state.board;
  moves.sort((a, z) => {
    let sa = 0, sz = 0;
    if (a.cap) sa += 10 * PIECE_VAL[b[a.tr][a.tc].toLowerCase()] - PIECE_VAL[b[a.fr][a.fc].toLowerCase()];
    if (z.cap) sz += 10 * PIECE_VAL[b[z.tr][z.tc].toLowerCase()] - PIECE_VAL[b[z.fr][z.fc].toLowerCase()];
    if (a.promo) sa += 800;
    if (z.promo) sz += 800;
    return sz - sa;
  });
  return moves;
}

const MATE = 100000;

function negamax(state, depth, alpha, beta) {
  const legal = legalMoves(state);
  if (legal.length === 0) {
    return kingInCheck(state.board, state.turn) ? -(MATE - depth) : 0;
  }
  if (state.halfmove >= 100) return 0;
  if (depth === 0) {
    const e = evalBoard(state.board);
    return state.turn === "w" ? e : -e;
  }
  orderMoves(state, legal);
  let best = -Infinity;
  for (const m of legal) {
    const v = -negamax(applyMove(state, m), depth - 1, -beta, -alpha);
    if (v > best) best = v;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

function chooseAIMove(state, depth) {
  const legal = legalMoves(state);
  if (legal.length === 0) return null;
  orderMoves(state, legal);
  let best = null;
  let bestScore = -Infinity;
  for (const m of legal) {
    let v;
    try { v = -negamax(applyMove(state, m), depth - 1, -Infinity, Infinity); }
    catch(e) { continue; } // skip moves that cause errors
    if (v > bestScore + 0.0001) {
      bestScore = v;
      best = [m];
    } else if (Math.abs(v - bestScore) < 0.0001) {
      best.push(m);
    }
  }
  if (!best || best.length === 0) return legal[0] || null;
  return best[Math.floor(Math.random() * best.length)];
}
