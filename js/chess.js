/* chess.js — Chess Engine */
(function() {
    'use strict';

    function pieceColor(piece) {
        if (!piece) return null;
        return piece === piece.toUpperCase() ? 'w' : 'b';
    }

    function oppColor(color) {
        return color === 'w' ? 'b' : 'w';
    }

    function initialBoard() {
        const b = Array(8).fill(null).map(() => Array(8).fill(null));
        const backRank = 'rnbqkbnr';
        for (let c = 0; c < 8; c++) {
            b[0][c] = backRank[c];
            b[1][c] = 'p';
            b[6][c] = 'P';
            b[7][c] = backRank[c].toUpperCase();
        }
        return b;
    }

    function toAlg(row, col) {
        return 'abcdefgh'[col] + (8 - row);
    }

    function findKing(board, color) {
        const king = color === 'w' ? 'K' : 'k';
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c] === king) return [r, c];
            }
        }
        return null;
    }

    // TEST: Simple attack check
    function simpleTest() {
        console.log("simpleTest called");
        const board = initialBoard();
        const kingPos = findKing(board, 'w');
        console.log("White king at:", kingPos);

        // Check what's around e1
        const r = kingPos[0], c = kingPos[1];
        console.log("Squares around king:");
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                    console.log("  (" + nr + "," + nc + "):", board[nr][nc]);
                }
            }
        }

        // Check pawn attacks on king
        // King at e1 (7,4)
        // Black pawn attacks from e2 (6,4) for black? No!
        // Black pawns move DOWN (increasing row), attack UP-RIGHT/LEFT
        // So black pawn at d2 (6,3) attacks e1 (7,4)?
        // Black pawn attacks (row+1, col-1) and (row+1, col+1)
        // Black pawn at d2 (6,3) attacks (7,2) and (7,4) = e1!

        // But d2 (6,3) is WHITE pawn (P)!
        // Let me check if there's a black pawn attacking e1

        // For black to attack e1 (7,4):
        // - Pawn at d2 (6,3) black? No, it's white (P)
        // - Pawn at f2 (6,5) black? No, it's white (P)
        // - Knight at d1 (7,3)? No, white knight
        // - Bishop from c1? No, white bishop
        // - Rook from e2? No, white pawn
        // - Queen from d1? No, white queen
        // - King from e2? No, empty

        console.log("d2 (6,3):", board[6][3], "- should be P (white)");
        console.log("f2 (6,5):", board[6][5], "- should be P (white)");
    }

    // Full attack check
    function isAttacked(board, row, col, byColor) {
        // Pawn attacks
        const pawnDir = byColor === 'w' ? 1 : -1;
        const pawn = byColor === 'w' ? 'P' : 'p';

        // For king at e1 (7,4), black pawn attacks from (7+1, 3) = (8,3) offboard and (8,5) offboard
        // So NO pawn attack!
        if (row + pawnDir >= 0 && row + pawnDir < 8) {
            if (col > 0 && board[row + pawnDir][col - 1] === pawn) return true;
            if (col < 7 && board[row + pawnDir][col + 1] === pawn) return true;
        }

        // Knight attacks
        const knight = byColor === 'w' ? 'n' : 'N';
        const knightMoves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
        for (const [dr, dc] of knightMoves) {
            const r = row + dr, c = col + dc;
            if (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c] === knight) return true;
        }

        // King attacks
        const king = byColor === 'w' ? 'k' : 'K';
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const r = row + dr, c = col + dc;
                if (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c] === king) return true;
            }
        }

        // Sliding pieces
        const diagonals = [[-1,-1],[-1,1],[1,-1],[1,1]];
        const straights = [[-1,0],[1,0],[0,-1],[0,1]];

        for (const [dr, dc] of diagonals) {
            let r = row + dr, c = col + dc;
            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                const piece = board[r][c];
                if (piece) {
                    if (pieceColor(piece) === byColor) {
                        const p = piece.toUpperCase();
                        if (p === 'B' || p === 'Q') return true;
                    }
                    break;
                }
                r += dr;
                c += dc;
            }
        }

        for (const [dr, dc] of straights) {
            let r = row + dr, c = col + dc;
            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                const piece = board[r][c];
                if (piece) {
                    if (pieceColor(piece) === byColor) {
                        const p = piece.toUpperCase();
                        if (p === 'R' || p === 'Q') return true;
                    }
                    break;
                }
                r += dr;
                c += dc;
            }
        }

        return false;
    }

    function isInCheck(board, color) {
        const king = findKing(board, color);
        if (!king) return false;
        return isAttacked(board, king[0], king[1], oppColor(color));
    }

    function pseudoMoves(board, row, col, color) {
        const moves = [];
        const piece = board[row][col];
        if (!piece) return moves;

        const type = piece.toUpperCase();
        const dir = color === 'w' ? -1 : 1;

        if (type === 'P') {
            const fRow = row + dir;
            if (fRow >= 0 && fRow < 8 && !board[fRow][col]) {
                moves.push([fRow, col]);
                const startRow = color === 'w' ? 6 : 1;
                if (row === startRow && !board[row + 2 * dir][col]) {
                    moves.push([row + 2 * dir, col]);
                }
            }
            for (const dc of [-1, 1]) {
                const c = col + dc;
                if (c >= 0 && c < 8 && fRow >= 0 && fRow < 8) {
                    const target = board[fRow][c];
                    if (target && pieceColor(target) === oppColor(color)) {
                        moves.push([fRow, c]);
                    }
                }
            }
        }

        if (type === 'N') {
            const knightMoves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
            for (const [dr, dc] of knightMoves) {
                const r = row + dr, c = col + dc;
                if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                    const target = board[r][c];
                    if (!target || pieceColor(target) === oppColor(color)) {
                        moves.push([r, c]);
                    }
                }
            }
        }

        if (type === 'B' || type === 'Q' || type === 'R') {
            const dirs = [];
            if (type === 'B' || type === 'Q') dirs.push(...[[-1,-1],[-1,1],[1,-1],[1,1]]);
            if (type === 'R' || type === 'Q') dirs.push(...[[-1,0],[1,0],[0,-1],[0,1]]);

            for (const [dr, dc] of dirs) {
                let r = row + dr, c = col + dc;
                while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                    const target = board[r][c];
                    if (!target) {
                        moves.push([r, c]);
                    } else {
                        if (pieceColor(target) === oppColor(color)) {
                            moves.push([r, c]);
                        }
                        break;
                    }
                    r += dr;
                    c += dc;
                }
            }
        }

        if (type === 'K') {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const r = row + dr, c = col + dc;
                    if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                        const target = board[r][c];
                        if (!target || pieceColor(target) === oppColor(color)) {
                            moves.push([r, c]);
                        }
                    }
                }
            }
        }

        return moves;
    }

    function legalMoves(board, color) {
        const moves = [];

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];
                if (!piece || pieceColor(piece) !== color) continue;

                const pieceMoves = pseudoMoves(board, r, c, color);

                for (const [toR, toC] of pieceMoves) {
                    const captured = board[toR][toC];
                    board[toR][toC] = piece;
                    board[r][c] = null;

                    if (!isInCheck(board, color)) {
                        moves.push({
                            from: [r, c],
                            to: [toR, toC],
                            piece: piece,
                            captured: captured
                        });
                    }

                    board[r][c] = piece;
                    board[toR][toC] = captured;
                }
            }
        }

        return moves;
    }

    function makeMove(board, move) {
        const { from, to, piece } = move;
        board[to[0]][to[1]] = piece;
        board[from[0]][from[1]] = null;
        if (piece === 'P' && to[0] === 0) board[to[0]][to[1]] = 'Q';
        if (piece === 'p' && to[0] === 7) board[to[0]][to[1]] = 'q';
    }

    function gameState(board, color) {
        const moves = legalMoves(board, color);
        const inCheck = isInCheck(board, color);
        if (moves.length === 0) {
            return inCheck ? 'checkmate' : 'stalemate';
        }
        return inCheck ? 'check' : 'playing';
    }

    window.ChessEngine = {
        initialBoard,
        pieceColor,
        toAlg,
        findKing,
        isInCheck,
        isAttacked,
        pseudoMoves,
        legalMoves,
        makeMove,
        gameState,
        simpleTest
    };

})();
