/* app.js — Chessy main application */
(function() {
    'use strict';

    // =======================================================================
    // STATE
    // =======================================================================

    var board = null;
    var currentPlayer = 'w';
    var selectedSquare = null;
    var validMoves = [];
    var gameOver = false;
    var hintMove = null;

    // Rating
    var playerRating = 1200;
    var gamesPlayed = 0;
    var gamesWon = 0;

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

    // Pieces unicode
    var PIECES = {
        'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
        'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
    };

    // =======================================================================
    // INITIALIZE
    // =======================================================================

    function init() {
        console.log('Chessy initializing...');

        loadPreferences();
        setupThemeSelector();
        setupPieceStyleSelector();
        setupButtons();

        initGame();

        console.log('Chessy ready!');
    }

    function loadPreferences() {
        var savedTheme = localStorage.getItem('chesstest-theme');
        if (savedTheme && themes[savedTheme]) {
            currentTheme = savedTheme;
        }

        var savedRating = localStorage.getItem('chesstest-rating');
        if (savedRating) playerRating = parseInt(savedRating, 10);

        var savedGames = localStorage.getItem('chesstest-games-played');
        if (savedGames) gamesPlayed = parseInt(savedGames, 10);

        applyTheme(currentTheme);
    }

    // =======================================================================
    // GAME
    // =======================================================================

    function initGame() {
        console.log('Starting new game...');

        board = ChessEngine.initialBoard();
        currentPlayer = 'w';
        selectedSquare = null;
        validMoves = [];
        gameOver = false;
        hintMove = null;

        renderBoard();
        updateStatus();
        hideBanner();

        console.log('Game started!');
    }

    function renderBoard() {
        var boardEl = document.getElementById('board');
        if (!boardEl) {
            console.error('Board element not found!');
            return;
        }

        boardEl.innerHTML = '';

        for (var r = 0; r < 8; r++) {
            for (var c = 0; c < 8; c++) {
                var square = document.createElement('div');
                square.className = 'square';
                square.dataset.row = r;
                square.dataset.col = c;

                if ((r + c) % 2 === 0) {
                    square.classList.add('light');
                } else {
                    square.classList.add('dark');
                }

                // Hint highlighting
                if (hintMove) {
                    if (r === hintMove.from[0] && c === hintMove.from[1]) {
                        square.classList.add('hint-from');
                    }
                    if (r === hintMove.to[0] && c === hintMove.to[1]) {
                        square.classList.add('hint');
                    }
                }

                // Selected
                if (selectedSquare && selectedSquare[0] === r && selectedSquare[1] === c) {
                    square.classList.add('selected');
                }

                // Valid moves
                for (var i = 0; i < validMoves.length; i++) {
                    if (validMoves[i][0] === r && validMoves[i][1] === c) {
                        square.classList.add('valid-move');
                        if (board[r][c]) {
                            square.classList.add('capture');
                        }
                    }
                }

                // Piece
                var piece = board[r][c];
                if (piece) {
                    var pieceEl = document.createElement('span');
                    pieceEl.className = 'piece';
                    pieceEl.textContent = PIECES[piece] || piece;
                    square.appendChild(pieceEl);
                }

                // Click
                var row = r, col = c;
                square.addEventListener('click', (function(r, c) {
                    return function() { handleSquareClick(r, c); };
                })(row, col));

                boardEl.appendChild(square);
            }
        }

        var ratingEl = document.getElementById('rating');
        if (ratingEl) ratingEl.textContent = playerRating;

        var gamesEl = document.getElementById('games-played');
        if (gamesEl) gamesEl.textContent = gamesPlayed;
    }

    function handleSquareClick(row, col) {
        if (gameOver) {
            initGame();
            return;
        }

        // Clear hint when user makes a move
        if (hintMove) {
            hintMove = null;
            renderBoard();
        }

        var piece = board[row][col];

        if (piece && ChessEngine.pieceColor(piece) === currentPlayer) {
            selectedSquare = [row, col];
            var moves = ChessEngine.legalMoves(board, currentPlayer);
            validMoves = [];
            for (var i = 0; i < moves.length; i++) {
                if (moves[i].from[0] === row && moves[i].from[1] === col) {
                    validMoves.push(moves[i].to);
                }
            }
            renderBoard();
            return;
        }

        if (selectedSquare) {
            var isValid = false;
            for (var i = 0; i < validMoves.length; i++) {
                if (validMoves[i][0] === row && validMoves[i][1] === col) {
                    isValid = true;
                    break;
                }
            }

            if (isValid) {
                makeMove(selectedSquare[0], selectedSquare[1], row, col);
            }
        }

        selectedSquare = null;
        validMoves = [];
        renderBoard();
    }

    function makeMove(fromR, fromC, toR, toC) {
        var piece = board[fromR][fromC];

        var move = {
            from: [fromR, fromC],
            to: [toR, toC],
            piece: piece,
            captured: board[toR][toC]
        };

        ChessEngine.makeMove(board, move);
        currentPlayer = currentPlayer === 'w' ? 'b' : 'w';
        selectedSquare = null;
        validMoves = [];

        renderBoard();
        updateStatus();

        var state = ChessEngine.gameState(board, currentPlayer);
        if (state === 'checkmate' || state === 'stalemate') {
            handleGameOver(state);
            return;
        }

        if (currentPlayer === 'b' && !gameOver) {
            setTimeout(makeAIMove, 500);
        }
    }

    function makeAIMove() {
        if (gameOver || currentPlayer !== 'b') return;

        console.log('AI thinking...');

        var move = ChessAI.getBestMove(board, 3, ChessEngine);

        if (!move) {
            handleGameOver('checkmate');
            return;
        }

        ChessEngine.makeMove(board, move);
        currentPlayer = 'w';

        renderBoard();
        updateStatus();

        var state = ChessEngine.gameState(board, 'w');
        if (state === 'checkmate' || state === 'stalemate') {
            handleGameOver(state);
        }
    }

    function handleGameOver(state) {
        gameOver = true;

        if (state === 'checkmate') {
            if (currentPlayer === 'w') {
                showBanner('Checkmate! You win!', 'win');
                updateRating(25);
            } else {
                showBanner('Checkmate! AI wins!', 'loss');
                updateRating(-20);
            }
        } else {
            showBanner('Stalemate! Draw.', 'draw');
        }
    }

    function updateRating(delta) {
        playerRating = Math.max(100, playerRating + delta);
        gamesPlayed++;

        if (delta > 0) {
            gamesWon++;
            localStorage.setItem('chesstest-games-won', gamesWon);
        }

        localStorage.setItem('chesstest-rating', playerRating);
        localStorage.setItem('chesstest-games-played', gamesPlayed);
    }

    function updateStatus() {
        var statusEl = document.getElementById('status');
        if (statusEl) {
            statusEl.textContent = currentPlayer === 'w' ? 'Your turn' : 'AI thinking...';
        }
    }

    function showBanner(message, type) {
        var banner = document.getElementById('banner');
        if (banner) {
            banner.textContent = message;
            banner.className = 'banner ' + type;
        }
    }

    function hideBanner() {
        var banner = document.getElementById('banner');
        if (banner) {
            banner.className = 'banner hidden';
        }
    }

    // =======================================================================
    // HINT SYSTEM
    // =======================================================================

    function showHint() {
        if (gameOver || currentPlayer !== 'w') {
            alert('No hint available right now!');
            return;
        }

        console.log('Finding a hint...');

        // Get AI's best move as a hint
        var hint = ChessAI.getBestMove(board, 2, ChessEngine);

        if (hint) {
            hintMove = hint;
            renderBoard();

            // Show piece name
            var pieceName = getPieceName(hint.piece);
            var fromAlg = ChessEngine.toAlg(hint.from[0], hint.from[1]);
            var toAlg = ChessEngine.toAlg(hint.to[0], hint.to[1]);

            console.log('Hint: ' + pieceName + ' from ' + fromAlg + ' to ' + toAlg);
        } else {
            alert('No hint available - try making a move!');
        }
    }

    function getPieceName(piece) {
        var names = {
            'K': 'King', 'Q': 'Queen', 'R': 'Rook',
            'B': 'Bishop', 'N': 'Knight', 'P': 'Pawn',
            'k': 'King', 'q': 'Queen', 'r': 'Rook',
            'b': 'Bishop', 'n': 'Knight', 'p': 'Pawn'
        };
        return names[piece] || 'Piece';
    }

    // =======================================================================
    // THEMES
    // =======================================================================

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
        themeSelect.addEventListener('change', function(e) {
            applyTheme(e.target.value);
        });
    }

    function setupPieceStyleSelector() {
        var styleSelect = document.getElementById('piece-style-select');
        if (styleSelect) {
            styleSelect.addEventListener('change', function(e) {
                localStorage.setItem('chesstest-piece-style', e.target.value);
                renderBoard();
            });
        }
    }

    // =======================================================================
    // BUTTONS
    // =======================================================================

    function setupButtons() {
        var newGameBtn = document.getElementById('new-game');
        if (newGameBtn) {
            newGameBtn.addEventListener('click', function() {
                console.log('New Game clicked!');
                initGame();
            });
        }

        var puzzleBtn = document.getElementById('puzzle-mode');
        if (puzzleBtn) {
            puzzleBtn.addEventListener('click', function() {
                alert('Puzzle mode coming soon!');
            });
        }

        var hintBtn = document.getElementById('hint');
        if (hintBtn) {
            hintBtn.addEventListener('click', function() {
                console.log('Hint clicked!');
                showHint();
            });
        }
    }

    // =======================================================================
    // START
    // =======================================================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
