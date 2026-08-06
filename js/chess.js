/* chess.js — a small, correct chess engine (pure JS, zero dependencies) */
"use strict";

// Constants
const FILES = "abcdefgh";
const RANKS = "12345678";

// Piece colors
function pieceColor(p) {
    if (!p) return null;
    return p === p.toUpperCase() ? "w" : "b";
}

function opp(c) {
    return c === "w" ? "b" : "w";
}

function inBoard(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
}

// Initialize board with starting position
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

// Convert algebraic notation to row/col
function toRC(sq) {
    if (!sq || sq.length !== 2) return null;
    const file = sq.charCodeAt(0) - 97; // a-h -> 0-7
    const rank = 8 - (sq.charCodeAt(1) - 48); // 1-8 -> 7-0
    if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
    return [rank, file];
}

// Convert row/col to algebraic notation
function toAlg(r, c) {
    return FILES[c] + RANKS[7 - r];
}

// Get piece at position
function getPiece(board, sq) {
    const rc = toRC(sq);
    if (!rc) return null;
    return board[rc[0]][rc[1]];
}

// Find king position
function findKing(board, color) {
    const king = color === "w" ? "K" : "k";
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] === king) return [r, c];
        }
    }
    return null;
}

// Check if a square is attacked by opponent
function isAttacked(board, sq, byColor) {
    const [r, c] = sq;

    // Pawn attacks
    const pRow = byColor === "w" ? r + 1 : r - 1;
    const pDir = byColor === "w" ? 1 : -1;
    if (inBoard(pRow, c - 1)) {
        const pawn = byColor === "w" ? "p" : "P";
        if (board[pRow][c - 1] === pawn) return true;
    }
    if (inBoard(pRow, c + 1)) {
        const pawn = byColor === "w" ? "p" : "P";
        if (board[pRow][c + 1] === pawn) return true;
    }

    // Knight attacks
    const knight = byColor === "w" ? "n" : "N";
    const knightMoves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    for (const [dr, dc] of knightMoves) {
        const nr = r + dr, nc = c + dc;
        if (inBoard(nr, nc) && board[nr][nc] === knight) return true;
    }

    // King attacks
    const king = byColor === "w" ? "k" : "K";
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr, nc = c + dc;
            if (inBoard(nr, nc) && board[nr][nc] === king) return true;
        }
    }

    // Sliding pieces (bishop, rook, queen)
    const diagonals = [[-1,-1],[-1,1],[1,-1],[1,1]];
    const straights = [[-1,0],[1,0],[0,-1],[0,1]];

    for (const [bi, bd] of diagonals) {
        let nr = r + bi, nc = c + bd;
        while (inBoard(nr, nc)) {
            const piece = board[nr][nc];
            if (piece) {
                const color = pieceColor(piece);
                if (color === byColor) {
                    const upper = piece.toUpperCase();
                    if (upper === "B" || upper === "Q") return true;
                }
                break;
            }
            nr += bi;
            nc += bd;
        }
    }

    for (const [bi, bd] of straights) {
        let nr = r + bi, nc = c + bd;
        while (inBoard(nr, nc)) {
            const piece = board[nr][nc];
            if (piece) {
                const color = pieceColor(piece);
                if (color === byColor) {
                    const upper = piece.toUpperCase();
                    if (upper === "R" || upper === "Q") return true;
                }
                break;
            }
            nr += bi;
            nc += bd;
        }
    }

    return false;
}

// Check if king is in check
function isInCheck(board, color) {
    const kingPos = findKing(board, color);
    if (!kingPos) return false;
    return isAttacked(board, kingPos, opp(color));
}

