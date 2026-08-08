/* ai.js — minimax AI with alpha-beta pruning */
"use strict";

var PIECE_VAL = {
    "P": 100, "N": 320, "B": 330, "R": 500, "Q": 900, "K": 20000,
    "p": -100, "n": -320, "b": -330, "r": -500, "q": -900, "k": -20000
};

var PST = {
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

function pstIndex(r, c) { return r * 8 + c; }

function evaluate(board) {
    var score = 0;
    for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
            var piece = board[r][c];
            if (!piece) continue;
            var upper = piece.toUpperCase();
            score += PIECE_VAL[piece] || 0;
            if (PST[upper]) {
                var rowIdx = piece === upper ? r : 7 - r;
                var pstVal = PST[upper][pstIndex(rowIdx, c)];
                score += piece === upper ? pstVal : -pstVal;
            }
        }
    }
    return score;
}

function minimax(depth, alpha, beta, maximizing, engine) {
    var color = maximizing ? "b" : "w";

    if (depth === 0) return { score: evaluate(engine.getBoard()) };

    var moves = engine.legalMoves(color);
    if (moves.length === 0) {
        var state = engine.gameState(color);
        if (state === "checkmate") return { score: maximizing ? -100000 + depth : 100000 - depth };
        return { score: 0 };
    }

    var bestMove = null;

    if (maximizing) {
        var maxScore = -Infinity;
        for (var i = 0; i < moves.length; i++) {
            var saved = engine.saveState();
            engine.makeMove(moves[i]);
            var result = minimax(depth - 1, alpha, beta, false, engine);
            engine.restoreState(saved);
            if (result.score > maxScore) { maxScore = result.score; bestMove = moves[i]; }
            alpha = Math.max(alpha, result.score);
            if (beta <= alpha) break;
        }
        return { score: maxScore, move: bestMove };
    } else {
        var minScore = Infinity;
        for (var i = 0; i < moves.length; i++) {
            var saved2 = engine.saveState();
            engine.makeMove(moves[i]);
            var result2 = minimax(depth - 1, alpha, beta, true, engine);
            engine.restoreState(saved2);
            if (result2.score < minScore) { minScore = result2.score; bestMove = moves[i]; }
            beta = Math.min(beta, result2.score);
            if (beta <= alpha) break;
        }
        return { score: minScore, move: bestMove };
    }
}

function getBestMove(board, depth, engine) {
    var result = minimax(depth, -Infinity, Infinity, true, engine);
    return result.move;
}

window.ChessAI = { getBestMove: getBestMove, evaluate: evaluate };
