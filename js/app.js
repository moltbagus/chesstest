/* app.js — Chessy main application */
(function() {
    'use strict';

    // STATE
    var board = null;
    var currentPlayer = 'w';
    var selectedSquare = null;
    var validMoves = [];
    var gameOver = false;
    var hintMove = null;

    // Game mode
    var vsAI = true;
    var aiDifficulty = 3; // 1=easy, 2=medium, 3=hard

    // Move history for undo
    var moveHistory = [];

    // Rating + XP
    var playerRating = 1200;
    var gamesPlayed = 0;
    var gamesWon = 0;
    var playerXP = 0;
    var playerLevel = 1;

    // Sound
    var soundEnabled = true;
    var audioCtx = null;

    // Themes
    var currentTheme = 'default';
    var themes = {
        default: { name: 'Default (Classic)', light: '#f0d9b5', dark: '#b58863' },
        dark: { name: 'Dark Mode', light: '#4a4a4a', dark: '#2d2d2d' },
        pastel: { name: 'Pastel', light: '#f5e6d3', dark: '#d4a574' },
        'high-contrast': { name: 'High Contrast', light: '#ffffff', dark: '#000000' },
        wood: { name: 'Wood', light: '#deb887', dark: '#8b4513' },
        neon: { name: 'Neon', light: '#1a1a2e', dark: '#16213e', accent: '#0f3460' }
    };

    // Pieces unicode (must keep these!)
    var PIECES = {
        'K': '\u2654', 'Q': '\u2655', 'R': '\u2656', 'B': '\u2657', 'N': '\u2658', 'P': '\u2659',
        'k': '\u265A', 'q': '\u265B', 'r': '\u265C', 'b': '\u265D', 'n': '\u265E', 'p': '\u265F'
    };

    // INITIALIZE
    function init() {
        console.log('Chessy initializing...');
        loadPreferences();
        initAudio();
        setupThemeSelector();
        setupPieceStyleSelector();
        setupButtons();
        initGame();
        console.log('Chessy ready!');
    }

    function initAudio() {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) { audioCtx = null; }
    }

    function playSound(type) {
        if (!soundEnabled || !audioCtx) return;
        if (audioCtx.state === 'suspended') audioCtx.resume();

        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        var freqs = { move: 440, capture: 330, win: 880, lose: 220, hint: 550 };
        osc.frequency.value = freqs[type] || 440;
        osc.type = 'sine';

        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
    }

    function loadPreferences() {
        var savedTheme = localStorage.getItem('chesstest-theme');
        if (savedTheme && themes[savedTheme]) currentTheme = savedTheme;
        var savedRating = localStorage.getItem('chesstest-rating');
        if (savedRating) playerRating = parseInt(savedRating, 10);
        var savedGames = localStorage.getItem('chesstest-games-played');
        if (savedGames) gamesPlayed = parseInt(savedGames, 10);
        var savedVsAI = localStorage.getItem('chesstest-vs-ai');
        if (savedVsAI !== null) vsAI = savedVsAI === 'true';
        var savedDiff = localStorage.getItem('chesstest-ai-difficulty');
        if (savedDiff) aiDifficulty = parseInt(savedDiff, 10);
        var savedSound = localStorage.getItem('chesstest-sound');
        if (savedSound !== null) soundEnabled = savedSound !== 'false';
        var savedXP = localStorage.getItem('chesstest-xp');
        if (savedXP) playerXP = parseInt(savedXP, 10);
        var savedLevel = localStorage.getItem('chesstest-level');
        if (savedLevel) playerLevel = parseInt(savedLevel, 10);
        applyTheme(currentTheme);
    }

    function savePreferences() {
        localStorage.setItem('chesstest-vs-ai', vsAI);
        localStorage.setItem('chesstest-ai-difficulty', aiDifficulty);
        localStorage.setItem('chesstest-sound', soundEnabled);
    }

    // GAME
    function initGame() {
        ChessEngine.newGame();
        board = ChessEngine.getBoard();
        currentPlayer = 'w';
        selectedSquare = null;
        validMoves = [];
        gameOver = false;
        hintMove = null;
        moveHistory = [];
        renderBoard();
        updateStatus();
        hideBanner();
        showNotification('New game started! Your turn.', 'info');
        showOpponent();
        updateXPBar();
    }

    function renderBoard() {
        var boardEl = document.getElementById('board');
        if (!boardEl) return;
        boardEl.innerHTML = '';

        for (var r = 0; r < 8; r++) {
            for (var c = 0; c < 8; c++) {
                var square = document.createElement('div');
                square.className = 'square';
                square.dataset.row = r;
                square.dataset.col = c;
                square.classList.add((r + c) % 2 === 0 ? 'light' : 'dark');

                // Hint highlighting
                if (hintMove) {
                    if (r === hintMove.from[0] && c === hintMove.from[1]) square.classList.add('hint-from');
                    if (r === hintMove.to[0] && c === hintMove.to[1]) square.classList.add('hint');
                }

                if (selectedSquare && selectedSquare[0] === r && selectedSquare[1] === c) {
                    square.classList.add('selected');
                }

                for (var i = 0; i < validMoves.length; i++) {
                    if (validMoves[i][0] === r && validMoves[i][1] === c) {
                        square.classList.add('valid-move');
                        if (board[r][c]) square.classList.add('capture');
                    }
                }

                var piece = board[r][c];
                if (piece) {
                    var style = (document.getElementById('piece-style-select') || {}).value || localStorage.getItem('chesstest-piece-style') || 'default';
                    var pieceEl;
                    if (style === 'google') {
                        pieceEl = document.createElement('span');
                        pieceEl.className = 'piece google-piece';
                        pieceEl.innerHTML = getGooglePieceSVG(piece);
                    } else {
                        pieceEl = document.createElement('span');
                        pieceEl.className = 'piece';
                        pieceEl.textContent = (style === 'emoji') ? getEmojiPiece(piece) : (PIECES[piece] || piece);
                    }
                    square.appendChild(pieceEl);
                }

                var row = r, col = c;
                square.addEventListener('click', (function(r, c) {
                    return function() { handleSquareClick(r, c); };
                })(row, col));

                boardEl.appendChild(square);
            }
        }

        if (document.getElementById('rating')) document.getElementById('rating').textContent = playerRating;
        if (document.getElementById('games-played')) document.getElementById('games-played').textContent = gamesPlayed;
        if (document.getElementById('level')) document.getElementById('level').textContent = playerLevel;
        updateXPBar();
    }

    function handleSquareClick(row, col) {
        if (gameOver) { initGame(); return; }

        if (hintMove) { hintMove = null; renderBoard(); }

        var piece = board[row][col];

        if (piece && ChessEngine.pieceColor(piece) === currentPlayer) {
            selectedSquare = [row, col];
            var moves = ChessEngine.legalMoves(currentPlayer);
            validMoves = [];
            for (var i = 0; i < moves.length; i++) {
                if (moves[i].from[0] === row && moves[i].from[1] === col) validMoves.push(moves[i].to);
            }
            renderBoard();
            return;
        }

        if (selectedSquare) {
            var isValid = false;
            for (var i = 0; i < validMoves.length; i++) {
                if (validMoves[i][0] === row && validMoves[i][1] === col) { isValid = true; break; }
            }
            if (isValid) makeMove(selectedSquare[0], selectedSquare[1], row, col);
        }

        selectedSquare = null;
        validMoves = [];
        renderBoard();
    }

    function makeMove(fromR, fromC, toR, toC) {
        var piece = board[fromR][fromC];
        var captured = board[toR][toC];
        var move = { from: [fromR, fromC], to: [toR, toC], piece: piece, captured: captured };

        // Save state for undo
        moveHistory.push({
            move: move,
            engineState: ChessEngine.saveState(),
            currentPlayer: currentPlayer,
            gameOver: gameOver
        });

        ChessEngine.makeMove(move);
        currentPlayer = currentPlayer === 'w' ? 'b' : 'w';
        selectedSquare = null;
        validMoves = [];
        renderBoard();
        updateStatus();

        // Play sound
        playSound(captured ? 'capture' : 'move');

        checkPuzzleMove(move);

        var state = ChessEngine.gameState(currentPlayer);
        if (state === 'checkmate' || state === 'stalemate') { handleGameOver(state); return; }
        if (currentPlayer === 'b' && vsAI && !gameOver) setTimeout(makeAIMove, 500);
    }

    function undoMove() {
        if (moveHistory.length === 0) {
            showNotification('No moves to undo!', 'info');
            return;
        }

        var last = moveHistory.pop();
        ChessEngine.restoreState(last.engineState);
        board = ChessEngine.getBoard();
        currentPlayer = last.currentPlayer;
        gameOver = last.gameOver;
        selectedSquare = null;
        validMoves = [];
        hintMove = null;
        renderBoard();
        updateStatus();
        hideBanner();
        showNotification('Move undone.', 'info');
    }

    function makeAIMove() {
        if (gameOver || currentPlayer !== 'b' || !vsAI) return;
        var diff = currentOpponent ? currentOpponent.diff : aiDifficulty;
        var move = ChessAI.getBestMove(board, diff, ChessEngine);
        if (!move) { handleGameOver('checkmate'); return; }

        // Save for undo
        moveHistory.push({
            move: move,
            engineState: ChessEngine.saveState(),
            currentPlayer: currentPlayer,
            gameOver: gameOver
        });

        ChessEngine.makeMove(move);
        currentPlayer = 'w';
        renderBoard();
        updateStatus();
        playSound('move');
        var state = ChessEngine.gameState('w');
        if (state === 'checkmate' || state === 'stalemate') handleGameOver(state);
    }

    function handleGameOver(state) {
        gameOver = true;
        if (state === 'checkmate') {
            if (currentPlayer === 'w') {
                // White to move but cannot → white is checkmated, AI wins
                showBanner('Checkmate! AI wins!', 'loss');
                showNotification('AI wins! Try again.', 'info');
                updateRating(-20);
                winStreak = 0;
                playSound('lose');
            } else {
                // Black to move but cannot → black is checkmated, user wins
                showBanner('Checkmate! You win!', 'win');
                showNotification('Congratulations! You won!', 'success');
                updateRating(25);
                winStreak++;
                playSound('win');
                launchConfetti();
            }
        } else {
            showBanner('Stalemate! Draw.', 'draw');
            showNotification('Stalemate! Its a draw.', 'info');
            winStreak = 0;
        }
        checkAchievements();
    }

    function updateRating(delta) {
        playerRating = Math.max(100, playerRating + delta);
        gamesPlayed++;
        if (delta > 0) { gamesWon++; localStorage.setItem('chesstest-games-won', gamesWon); }

        // XP + level
        var xpGain = delta > 0 ? 25 + Math.floor(delta / 2) : 10;
        playerXP += xpGain;
        var xpNeeded = playerLevel * 100;
        while (playerXP >= xpNeeded) {
            playerLevel++;
            playerXP -= xpNeeded;
            showNotification('🎉 Level Up! You are now level ' + playerLevel, 'success');
            xpNeeded = playerLevel * 100;
            updateXPBar();
        }

        localStorage.setItem('chesstest-rating', playerRating);
        localStorage.setItem('chesstest-games-played', gamesPlayed);
        localStorage.setItem('chesstest-xp', playerXP);
        localStorage.setItem('chesstest-level', playerLevel);
    }

    function updateStatus() {
        var statusEl = document.getElementById('status');
        if (statusEl) statusEl.textContent = currentPlayer === 'w' ? 'Your turn' : 'AI thinking...';
    }

    function updateXPBar() {
        var bar = document.getElementById('xp-bar');
        if (!bar) return;
        var xpNeeded = playerLevel * 100;
        var percent = Math.min(100, Math.floor(((playerXP % xpNeeded) / xpNeeded) * 100));
        bar.style.width = percent + '%';
    }

    function showOpponent() {
        var opp = AI_OPPONENTS[Math.min(Math.floor(playerLevel / 2), AI_OPPONENTS.length - 1)];
        currentOpponent = opp;
        var status = document.getElementById('status');
        if (status) status.textContent = 'Your turn vs ' + opp.emoji + ' ' + opp.name;
    }

    // Cute AI opponents
    var AI_OPPONENTS = [
        { name: 'Bunny', emoji: '🐰', diff: 1 },
        { name: 'Fox', emoji: '🦊', diff: 2 },
        { name: 'Panda', emoji: '🐼', diff: 2 },
        { name: 'Dragon', emoji: '🐉', diff: 3 }
    ];
    var currentOpponent = AI_OPPONENTS[2];

    function showBanner(message, type) {
        var banner = document.getElementById('banner');
        if (banner) { banner.textContent = message; banner.className = 'banner ' + type; }
    }

    function hideBanner() {
        var banner = document.getElementById('banner');
        if (banner) banner.className = 'banner hidden';
    }

    // NOTIFICATIONS
    // ACHIEVEMENTS
    var achievements = [
        { id: 'first_win', name: 'First Victory', desc: 'Win your first game', unlocked: false },
        { id: 'puzzle_master', name: 'Puzzle Master', desc: 'Solve 5 puzzles', unlocked: false },
        { id: 'streak_3', name: 'Hot Streak', desc: 'Win 3 games in a row', unlocked: false },
        { id: 'rating_1500', name: 'Rising Star', desc: 'Reach 1500 rating', unlocked: false }
    ];
    var puzzlesSolved = 0;
    var winStreak = 0;

    function checkAchievements() {
        for (var i = 0; i < achievements.length; i++) {
            var ach = achievements[i];
            if (ach.unlocked) continue;

            var unlock = false;
            if (ach.id === 'first_win' && gamesWon > 0) unlock = true;
            if (ach.id === 'puzzle_master' && puzzlesSolved >= 5) unlock = true;
            if (ach.id === 'streak_3' && winStreak >= 3) unlock = true;
            if (ach.id === 'rating_1500' && playerRating >= 1500) unlock = true;

            if (unlock) {
                ach.unlocked = true;
                showNotification('🏆 Achievement: ' + ach.name + '!', 'success');
                playSound('win');
            }
        }
    }

    function showNotification(message, type) {
        var existing = document.querySelector('.notification');
        if (existing) existing.remove();

        var notification = document.createElement('div');
        notification.className = 'notification ' + (type || 'info');
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(function() {
            if (notification.parentElement) notification.remove();
        }, 3000);
    }

    // HINT SYSTEM
    function showHint() {
        if (gameOver || currentPlayer !== 'w') {
            showNotification('Wait for your turn!', 'info');
            return;
        }
        var hint = ChessAI.getBestMove(board, 2, ChessEngine);
        if (hint) {
            hintMove = hint;
            renderBoard();
            var pieceName = getPieceName(hint.piece);
            var fromAlg = ChessEngine.toAlg(hint.from[0], hint.from[1]);
            var toAlg = ChessEngine.toAlg(hint.to[0], hint.to[1]);
            showNotification('Hint: ' + pieceName + ' from ' + fromAlg + ' to ' + toAlg, 'info');
        } else {
            showNotification('No hint available!', 'info');
        }
    }

    function getPieceName(piece) {
        var names = { 'K': 'King', 'Q': 'Queen', 'R': 'Rook', 'B': 'Bishop', 'N': 'Knight', 'P': 'Pawn',
                      'k': 'King', 'q': 'Queen', 'r': 'Rook', 'b': 'Bishop', 'n': 'Knight', 'p': 'Pawn' };
        return names[piece] || 'Piece';
    }

    function getEmojiPiece(piece) {
        var map = {
            'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
            'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
        };
        return map[piece] || piece;
    }

    function getGooglePieceSVG(piece) {
        var isWhite = piece === piece.toUpperCase();
        var fill = isWhite ? '#f1f3f4' : '#202124';
        var stroke = isWhite ? '#202124' : '#f1f3f4';
        var s = 'stroke="' + stroke + '" stroke-width="1.5" stroke-linejoin="round"';

        if (piece.toUpperCase() === 'K') {
            return '<svg viewBox="0 0 45 45"><g fill="' + fill + '" ' + s + '><path d="M22.5 9v7"/><path d="M20 11h5"/><circle cx="22.5" cy="20" r="3.5"/><path d="M22.5 23.5v3"/><path d="M16.5 26.5h12l-1.5 4H18z"/><path d="M13 35h19"/><path d="M12 39h21"/></g></svg>';
        }
        if (piece.toUpperCase() === 'Q') {
            return '<svg viewBox="0 0 45 45"><g fill="' + fill + '" ' + s + '><circle cx="22.5" cy="10" r="3"/><path d="M19.5 13l3 7 3-7"/><path d="M22.5 20v4"/><path d="M15 32h15"/><path d="M14 36h17"/><path d="M13 40h19"/></g></svg>';
        }
        if (piece.toUpperCase() === 'R') {
            return '<svg viewBox="0 0 45 45"><g fill="' + fill + '" ' + s + '><path d="M11 9h23v6H11z"/><path d="M13 15v4h19v-4"/><path d="M12 19h21v13H12z"/><path d="M11 32h23v5H11z"/></g></svg>';
        }
        if (piece.toUpperCase() === 'B') {
            return '<svg viewBox="0 0 45 45"><g fill="' + fill + '" ' + s + '><circle cx="22.5" cy="12" r="4"/><path d="M22.5 16v5"/><path d="M16.5 21h12l-2.5 7H19z"/><path d="M14 34h17"/><path d="M13 38h19"/></g></svg>';
        }
        if (piece.toUpperCase() === 'N') {
            return '<svg viewBox="0 0 45 45"><g fill="' + fill + '" ' + s + '><path d="M14 33l2 3h13l2-3"/><path d="M19 12c3.5 0 5.5 1.5 6.5 4 1 3-0.5 6-3.5 8l-1 4-4-1-1-3-3 1-1-3c-2-2-3-4.5-2.5-7 1-3 4-3.5 8.5-3.5z"/><path d="M14 34h17"/><path d="M13 38h19"/></g></svg>';
        }
        if (piece.toUpperCase() === 'P') {
            return '<svg viewBox="0 0 45 45"><g fill="' + fill + '" ' + s + '><circle cx="22.5" cy="15" r="4"/><path d="M22.5 19v8"/><path d="M15 34h15"/><path d="M14 38h17"/></g></svg>';
        }
        return '';
    }

    function launchConfetti() {
        for (var i = 0; i < 80; i++) {
            var conf = document.createElement('div');
            conf.textContent = ['🎉','⭐','✨','🦄','🐰'][Math.floor(Math.random()*5)];
            conf.style.position = 'fixed';
            conf.style.left = Math.random()*100 + 'vw';
            conf.style.top = '-20px';
            conf.style.fontSize = (16 + Math.random()*20) + 'px';
            conf.style.zIndex = '9999';
            conf.style.transition = 'transform 1.8s linear, opacity 1.8s linear';
            document.body.appendChild(conf);
            var dx = (Math.random()-0.5)*400;
            setTimeout(function(c, d) {
                c.style.transform = 'translateY(100vh) translateX(' + d + 'px)';
                c.style.opacity = '0';
            }, 10, conf, dx);
            setTimeout(function(c){ c.remove(); }, 2200, conf);
        }
    }

    // THEMES
    function applyTheme(themeName) {
        var theme = themes[themeName];
        if (!theme) return;
        currentTheme = themeName;
        localStorage.setItem('chesstest-theme', themeName);
        document.documentElement.style.setProperty('--light-square', theme.light);
        document.documentElement.style.setProperty('--dark-square', theme.dark);
        var themeSelect = document.getElementById('theme-select');
        if (themeSelect) themeSelect.value = themeName;
    }

    function setupThemeSelector() {
        var themeSelect = document.getElementById('theme-select');
        if (!themeSelect) return;
        themeSelect.innerHTML = '';
        var themeKeys = Object.keys(themes);
        for (var i = 0; i < themeKeys.length; i++) {
            var key = themeKeys[i];
            var option = document.createElement('option');
            option.value = key;
            option.textContent = themes[key].name;
            themeSelect.appendChild(option);
        }
        themeSelect.value = currentTheme;
        themeSelect.addEventListener('change', function(e) { applyTheme(e.target.value); });
    }

    function setupPieceStyleSelector() {
        var styleSelect = document.getElementById('piece-style-select');
        if (styleSelect) {
            var saved = localStorage.getItem('chesstest-piece-style');
            if (saved) styleSelect.value = saved;
            styleSelect.addEventListener('change', function(e) {
                localStorage.setItem('chesstest-piece-style', e.target.value);
                renderBoard();
            });
        }
    }

    // BUTTONS
    function setupButtons() {
        var newGameBtn = document.getElementById('new-game');
        if (newGameBtn) newGameBtn.addEventListener('click', function() { initGame(); });
        var undoBtn = document.getElementById('undo');
        if (undoBtn) undoBtn.addEventListener('click', function() { undoMove(); });
        var hintBtn = document.getElementById('hint');
        if (hintBtn) hintBtn.addEventListener('click', function() { showHint(); });

        // AI Difficulty
        var diffSelect = document.getElementById('ai-difficulty');
        if (diffSelect) {
            diffSelect.value = aiDifficulty;
            diffSelect.addEventListener('change', function(e) {
                aiDifficulty = parseInt(e.target.value, 10);
                savePreferences();
            });
        }

        // Sound toggle
        var soundToggle = document.getElementById('sound-toggle');
        if (soundToggle) {
            soundToggle.checked = soundEnabled;
            soundToggle.addEventListener('change', function(e) {
                soundEnabled = e.target.checked;
                savePreferences();
                if (soundEnabled) playSound('move');
            });
        }

        // Puzzle mode
        var puzzleBtn = document.getElementById('puzzle-mode');
        if (puzzleBtn) puzzleBtn.addEventListener('click', function() { startPuzzle(); });
    }

    // PUZZLE MODE
    var puzzleMode = false;
    var puzzleSolution = [];
    var puzzleMoveIndex = 0;

    var PUZZLES = [
        { fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4', moves: ['h5f7'], name: 'Scholar\'s Mate' },
        { fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3', moves: ['f3g5'], name: 'Fried Lion' },
        { fen: 'rnbqkbnr/ppppp2p/8/5pp1/4P3/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 3', moves: ['e4f5'], name: 'King\'s Gambit' },
        { fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', moves: ['c4f7'], name: 'Legal Trap' },
        { fen: 'r2qk2r/ppp2ppp/2n1bn2/3pp3/8/2NPBNP1/PPP2PBP/R2QK2R w KQq - 0 8', moves: ['d1h5'], name: 'Damiano Defense' }
    ];

    function startPuzzle() {
        var puzzle = PUZZLES[Math.floor(Math.random() * PUZZLES.length)];
        loadPositionFromFEN(puzzle.fen);
        puzzleSolution = puzzle.moves;
        puzzleMoveIndex = 0;
        puzzleMode = true;
        showNotification('Puzzle: ' + puzzle.name + ' - Find the winning move!', 'info');
        playSound('hint');
    }

    function loadPositionFromFEN(fen) {
        // Parse FEN and set up board
        var parts = fen.split(' ');
        var rows = parts[0].split('/');
        board = Array(8).fill(null).map(function() { return Array(8).fill(null); });

        var pieceMap = { 'P': 'P', 'N': 'N', 'B': 'B', 'R': 'R', 'Q': 'Q', 'K': 'K', 'p': 'p', 'n': 'n', 'b': 'b', 'r': 'r', 'q': 'q', 'k': 'k' };

        for (var r = 0; r < 8; r++) {
            var rowStr = rows[7 - r];
            var c = 0;
            for (var i = 0; i < rowStr.length; i++) {
                var ch = rowStr[i];
                if (ch >= '1' && ch <= '8') {
                    c += parseInt(ch, 10);
                } else if (pieceMap[ch]) {
                    board[r][c] = pieceMap[ch];
                    c++;
                }
            }
        }

        currentPlayer = parts[1] === 'w' ? 'w' : 'b';
        selectedSquare = null;
        validMoves = [];
        gameOver = false;
        hintMove = null;
        moveHistory = [];
        puzzleMode = false;
        puzzleSolution = [];
        puzzleMoveIndex = 0;

        renderBoard();
        updateStatus();
        hideBanner();
    }

    function checkPuzzleMove(move) {
        if (!puzzleMode || puzzleMoveIndex >= puzzleSolution.length) return false;

        var expected = puzzleSolution[puzzleMoveIndex];
        var fromAlg = ChessEngine.toAlg(move.from[0], move.from[1]);
        var toAlg = ChessEngine.toAlg(move.to[0], move.to[1]);

        if (fromAlg + toAlg === expected || fromAlg + toAlg === expected.replace('x', '')) {
            puzzleMoveIndex++;
            if (puzzleMoveIndex >= puzzleSolution.length) {
                puzzleMode = false;
                puzzlesSolved++;
                showBanner('Puzzle Solved! +10 rating', 'win');
                showNotification('Puzzle completed!', 'success');
                updateRating(10);
                playSound('win');
                checkAchievements();
                return true;
            }
            showNotification('Correct! Find the next move...', 'info');
            playSound('move');
            return true;
        }
        return false;
    }

    // START
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
