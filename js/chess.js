/* chess.js — Chess Engine v2 (castling + en passant) */
(function() {
    'use strict';

    // ── Internal game state ──
    var _board = null;
    var _castling = null;   // { K:bool, Q:bool, k:bool, q:bool }
    var _ep = null;         // { row, col } or null

    // ── Helpers ──
    function pieceColor(piece) {
        if (!piece) return null;
        return piece === piece.toUpperCase() ? 'w' : 'b';
    }
    function oppColor(c) { return c === 'w' ? 'b' : 'w'; }
    function toAlg(row, col) { return 'abcdefgh'[col] + (8 - row); }

    function initialBoard() {
        var b = Array(8).fill(null).map(function() { return Array(8).fill(null); });
        var back = 'rnbqkbnr';
        for (var c = 0; c < 8; c++) {
            b[0][c] = back[c];      b[1][c] = 'p';
            b[6][c] = 'P';         b[7][c] = back[c].toUpperCase();
        }
        return b;
    }

    // ── Find king (reads internal board) ──
    function findKing(color) {
        var k = color === 'w' ? 'K' : 'k';
        for (var r = 0; r < 8; r++)
            for (var c = 0; c < 8; c++)
                if (_board[r][c] === k) return [r, c];
        return null;
    }

    // ── Attack detection (uses internal _board) ──
    function isAttacked(row, col, byColor) {
        var b = _board;
        // Pawns
        var pDir = byColor === 'w' ? 1 : -1;
        var pawn = byColor === 'w' ? 'P' : 'p';
        if (row + pDir >= 0 && row + pDir < 8) {
            if (col > 0 && b[row + pDir][col - 1] === pawn) return true;
            if (col < 7 && b[row + pDir][col + 1] === pawn) return true;
        }
        // Knight
        var kn = byColor === 'w' ? 'N' : 'n';
        var knM = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
        for (var i = 0; i < 8; i++) {
            var nr = row + knM[i][0], nc = col + knM[i][1];
            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && b[nr][nc] === kn) return true;
        }
        // King
        var kg = byColor === 'w' ? 'K' : 'k';
        for (var dr = -1; dr <= 1; dr++)
            for (var dc = -1; dc <= 1; dc++) {
                if (!dr && !dc) continue;
                var rr = row + dr, cc = col + dc;
                if (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && b[rr][cc] === kg) return true;
            }
        // Diagonal sliding (Bishop / Queen)
        var diag = [[-1,-1],[-1,1],[1,-1],[1,1]];
        for (var d = 0; d < 4; d++) {
            var dr2 = diag[d][0], dc2 = diag[d][1];
            var rr2 = row + dr2, cc2 = col + dc2;
            while (rr2 >= 0 && rr2 < 8 && cc2 >= 0 && cc2 < 8) {
                var pp = b[rr2][cc2];
                if (pp) {
                    if (pieceColor(pp) === byColor) { var pu = pp.toUpperCase(); if (pu === 'B' || pu === 'Q') return true; }
                    break;
                }
                rr2 += dr2; cc2 += dc2;
            }
        }
        // Straight sliding (Rook / Queen)
        var str = [[-1,0],[1,0],[0,-1],[0,1]];
        for (var s = 0; s < 4; s++) {
            var dr3 = str[s][0], dc3 = str[s][1];
            var rr3 = row + dr3, cc3 = col + dc3;
            while (rr3 >= 0 && rr3 < 8 && cc3 >= 0 && cc3 < 8) {
                var pp2 = b[rr3][cc3];
                if (pp2) {
                    if (pieceColor(pp2) === byColor) { var pu2 = pp2.toUpperCase(); if (pu2 === 'R' || pu2 === 'Q') return true; }
                    break;
                }
                rr3 += dr3; cc3 += dc3;
            }
        }
        return false;
    }

    function isInCheck(color) {
        var k = findKing(color);
        return k ? isAttacked(k[0], k[1], oppColor(color)) : false;
    }

    // ── Apply a move (mutates internal state) ──
    function applyMove(move) {
        var fr = move.from[0], fc = move.from[1];
        var tr = move.to[0],   tc = move.to[1];
        var piece = _board[fr][fc];
        var type = piece.toUpperCase();
        var color = pieceColor(piece);
        var captured = _board[tr][tc];

        // En passant capture — remove the pawn that isn't on the target square
        if (type === 'P' && _ep && tr === _ep.row && tc === _ep.col && !captured) {
            _board[fr][tc] = null;
        }

        // Move the piece
        _board[tr][tc] = piece;
        _board[fr][fc] = null;

        // Castling — move the rook too
        if (type === 'K' && fc === 4 && (tc === 6 || tc === 2)) {
            var bk = color === 'w' ? 7 : 0;
            if (tc === 6) { _board[bk][5] = _board[bk][7]; _board[bk][7] = null; } // K-side
            else          { _board[bk][3] = _board[bk][0]; _board[bk][0] = null; } // Q-side
        }

        // Promotion — auto-queen
        if (type === 'P' && (tr === 0 || tr === 7)) {
            _board[tr][tc] = color === 'w' ? 'Q' : 'q';
        }

        // Update castling rights
        if (type === 'K') {
            if (color === 'w') { _castling.K = false; _castling.Q = false; }
            else               { _castling.k = false; _castling.q = false; }
        }
        if (type === 'R') {
            if (fr === 7 && fc === 7) _castling.K = false;
            if (fr === 7 && fc === 0) _castling.Q = false;
            if (fr === 0 && fc === 7) _castling.k = false;
            if (fr === 0 && fc === 0) _castling.q = false;
        }
        // Rook captured on its home square
        if (captured === 'R') {
            if (tr === 7 && tc === 7) _castling.K = false;
            if (tr === 7 && tc === 0) _castling.Q = false;
        }
        if (captured === 'r') {
            if (tr === 0 && tc === 7) _castling.k = false;
            if (tr === 0 && tc === 0) _castling.q = false;
        }

        // Update en passant target
        if (type === 'P' && Math.abs(tr - fr) === 2) {
            _ep = { row: (fr + tr) / 2, col: fc };
        } else {
            _ep = null;
        }
    }

    // ── Pseudo-legal move generation ──
    function pseudoMoves(color) {
        var b = _board;
        var moves = [];
        var enemy = oppColor(color);

        for (var r = 0; r < 8; r++) {
            for (var c = 0; c < 8; c++) {
                var piece = b[r][c];
                if (!piece || pieceColor(piece) !== color) continue;
                var type = piece.toUpperCase();
                var dir = color === 'w' ? -1 : 1;

                // ── Pawn ──
                if (type === 'P') {
                    var fwd = r + dir;
                    // Single push
                    if (fwd >= 0 && fwd < 8 && !b[fwd][c]) {
                        moves.push({ from: [r, c], to: [fwd, c], piece: piece });
                        // Double push from start
                        var start = color === 'w' ? 6 : 1;
                        if (r === start && !b[r + 2 * dir][c]) {
                            moves.push({ from: [r, c], to: [r + 2 * dir, c], piece: piece });
                        }
                    }
                    // Captures (normal + en passant)
                    for (var dc = -1; dc <= 1; dc += 2) {
                        var nc = c + dc;
                        if (nc < 0 || nc > 7 || fwd < 0 || fwd > 7) continue;
                        if (b[fwd][nc] && pieceColor(b[fwd][nc]) === enemy) {
                            moves.push({ from: [r, c], to: [fwd, nc], piece: piece });
                        } else if (_ep && _ep.row === fwd && _ep.col === nc) {
                            moves.push({ from: [r, c], to: [fwd, nc], piece: piece });
                        }
                    }
                    continue;
                }

                // ── Knight ──
                if (type === 'N') {
                    var knM = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
                    for (var i = 0; i < 8; i++) {
                        var nr = r + knM[i][0], ncc = c + knM[i][1];
                        if (nr < 0 || nr > 7 || ncc < 0 || ncc > 7) continue;
                        var t = b[nr][ncc];
                        if (!t || pieceColor(t) === enemy) {
                            moves.push({ from: [r, c], to: [nr, ncc], piece: piece });
                        }
                    }
                    continue;
                }

                // ── King ──
                if (type === 'K') {
                    for (var dr = -1; dr <= 1; dr++) {
                        for (var dc = -1; dc <= 1; dc++) {
                            if (!dr && !dc) continue;
                            var kr = r + dr, kc = c + dc;
                            if (kr < 0 || kr > 7 || kc < 0 || kc > 7) continue;
                            var t2 = b[kr][kc];
                            if (!t2 || pieceColor(t2) === enemy) {
                                moves.push({ from: [r, c], to: [kr, kc], piece: piece });
                            }
                        }
                    }
                    // Castling
                    var bk = color === 'w' ? 7 : 0;
                    if (r === bk && c === 4) {
                        // King-side
                        var ksR = color === 'w' ? 'K' : 'k';
                        var ksRk = color === 'w' ? 'R' : 'r';
                        if (_castling[ksR] && b[bk][7] === ksRk &&
                            !b[bk][5] && !b[bk][6] &&
                            !isAttacked(bk, 4, enemy) &&
                            !isAttacked(bk, 5, enemy) &&
                            !isAttacked(bk, 6, enemy)) {
                            moves.push({ from: [r, c], to: [bk, 6], piece: piece });
                        }
                        // Queen-side
                        var qsR = color === 'w' ? 'Q' : 'q';
                        var qsRk = color === 'w' ? 'R' : 'r';
                        if (_castling[qsR] && b[bk][0] === qsRk &&
                            !b[bk][1] && !b[bk][2] && !b[bk][3] &&
                            !isAttacked(bk, 4, enemy) &&
                            !isAttacked(bk, 3, enemy) &&
                            !isAttacked(bk, 2, enemy)) {
                            moves.push({ from: [r, c], to: [bk, 2], piece: piece });
                        }
                    }
                    continue;
                }

                // ── Sliding pieces (Bishop / Rook / Queen) ──
                var dirs = [];
                if (type === 'B' || type === 'Q') dirs.push([-1,-1],[-1,1],[1,-1],[1,1]);
                if (type === 'R' || type === 'Q') dirs.push([-1,0],[1,0],[0,-1],[0,1]);
                for (var d = 0; d < dirs.length; d++) {
                    var sr = r + dirs[d][0], sc = c + dirs[d][1];
                    while (sr >= 0 && sr < 8 && sc >= 0 && sc < 8) {
                        var t3 = b[sr][sc];
                        if (!t3) {
                            moves.push({ from: [r, c], to: [sr, sc], piece: piece });
                        } else {
                            if (pieceColor(t3) === enemy) {
                                moves.push({ from: [r, c], to: [sr, sc], piece: piece });
                            }
                            break;
                        }
                        sr += dirs[d][0]; sc += dirs[d][1];
                    }
                }
            }
        }
        return moves;
    }

    // ── Legal move filtering ──
    function legalMoves(color) {
        var results = [];
        var moves = pseudoMoves(color);

        // Save state snapshot
        var savedBoard = _board.map(function(row) { return row.slice(); });
        var savedCK = _castling.K, savedCQ = _castling.Q;
        var savedck = _castling.k, savedcq = _castling.q;
        var savedEp = _ep ? { row: _ep.row, col: _ep.col } : null;

        for (var i = 0; i < moves.length; i++) {
            applyMove(moves[i]);
            if (!isInCheck(color)) {
                results.push(moves[i]);
            }
            // Restore state
            for (var r = 0; r < 8; r++)
                for (var c = 0; c < 8; c++)
                    _board[r][c] = savedBoard[r][c];
            _castling.K = savedCK; _castling.Q = savedCQ;
            _castling.k = savedck; _castling.q = savedcq;
            _ep = savedEp ? { row: savedEp.row, col: savedEp.col } : null;
        }
        return results;
    }

    // ── Public API ──

    function newGame() {
        _board = initialBoard();
        _castling = { K: true, Q: true, k: true, q: true };
        _ep = null;
    }

    function getBoard() { return _board; }

    function makeMove(move) {
        applyMove(move);
    }

    function gameState(color) {
        var moves = legalMoves(color);
        var inCheck = isInCheck(color);
        if (moves.length === 0) return inCheck ? 'checkmate' : 'stalemate';
        return inCheck ? 'check' : 'playing';
    }

    // State save/restore for AI search
    function saveState() {
        return {
            board: _board.map(function(row) { return row.slice(); }),
            K: _castling.K, Q: _castling.Q, k: _castling.k, q: _castling.q,
            ep: _ep ? { row: _ep.row, col: _ep.col } : null
        };
    }

    function restoreState(s) {
        for (var r = 0; r < 8; r++)
            for (var c = 0; c < 8; c++)
                _board[r][c] = s.board[r][c];
        _castling.K = s.K; _castling.Q = s.Q;
        _castling.k = s.k; _castling.q = s.q;
        _ep = s.ep ? { row: s.ep.row, col: s.ep.col } : null;
    }

    // Legacy compat (used by test scripts)
    function initialBoardFn() { return initialBoard(); }

    window.ChessEngine = {
        newGame: newGame,
        getBoard: getBoard,
        pieceColor: pieceColor,
        toAlg: toAlg,
        findKing: function(color) { return findKing(color); },
        isInCheck: function(color) { return isInCheck(color); },
        isAttacked: function(row, col, byColor) { return isAttacked(row, col, byColor); },
        pseudoMoves: function(color) { return pseudoMoves(color); },
        legalMoves: function(color) { return legalMoves(color); },
        makeMove: makeMove,
        gameState: gameState,
        saveState: saveState,
        restoreState: restoreState,
        initialBoard: initialBoardFn
    };

})();
