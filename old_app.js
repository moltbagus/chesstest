/* app.js — Chessy main application */
"use strict";

// Wait for DOM
document.addEventListener("DOMContentLoaded", function() {
    console.log("Chessy initializing...");

    // =======================================================================
    // CONFIGURATION
    // =======================================================================

    const CONFIG = {
        aiDepth: 3,
        animDuration: 150
    };

    // =======================================================================
    // GAME STATE
    // =======================================================================

    let board = null;
    let currentPlayer = "w";
    let selectedSquare = null;
    let validMoves = [];
    let gameOver = false;
    let moveHistory = [];
    let lastMove = null;

    // Rating system
    let playerRating = 1200;
    let gamesPlayed = 0;
    let gamesWon = 0;

    // Puzzle mode
    let puzzleMode = false;
    let puzzleMoves = [];
    let puzzleIndex = 0;
    let puzzleStartTime = null;
    let puzzleScore = 0;

    // =======================================================================
    // THEME MANAGEMENT
    // =======================================================================

    const THEMES = {
        default: {
            name: "Default (Classic)",
            light: "#f0d9b5",
            dark: "#b58863",
            pieces: "default"
        },
        dark: {
            name: "Dark Mode",
            light: "#4a4a4a",
            dark: "#2d2d2d",
            pieces: "default"
        },
        pastel: {
            name: "Pastel",
            light: "#f5e6d3",
            dark: "#d4a574",
            pieces: "default"
        },
        "high-contrast": {
            name: "High Contrast",
            light: "#ffffff",
            dark: "#000000",
            pieces: "default"
        },
        wood: {
            name: "Wood",
            light: "#deb887",
            dark: "#8b4513",
            pieces: "default"
        },
        neon: {
            name: "Neon",
            light: "#1a1a2e",
            dark: "#16213e",
            accent: "#0f3460",
            pieces: "default"
        }
    };

    let currentTheme = "default";
    let currentPieceStyle = "default";

    // Load saved preferences
    function loadPreferences() {
        const savedTheme = localStorage.getItem("chesstest-theme") || "default";
        const savedStyle = localStorage.getItem("chesstest-piece-style") || "default";
        const savedRating = localStorage.getItem("chesstest-rating");

        if (savedTheme && THEMES[savedTheme]) {
            currentTheme = savedTheme;
        }
        if (savedStyle) {
            currentPieceStyle = savedStyle;
        }
        if (savedRating) {
            playerRating = parseInt(savedRating, 10);
        }

        applyTheme(currentTheme);
        applyPieceStyle(currentPieceStyle);
        updateRatingDisplay();
    }

    // Apply theme
    function applyTheme(themeName) {
        const theme = THEMES[themeName];
        if (!theme) return;

        currentTheme = themeName;
        localStorage.setItem("chesstest-theme", themeName);

        document.documentElement.style.setProperty("--light-square", theme.light);
        document.documentElement.style.setProperty("--dark-square", theme.dark);

        if (theme.accent) {
            document.documentElement.style.setProperty("--accent", theme.accent);
        } else {
            document.documentElement.style.removeProperty("--accent");
        }

        // Update theme select
        const select = document.getElementById("theme-select");
        if (select) select.value = themeName;
    }

    // Apply piece style
    function applyPieceStyle(style) {
        currentPieceStyle = style;
        localStorage.setItem("chesstest-piece-style", style);

        const pieceStyleSelect = document.getElementById("piece-style-select");
        if (pieceStyleSelect) pieceStyleSelect.value = style;

        renderBoard();
    }

    // =======================================================================
    // PIECE RENDERING
    // =======================================================================

    // Unicode chess pieces
    const PIECES_UNICODE = {
        "K": "♔", "Q": "♕", "R": "♖", "B": "♗", "N": "♘", "P": "♙",
        "k": "♚", "q": "♛", "r": "♜", "b": "♝", "n": "♞", "p": "♟"
    };

    // Get piece character
    function getPieceChar(piece) {
        if (!piece) return "";

        if (currentPieceStyle === "emoji") {
            return PIECES_UNICODE[piece] || piece;
        }

        return PIECES_UNICODE[piece] || piece;
    }

    // =======================================================================
    // BOARD RENDERING
    // =======================================================================

    function renderBoard() {
        const boardEl = document.getElementById("board");
        if (!boardEl || !board) return;

        boardEl.innerHTML = "";

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const square = document.createElement("div");
                square.className = "square";
                square.dataset.row = r;
                square.dataset.col = c;

                // Square colors
                const isLight = (r + c) % 2 === 0;
                square.classList.add(isLight ? "light" : "dark");

                // Selected square
                if (selectedSquare && selectedSquare[0] === r && selectedSquare[1] === c) {
                    square.classList.add("selected");
                }

                // Valid moves
                if (validMoves.some(m => m[0] === r && m[1] === c)) {
                    square.classList.add("valid-move");
                    // Check if it's a capture
                    if (board[r][c]) {
                        square.classList.add("capture");
                    }
                }

                // Last move highlight
                if (lastMove) {
                    if ((r === lastMove.from[0] && c === lastMove.from[1]) ||
                        (r === lastMove.to[0] && c === lastMove.to[1])) {
                        square.classList.add("last-move");
                    }
                }

                // Piece
                const piece = board[r][c];
                if (piece) {
                    const pieceEl = document.createElement("span");
                    pieceEl.className = "piece";
                    pieceEl.textContent = getPieceChar(piece);
                    pieceEl.dataset.piece = piece;
                    square.appendChild(pieceEl);
                }

                // Click handler
                square.addEventListener("click", () => handleSquareClick(r, c));

                boardEl.appendChild(square);
            }
        }
    }

    // =======================================================================
    // GAME LOGIC
    // =======================================================================

    function initGame() {
        board = ChessEngine.initialBoard();
        currentPlayer = "w";
        selectedSquare = null;
        validMoves = [];
        gameOver = false;
        moveHistory = [];
        lastMove = null;
        puzzleMode = false;

        renderBoard();
        updateStatus();
        clearBanner();

        console.log("Game initialized");
    }

    function handleSquareClick(row, col) {
        if (gameOver) {
            initGame();
            return;
        }

        // Puzzle mode - only allow correct moves
        if (puzzleMode) {
            handlePuzzleMove(row, col);
            return;
        }

        // Only human plays white
        if (currentPlayer !== "w") return;

        const piece = board[row][col];

        // If clicking on own piece, select it
        if (piece && ChessEngine.pieceColor(piece) === "w") {
            selectedSquare = [row, col];
            const moves = ChessEngine.legalMoves(board, "w");
            validMoves = moves
                .filter(m => m.from[0] === row && m.from[1] === col)
                .map(m => m.to);
            renderBoard();
            return;
        }

        // If a square is selected and clicking on valid move
        if (selectedSquare) {
            const isValid = validMoves.some(m => m[0] === row && m[1] === col);

            if (isValid) {
                // Make the move
                makeHumanMove(selectedSquare[0], selectedSquare[1], row, col);
            }
        }

        // Clear selection
        selectedSquare = null;
        validMoves = [];
        renderBoard();
    }

    function makeHumanMove(fromR, fromC, toR, toC) {
        const piece = board[fromR][fromC];

        // Create move object
        const move = {
            from: [fromR, fromC],
            to: [toR, toC],
            piece: piece,
            captured: board[toR][toC]
        };

        // Make move
        ChessEngine.makeMove(board, move);
        lastMove = move;
        moveHistory.push(move);

        // Switch player
        currentPlayer = "b";
        selectedSquare = null;
        validMoves = [];

        renderBoard();
        updateStatus();

        // AI move
        setTimeout(makeAIMove, 500);
    }

    function makeAIMove() {
        if (gameOver || currentPlayer !== "b") return;

        console.log("AI thinking...");

        const move = ChessAI.getBestMove(board, CONFIG.aiDepth, ChessEngine);

        if (!move) {
            // No legal moves - game over
            handleGameOver();
            return;
        }

        // Make move
        ChessEngine.makeMove(board, move);
        lastMove = move;
        moveHistory.push(move);

        // Switch player
        currentPlayer = "w";

        renderBoard();
        updateStatus();

        // Check game state
        const state = ChessEngine.gameState(board, "w");
        if (state === "checkmate" || state === "stalemate") {
            handleGameOver();
        }
    }

    function handleGameOver() {
        const state = ChessEngine.gameState(board, "w");

        gameOver = true;

        if (state === "checkmate") {
            // White is in checkmate, black wins
            showBanner("Checkmate! Black wins!", "loss");
            updateRating(-20);
        } else if (state === "stalemate") {
            showBanner("Stalemate! Draw.", "draw");
        } else {
            const blackState = ChessEngine.gameState(board, "b");
            if (blackState === "checkmate") {
                showBanner("Checkmate! You win!", "win");
                updateRating(25);
            }
        }
    }

    function updateStatus() {
        const statusEl = document.getElementById("status");
        if (!statusEl) return;

        let status = currentPlayer === "w" ? "Your turn" : "AI thinking...";

        if (gameOver) {
            status = "Game over";
        }

        statusEl.textContent = status;
    }

    function showBanner(message, type) {
        const banner = document.getElementById("banner");
        if (!banner) return;

        banner.textContent = message;
        banner.className = "banner " + type;
        banner.classList.remove("hidden");

        gamesPlayed++;
        localStorage.setItem("chesstest-games-played", gamesPlayed);
    }

    function clearBanner() {
        const banner = document.getElementById("banner");
        if (banner) {
            banner.classList.add("hidden");
        }
    }

    // =======================================================================
    // RATING SYSTEM
    // =======================================================================

    function updateRating(delta) {
        playerRating += delta;
        localStorage.setItem("chesstest-rating", playerRating);

        if (delta > 0) {
            gamesWon++;
        }

        localStorage.setItem("chesstest-games-won", gamesWon);
        updateRatingDisplay();
    }

    function updateRatingDisplay() {
        const ratingEl = document.getElementById("rating");
        if (ratingEl) {
            ratingEl.textContent = playerRating;
        }

        const gamesEl = document.getElementById("games-played");
        if (gamesEl) {
            gamesEl.textContent = gamesPlayed;
        }
    }

    // =======================================================================
    // PUZZLE MODE
    // =======================================================================

    const PUZZLES = [
        { moves: ["e2e4", "e7e5", "d1h5", "b8c6", "h5f7"] }, // Scholar's mate
        { moves: ["d2d4", "d7d5", "c1f4", "c8f5", "f4g3"] }, // Fool's Mate setup
        { moves: ["e2e3", "e7e5", "d1h5", "a7a6", "h5a5"] }, // Simple tactics
    ];

    function startPuzzle(puzzleIndex) {
        const puzzle = PUZZLES[puzzleIndex % PUZZLES.length];

        board = ChessEngine.initialBoard();
        currentPlayer = "w";
        selectedSquare = null;
        validMoves = [];
        gameOver = false;
        lastMove = null;
        puzzleMode = true;
        puzzleMoves = puzzle.moves;
        puzzleIndex = 0;
        puzzleStartTime = Date.now();
        puzzleScore = 0;

        renderBoard();
        updateStatus();

        console.log("Puzzle started!");
    }

    function handlePuzzleMove(row, col) {
        if (!selectedSquare) {
            // Select a piece
            const piece = board[row][col];
            if (piece && ChessEngine.pieceColor(piece) === currentPlayer) {
                selectedSquare = [row, col];
                const moves = ChessEngine.legalMoves(board, currentPlayer);
                validMoves = moves
                    .filter(m => m.from[0] === row && m.from[1] === col)
                    .map(m => m.to);
                renderBoard();
            }
            return;
        }

        // Try to make the expected move
        const expectedMove = puzzleMoves[puzzleIndex];
        const [fromR, fromC] = ChessEngine.toRC(expectedMove.substring(0, 2));
        const [toR, toC] = ChessEngine.toRC(expectedMove.substring(2, 4));

        // Check if this is the expected move
        if (row === toR && col === toC) {
            const move = {
                from: [fromR, fromC],
                to: [toR, toC],
                piece: board[fromR][fromC],
                captured: board[toR][toC]
            };

            ChessEngine.makeMove(board, move);
            lastMove = move;
            puzzleIndex++;
            selectedSquare = null;
            validMoves = [];

            renderBoard();

            if (puzzleIndex >= puzzleMoves.length) {
                // Puzzle solved!
                const timeTaken = (Date.now() - puzzleStartTime) / 1000;
                puzzleScore = Math.max(100 - Math.floor(timeTaken), 10);
                showBanner("Puzzle solved! +" + puzzleScore + " points", "win");
            } else {
                // AI responds
                currentPlayer = "b";
                setTimeout(makeAIMove, 300);
            }
        } else {
            // Wrong move
            showBanner("Wrong move! Try again.", "loss");
            selectedSquare = null;
            validMoves = [];
            renderBoard();
        }
    }

    // =======================================================================
    // SETTINGS PANEL
    // =======================================================================

    function setupSettings() {
        // Theme selector
        const themeSelect = document.getElementById("theme-select");
        if (themeSelect) {
            // Populate options
            Object.keys(THEMES).forEach(themeKey => {
                const option = document.createElement("option");
                option.value = themeKey;
                option.textContent = THEMES[themeKey].name;
                themeSelect.appendChild(option);
            });

            themeSelect.addEventListener("change", (e) => {
                applyTheme(e.target.value);
            });
        }

        // Piece style selector
        const styleSelect = document.getElementById("piece-style-select");
        if (styleSelect) {
            styleSelect.addEventListener("change", (e) => {
                applyPieceStyle(e.target.value);
            });
        }

        // New game button
        const newGameBtn = document.getElementById("new-game");
        if (newGameBtn) {
            newGameBtn.addEventListener("click", initGame);
        }

        // Puzzle mode button
        const puzzleBtn = document.getElementById("puzzle-mode");
        if (puzzleBtn) {
            puzzleBtn.addEventListener("click", () => {
                startPuzzle(Math.floor(Math.random() * PUZZLES.length));
            });
        }
    }

    // =======================================================================
    // INITIALIZATION
    // =======================================================================

    function init() {
        console.log("Chessy starting...");

        loadPreferences();
        setupSettings();
        initGame();

        console.log("Chessy ready!");
    }

    // Start when DOM is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
});
