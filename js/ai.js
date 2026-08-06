/* ai.js — tiny cute minimax AI with alpha-beta pruning */
"use strict";

// Piece values
const PIECE_VAL = {
    "P": 100, "N": 320, "B": 330, "R": 500, "Q": 900, "K": 20000,
    "p": -100, "n": -320, "b": -330, "r": -500, "q": -900, "k": -20000
};

// Piece-square tables for positional evaluation (from white's perspective)
const PST = {
    "P": [
        0,  0,  0,  0,  0,  0,  0,  0,
       50, 50, 50, 50, 50, 50, 50, 50,
       10, 10, 20, 30, 30, 20, 10, 10,
        5,  5, 10, 25, 25, 10,  5,  5,
        0,  0,  0, 20, 20,  0,  0,  0,
        5, -5,-10,  0,  0,-10, -5,  5,
        5, 10, 10,-20,-20, 10, 10,  5,
        0,  0,  0,  0,  0,  0,  0,  0
    ],
    "N": [
       -50,-40,-30,-30,-30,-30,-40,-50,
       -40,-20,  0,  0,  0,  0,-20,-40,
       -30,  0, 10, 15, 15, 10,  0,-30,
       -30,  5, 15, 20, 20, 15,  5,-30,
       -30,  0, 15, 20, 20, 15,  0,-30,
       -30,  5, 10, 15, 15, 10,  5,-30,
       -40,-20,  0,  5,  5,  0,-20,-40,
       -50,-40,-30,-30,-30,-30,-40,-50
    ],
    "B": [
       -20,-10,-10,-10,-10,-10,-10,-20,
       -10,  0,  0,  0,  0,  0,  0,-10,
       -10,  0,  5, 10, 10,  5,  0,-10,
       -10,  5,  5, 10, 10,  5,  5,-10,
       -10,  0, 10, 10, 10, 10,  0,-10,
       -10, 10, 10, 10, 10, 10, 10,-10,
       -10,  5,  0,  0,  0,  0,  5,-10,
       -20,-10,-10,-10,-10,-10,-10,-20
    ],
    "R": [
        0,  0,  0,  0,  0,  0,  0,  0,
        5, 10, 10, 10, 10, 10, 10,  5,
       -5,  0,  0,  0,  0,  0,  0, -5,
       -5,  0,  0,  0,  0,  0,  0, -5,
       -5,  0,  0,  0,  0,  0,  0, -5,
       -5,  0,  0,  0,  0,  0,  0, -5,
       -5,  0,  0,  0,  0,  0,  0, -5,
        0,  0,  0,  5,  5,  0,  0,  0
    ],
    "Q": [
       -20,-10,-10, -5, -5,-10,-10,-20,
       -10,  0,  0,  0,  0,  0,  0,-10,
       -10,  0,  5,  5,  5,  5,  0,-10,
        -5,  0,  5,  5,  5,  5,  0, -5,
         0,  0,  5,  5,  5,  5,  0, -5,
       -10,  5,  5,  5,  5,  5,  0,-10,
       -10,  0,  5,  0,  0,  0,  0,-10,
       -20,-10,-10, -5, -5,-10,-10,-20
    ],
    "K": [
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

// Get PST index for a position
function pstIndex(r, c) {
    return r * 8 + c;
}

// Evaluate board position
function evaluate(board) {
    let score = 0;

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (!piece) continue;

            const upper = piece.toUpperCase();
            const pieceValue = PIECE_VAL[piece] || 0;

            // Add piece value
            score += pieceValue;

            // Add positional value
            if (PST[upper]) {
                // For black pieces, flip the row index
                const rowIdx = piece === upper ? r : 7 - r;
                const pstVal = PST[upper][pstIndex(rowIdx, c)];
                score += piece === upper ? pstVal : -pstVal;
            }
        }
    }

    return score;
}

// Minimax with alpha-beta pruning
function minimax(board, depth, alpha, beta, maximizing, engine) {
    const color = maximizing ? "b" : "w";

    // Terminal condition
    if (depth === 0) {
        return { score: evaluate(board) };
    }

    const moves = engine.legalMoves(board, color);

    // No moves = game over
    if (moves.length === 0) {
        const state = engine.gameState(board, color);
        if (state === "checkmate") {
            return { score: maximizing ? -100000 + depth : 100000 - depth };
        }
        return { score: 0 }; // Stalemate
    }

    let bestMove = null;

    if (maximizing) {
        let maxScore = -Infinity;

        for (const move of moves) {
            // Make move
            const saved = engine.makeMove(board, move);

            // Recurse
            const result = minimax(board, depth - 1, alpha, beta, false, engine);

            // Undo move
            board[move.from[0]][move.from[1]] = move.piece;
            board[move.to[0]][move.to[1]] = move.captured;

            if (result.score > maxScore) {
                maxScore = result.score;
                bestMove = move;
            }

            alpha = Math.max(alpha, result.score);
            if (beta <= alpha) break;
        }

        return { score: maxScore, move: bestMove };
    } else {
        let minScore = Infinity;

        for (const move of moves) {
            // Make move
            const saved = engine.makeMove(board, move);

            // Recurse
            const result = minimax(board, depth - 1, alpha, beta, true, engine);

            // Undo move
            board[move.from[0]][move.from[1]] = move.piece;
            board[move.to[0]][move.to[1]] = move.captured;

            if (result.score < minScore) {
                minScore = result.score;
                bestMove = move;
            }

            beta = Math.min(beta, result.score);
            if (beta <= alpha) break;
        }

        return { score: minScore, move: bestMove };
    }
}

// Get best move for AI
function getBestMove(board, depth, engine) {
    const result = minimax(board, depth, -Infinity, Infinity, true, engine);
    return result.move;
}

// Export
window.ChessAI = {
    getBestMove,
    evaluate
};
