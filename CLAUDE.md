# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

This is a static HTML/CSS/JS site with zero build requirements:

- **Local Development**: Open `index.html` in any browser
- **Testing**: Manual verification by interacting with the game in browser
- **Deployment**: 
  - Preview: `vercel` (from project root)
  - Production: `vercel --prod`
  - Alternative: Connect GitHub repo to Vercel for automatic deployments

No linting, testing, or build tools are configured as the project has zero dependencies and requires no compilation.

## Code Architecture

### Core Structure
- **index.html**: Main UI structure with board container, settings panel, and status bar
- **css/style.css**: All styling including themes, animations, and responsive layout via CSS custom properties
- **js/chess.js**: Pure vanilla chess engine managing internal board state, move generation/validation, castling, en passant, and promotion
- **js/ai.js**: Minimax AI with alpha-beta pruning and piece-square tables for move evaluation
- **js/app.js**: Application logic handling UI events, game state, theme persistence, hint system, and AI move timing

### Key Patterns
- **State Management**: Chess engine maintains internal `_board`, `_castling`, and `_ep` variables; app.js manages UI state (`selectedSquare`, `validMoves`, `gameOver`, etc.)
- **Immutability Preference**: While the chess engine mutates internal state for performance (typical for game engines), the app layer treats board data as immutable when passing between functions
- **Event Delegation**: Board uses event delegation pattern where each square gets a click handler that captures its coordinates
- **Theme System**: CSS custom properties (`--light-square`, `--dark-square`) updated via JavaScript to switch themes instantly
- **Persistence**: User preferences (theme, rating, game count) stored in `localStorage` and loaded on initialization

### Data Flow
1. User clicks square → `handleSquareClick()` in app.js
2. If selecting piece: Calculate legal moves via `ChessEngine.legalMoves()` → highlight valid squares
3. If moving piece: Validate move → `ChessEngine.makeMove()` → switch player → check game state
4. If AI's turn: `setTimeout(makeAIMove, 500)` → `ChessAI.getBestMove()` → `ChessEngine.makeMove()` → update UI
5. Game over conditions checked via `ChessEngine.gameState()` after each move

### Extension Points
- To add new theme: Add to `themes` object in app.js and corresponding option in HTML
- To modify AI difficulty: Adjust depth parameter in `getBestMove()` calls (currently 3 for AI, 2 for hints)
- To add new game mode: Extend `initGame()` and add UI controls in settings panel

## Vercel Deployment
The site is configured as a static site in `vercel.json` using `@vercel/static` builder. All files are served as-is with aggressive caching (1 year immutable for assets). No server-side code or build steps are required.