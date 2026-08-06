# Chessy ♟️

A simple, cute chess game — vanilla JavaScript chess engine with AI, pastel theme, and playful UI.

## Features

- **Full chess rules**: castling, en passant, promotion, check/checkmate/stalemate, 50-move rule, insufficient material draws
- **Cute pastel UI**: warm cream and coral board, soft pink highlights, animated move dots
- **Play vs Computer**: three difficulty levels (Easy/Medium/Hard) with a minimax AI + alpha-beta pruning
- **Two-player mode**: play against a friend on the same device
- **Move history**: algebraic notation (SAN) with check/checkmate markers
- **Undo**: step back through moves (undoes AI moves too in vs-computer mode)
- **Promotion picker**: cute modal to choose queen, rook, bishop, or knight
- **Sounds**: subtle WebAudio pops for moves, captures, and wins
- **Responsive**: works on desktop and mobile

## How to Play

1. Open `index.html` in a browser (no build step needed)
2. Click a piece to select it — legal moves appear as green dots
3. Click a target square to move
4. For promotions, pick your piece from the modal
5. Toggle "Play vs Computer" to challenge the AI

## Tech Stack

- Pure HTML/CSS/JavaScript — no frameworks, no build tools
- Chess engine: ~300 lines of vanilla JS
- AI: minimax with alpha-beta pruning + piece-square tables
- Theme: CSS custom properties, pastel palette

## Credits

Made by [sirshibaninja](https://x.com/sirshibaninja)

## License

MIT
