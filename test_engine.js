
const fs = require('fs');

// Read the files
const chessJs = fs.readFileSync('/Users/colbert1/chesstest/js/chess.js', 'utf8');
const aiJs = fs.readFileSync('/Users/colbert1/chesstest/js/ai.js', 'utf8');

// Create a mock browser environment
global.window = global;
global.document = {
    getElementById: () => ({ addEventListener: () => {} }),
    querySelectorAll: () => [],
    querySelector: () => null,
    createElement: () => ({ classList: { add: () => {}, remove: () => {} }, appendChild: () => {}, addEventListener: () => {} }),
    readyState: 'complete'
};
global.localStorage = { getItem: () => null, setItem: () => {} };

// Execute chess.js
eval(chessJs);
eval(aiJs);

// Test
console.log('Testing chess engine...');

// Initialize board
const board = ChessEngine.initialBoard();

// Check e2 pawn (row 6, col 4)
console.log('\nPiece at e2:', board[6][4]);

// Get all white moves
const whiteMoves = ChessEngine.legalMoves(board, 'w');
console.log('Total white moves:', whiteMoves.length);

// Filter moves for e2 pawn
const e2Moves = whiteMoves.filter(m => m.from[0] === 6 && m.from[1] === 4);
console.log('e2 pawn moves:', e2Moves.length);
console.log('e2 pawn move targets:', e2Moves.map(m => ChessEngine.toAlg(m.to[0], m.to[1])));

// Show first 5 moves
console.log('\nFirst 5 moves:');
whiteMoves.slice(0, 5).forEach(m => {
    console.log(`  ${ChessEngine.toAlg(m.from[0], m.from[1])} -> ${ChessEngine.toAlg(m.to[0], m.to[1])}`);
});
