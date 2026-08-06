/* chess.js — a small, correct chess engine (pure JS, zero dependencies) */
"use strict";

const FILES = "abcdefgh";

function pieceColor(p) {
  if (!p) return null;
  return p === p.toUpperCase() ? "w" : "b";
}
function opp(c) { return c === "w" ? "b" : "w"; }
function inBoard(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

function initialBoard() {
  const back = "rnbqkbnr".split("");
  const b = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let c = 0; c < 8; c++) {
    b[0][c] = back[c];
    b[1][c] = "p";
    b[6][c] = "P";
    b[7][c] = back[c].toUpperCase();
  }
  return b;
}

function cloneState(s) {
  return {
    board: s.board.map((row) => row.slice()),
    turn: s.turn,
    castling: { ...s.castling },
    ep: s.ep ? { ...s.ep } : null,
    halfmove: s.halfmove,
    fullmove: s.fullmove,
  };
}

function mk(fr, fc, tr, tc, promo, cap) {
  return {
    fr, fc, tr, tc,
    promo: promo || null,
    cap: cap || null,
    ep: false,
    castle: null,
  };
}

function genPseudo(state) {
  const moves = [];
  const { board, turn } = state;
  const c = turn, o = opp(turn);
  const dir = c === "w" ? -1 : 1;

  for (let r = 0; r < 8; r++) {
    for (let cc = 0; cc < 8; cc++) {
      const p = board[r][cc];
      if (!p || pieceColor(p) !== c) continue;
      const t = p.toLowerCase();

      if (t === "p") {
        const startRow = c === "w" ? 6 : 1;
        const lastRow = c === "w" ? 0 : 7;
        const nr = r + dir;
        const promoLet = c === "w" ? "Q" : "q";
        if (inBoard(nr, cc) && !board[nr][cc]) {
          moves.push(mk(r, cc, nr, cc, nr === lastRow ? promoLet : null, null));
          if (r === startRow && !board[r + dir * 2][cc]) {
            moves.push(mk(r, cc, r + dir * 2, cc, null, null));
          }
        }
        for (const dc of [-1, 1]) {
          const nc = cc + dc;
          const nr = r + dir;
          if (!inBoard(nr, nc)) continue;
          if (board[nr][nc]) {
            if (pieceColor(board[nr][nc]) === o) {
              moves.push(mk(r, cc, nr, nc, nr === lastRow ? promoLet : null, null));
            }
          } else if (state.ep && state.ep.r === nr && state.ep.c === nc) {
            const m = mk(r, cc, nr, nc, null, null);
            m.ep = true;
            moves.push(m);
          }
        }
      } else if (t === "n") {
        for (const [dr, dc] of [[-2,-1],[-2,1],[2,-1],[2,1],[-1,-2],[-1,2],[1,-2],[1,2]]) {
          const nr = r + dr, nc = cc + dc;
          if (inBoard(nr, nc) && pieceColor(board[nr][nc]) !== c) {
            moves.push(mk(r, cc, nr, nc, false, null));
          }
        }
      } else if (t === "b" || t === "r" || t === "q") {
        const dirs = t === "b" ? [[-1,-1],[-1,1],[1,-1],[1,1]]
          : t === "r" ? [[-1,0],[1,0],[0,-1],[0,1]]
          : [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]];
        for (const [dr, dc] of dirs) {
          let nr = r + dr, nc = cc + dc;
          while (inBoard(nr, nc)) {
            const tgt = board[nr][nc];
            if (!tgt) { moves.push(mk(r, cc, nr, nc, false, null)); }
            else {
              if (pieceColor(tgt) === o) moves.push(mk(r, cc, nr, nc, false, null));
              break;
            }
            nr += dr; nc += dc;
          }
        }
      } else if (t === "k") {
        for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
          const nr = r + dr, nc = cc + dc;
          if (inBoard(nr, nc) && pieceColor(board[nr][nc]) !== c) {
            moves.push(mk(r, cc, nr, nc, false, null));
          }
        }
        const rank = c === "w" ? 7 : 0;
        const kKey = c === "w" ? "K" : "k";
        const qKey = c === "w" ? "Q" : "q";
        if (state.castling[kKey] &&
            board[rank][5] === null && board[rank][6] === null &&
            board[rank][7] && pieceColor(board[rank][7]) === c &&
            !sqAttacked(state, rank, 4, opp(c)) &&
            !sqAttacked(state, rank, 5, opp(c)) &&
            !sqAttacked(state, rank, 6, opp(c))) {
          const m = mk(rank, 4, rank, 6, false, null);
          m.castle = kKey; moves.push(m);
        }
        if (state.castling[qKey] &&
            board[rank][3] === null && board[rank][2] === null && board[rank][1] === null &&
            board[rank][0] && pieceColor(board[rank][0]) === c &&
            !sqAttacked(state, rank, 4, opp(c)) &&
            !sqAttacked(state, rank, 3, opp(c)) &&
            !sqAttacked(state, rank, 2, opp(c))) {
          const m = mk(rank, 4, rank, 2, false, null);
          m.castle = qKey; moves.push(m);
        }
      }
    }
  }
  return moves;
}