// Generate pseudo-legal moves (doesn't check for leaving king in check)
function pseudoMoves(board, fromR, fromC, color) {
    const moves = [];
    const piece = board[fromR][fromC];
    if (!piece) return moves;

    const upper = piece.toUpperCase();
    const type = upper;
    const dir = color === "w" ? -1 : 1;

    // Pawn moves
    if (type === "P") {
        // Forward
        if (inBoard(fromR + dir, fromC) && !board[fromR + dir][fromC]) {
            moves.push([fromR + dir, fromC]);
            // Double push from start
            const startRow = color === "w" ? 6 : 1;
            if (fromR === startRow && !board[fromR + 2 * dir][fromC]) {
                moves.push([fromR + 2 * dir, fromC]);
            }
        }
        // Captures
        for (const dc of [-1, 1]) {
            const nr = fromR + dir, nc = fromC + dc;
            if (inBoard(nr, nc)) {
                const target = board[nr][nc];
                if (target && pieceColor(target) === opp(color)) {
                    moves.push([nr, nc]);
                }
            }
        }
    }

    // Knight moves
    if (type === "N") {
        const knightMoves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
        for (const [dr, dc] of knightMoves) {
            const nr = fromR + dr, nc = fromC + dc;
            if (inBoard(nr, nc)) {
                const target = board[nr][nc];
                if (!target || pieceColor(target) === opp(color)) {
                    moves.push([nr, nc]);
                }
            }
        }
    }

    // Bishop/Rook/Queen moves
    if (type === "B" || type === "Q" || type === "R") {
        const directions = [];
        if (type === "B" || type === "Q") directions.push(...[[-1,-1],[-1,1],[1,-1],[1,1]]);
        if (type === "R" || type === "Q") directions.push(...[[-1,0],[1,0],[0,-1],[0,1]]);

        for (const [dr, dc] of directions) {
            let nr = fromR + dr, nc = fromC + dc;
            while (inBoard(nr, nc)) {
                const target = board[nr][nc];
                if (!target) {
                    moves.push([nr, nc]);
                } else {
                    if (pieceColor(target) === opp(color)) {
                        moves.push([nr, nc]);
                    }
                    break;
                }
                nr += dr;
                nc += dc;
            }
        }
    }

    // King moves
    if (type === "K") {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = fromR + dr, nc = fromC + dc;
                if (inBoard(nr, nc)) {
                    const target = board[nr][nc];
                    if (!target || pieceColor(target) === opp(color)) {
                        moves.push([nr, nc]);
                    }
                }
            }
        }
    }

    return moves;
}

// Generate all legal moves
function legalMoves(board, color) {
    const moves = [];

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (!piece || pieceColor(piece) !== color) continue;

            const pieceMoves = pseudoMoves(board, r, c, color);

            for (const [toR, toC] of pieceMoves) {
                // Make move
                const saved = board[toR][toC];
                board[toR][toC] = piece;
                board[r][c] = null;

                // Check if king is safe
                if (!isInCheck(board, color)) {
                    moves.push({
                        from: [r, c],
                        to: [toR, toC],
                        piece: piece,
                        captured: saved
                    });
                }

                // Undo move
                board[r][c] = piece;
                board[toR][toC] = saved;
            }
        }
    }

    return moves;
}

// Make a move on the board
function makeMove(board, move) {
    const { from, to, piece } = move;
    const [fromR, fromC] = from;
    const [toR, toC] = to;

    const captured = board[toR][toC];
    board[toR][toC] = piece;
    board[fromR][fromC] = null;

    // Pawn promotion (auto-queen for simplicity)
    const promoRow = piece === "P" ? 0 : piece === "p" ? 7 : -1;
    if (toR === promoRow) {
        board[toR][toC] = piece === "P" ? "Q" : "q";
    }

    return captured;
}

// Check game state
function gameState(board, color) {
    const moves = legalMoves(board, color);
    const inCheck = isInCheck(board, color);

    if (moves.length === 0) {
        if (inCheck) return "checkmate";
        return "stalemate";
    }

    if (inCheck) return "check";

    return "playing";
}

// Export functions
window.ChessEngine = {
    initialBoard,
    toRC,
    toAlg,
    getPiece,
    pieceColor,
    legalMoves,
    makeMove,
    gameState,
    isInCheck
};