function sqAttacked(state, r, c, byColor) {
  const b = state.board;
  const pd = byColor === "w" ? -1 : 1;
  const pr = r - pd;
  if (inBoard(pr, c - 1) && b[pr][c - 1] && b[pr][c - 1].toLowerCase() === "p" && pieceColor(b[pr][c - 1]) === byColor) return true;
  if (inBoard(pr, c + 1) && b[pr][c + 1] && b[pr][c + 1].toLowerCase() === "p" && pieceColor(b[pr][c + 1]) === byColor) return true;
  for (const [dr, dc] of [[-2,-1],[-2,1],[2,-1],[2,1],[-1,-2],[-1,2],[1,-2],[1,2]]) {
    const nr = r + dr, nc = c + dc;
    if (inBoard(nr, nc) && b[nr][nc] && b[nr][nc].toLowerCase() === "n" && pieceColor(b[nr][nc]) === byColor) return true;
  }
  if (scanRay(state, r, c, byColor, [[-1,0],[1,0],[0,-1],[0,1]], ["r", "q"])) return true;
  if (scanRay(state, r, c, byColor, [[-1,-1],[-1,1],[1,-1],[1,1]], ["b", "q"])) return true;
  for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
    const nr = r + dr, nc = c + dc;
    if (inBoard(nr, nc) && b[nr][nc] && b[nr][nc].toLowerCase() === "k" && pieceColor(b[nr][nc]) === byColor) return true;
  }
  return false;
}

function scanRay(state, r, c, byColor, dirs, kinds) {
  const b = state.board;
  for (const [dr, dc] of dirs) {
    let nr = r + dr, nc = c + dc;
    while (inBoard(nr, nc)) {
      const tgt = b[nr][nc];
      if (tgt) {
        if (pieceColor(tgt) === byColor && kinds.includes(tgt.toLowerCase())) return true;
        break;
      }
      nr += dr; nc += dc;
    }
  }
  return false;
}

function kingInCheck(board, color) {
  for (let rr = 0; rr < 8; rr++) {
    for (let cc = 0; cc < 8; cc++) {
      const p = board[rr][cc];
      if (p && pieceColor(p) === color && p.toLowerCase() === "k") {
        return sqAttacked({ board, turn: color }, rr, cc, opp(color));
      }
    }
  }
  return false;
}

function legalMoves(state) {
  return genPseudo(state).filter((m) => {
    const n = applyMove(state, m);
    return !kingInCheck(n.board, state.turn);
  });
}

function applyMove(state, m) {
  const s = cloneState(state);
  const b = s.board;
  const p = b[m.fr][m.fc];
  b[m.tr][m.tc] = m.promo || p;
  b[m.fr][m.fc] = null;

  if (m.ep && p.toLowerCase() === "p") {
    const epRow = m.tr + (state.turn === "w" ? 1 : -1);
    b[epRow][m.tc] = null;
  }
  if (m.castle) {
    if (m.castle === "K") { b[7][5] = b[7][7]; b[7][7] = null; }
    else if (m.castle === "Q") { b[7][3] = b[7][0]; b[7][0] = null; }
    else if (m.castle === "k") { b[0][5] = b[0][7]; b[0][7] = null; }
    else if (m.castle === "q") { b[0][3] = b[0][0]; b[0][0] = null; }
  }
  if (p.toLowerCase() === "k") {
    if (state.turn === "w") { s.castling.K = false; s.castling.Q = false; }
    else { s.castling.k = false; s.castling.q = false; }
  }
  if (m.fr === 7 && m.fc === 0) s.castling.Q = false;
  if (m.fr === 7 && m.fc === 7) s.castling.K = false;
  if (m.fr === 0 && m.fc === 0) s.castling.q = false;
  if (m.fr === 0 && m.fc === 7) s.castling.k = false;
  if (m.tr === 7 && m.tc === 0) s.castling.Q = false;
  if (m.tr === 7 && m.tc === 7) s.castling.K = false;
  if (m.tr === 0 && m.tc === 0) s.castling.q = false;
  if (m.tr === 0 && m.tc === 7) s.castling.k = false;
  s.ep = null;
  if (p.toLowerCase() === "p" && Math.abs(m.tr - m.fr) === 2) {
    s.ep = { r: (m.fr + m.tr) / 2, c: m.fc };
  }
  s.halfmove = (p.toLowerCase() === "p" || m.cap) ? 0 : state.halfmove + 1;
  s.turn = opp(state.turn);
  return s;
}

function insufficientMaterial(board) {
  const values = { p: 1, n: 3, b: 3, r: 5, q: 9 };
  let score = { w: 0, b: 0 };
  const bishopsColor = [];
  let minorCount = 0;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = board[r][c];
    if (!p || p.toLowerCase() === "k") continue;
    score[pieceColor(p)] += values[p.toLowerCase()];
    if (p.toLowerCase() === "b") bishopsColor.push((r + c) % 2);
    if (p.toLowerCase() !== "p") minorCount++;
  }
  if (score.w > 1 || score.b > 1) return false; // a rook/queen or 2 minors -> playable
  if (score.w > 0 && score.b > 0) return false;
  if (score.w === 0 && score.b === 0) return true;          // K vs K
  // one side has exactly one minor (score 3)
  if (score.w === 3 || score.b === 3) {
    if (bishopsColor.length === 2) return bishopsColor[0] === bishopsColor[1]; // same color bishops
    return true; // K+N vs K or K+B vs K
  }
  return false;
}

function getStatus(state) {
  const legal = legalMoves(state);
  const inCheck = kingInCheck(state.board, state.turn);
  if (legal.length === 0) {
    return {
      over: true,
      result: inCheck ? "checkmate" : "stalemate",
      winner: inCheck ? opp(state.turn) : null,
      text: inCheck ? "Checkmate! " + (opp(state.turn) === "w" ? "White wins" : "Black wins")
                    : "Stalemate \u2014 draw"
    };
  }
  if (state.halfmove >= 100) return { over: true, result: "fifty", winner: null, text: "Draw \u2014 50-move rule" };
  if (insufficientMaterial(state.board)) return { over: true, result: "material", winner: null, text: "Draw \u2014 insufficient material" };
  return { over: false, result: null, winner: null, check: inCheck, text: inCheck ? "Check!" : "" };
}

function moveToSAN(state, m) {
  const b = state.board;
  const p = b[m.fr][m.fc];
  const t = p.toLowerCase();
  const isCap = m.ep || !!state.board[m.tr][m.tc];
  let base = "";
  if (m.castle) {
    base = (m.castle === "K" || m.castle === "k") ? "O-O" : "O-O-O";
  } else {
    const tsq = FILES[m.tc] + (8 - m.tr);
    if (t === "p") {
      base = (isCap ? FILES[m.fc] + "x" : "") + tsq;
    } else {
      const letter = p.toUpperCase();
      let dis = "";
      const cands = legalMoves(state).filter((mm) =>
        !(mm.fr === m.fr && mm.fc === m.fc && mm.tr === m.tr && mm.tc === m.tc) &&
        mm.tr === m.tr && mm.tc === m.tc &&
        b[mm.fr][mm.fc] && b[mm.fr][mm.fc].toLowerCase() === t);
      if (cands.length) {
        const needCol = cands.some((mm) => mm.fc !== m.fc);
        const needRow = cands.some((mm) => mm.fr !== m.fr);
        if (needCol) dis = FILES[m.fc];
        else if (needRow) dis = String(8 - m.fr);
        else dis = FILES[m.fc];
      }
      base = letter + dis + (isCap ? "x" : "") + tsq;
    }
    if (m.promo) base += "=" + m.promo.toUpperCase();
  }
  const after = applyMove(state, m);
  if (kingInCheck(after.board, opp(state.turn))) {
    base += legalMoves(after).length === 0 ? "#" : "+";
  }
  return base;
}

function initialState() {
  return {
    board: initialBoard(),
    turn: "w",
    castling: { K: true, Q: true, k: true, q: true },
    ep: null,
    halfmove: 0,
    fullmove: 1,
  };
}
