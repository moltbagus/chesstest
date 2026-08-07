
const fs = require('fs');

// Read chess.js
let chessJs = fs.readFileSync('/Users/colbert1/chesstest/js/chess.js', 'utf8');

// Create minimal mock
global.window = global;
global.document = {};
global.localStorage = { getItem: () => null, setItem: () => {} };
global.console = console;

// Execute chess.js
eval(chessJs);

// Test step by step
console.log('=== DEBUGGING chess.js ===\n');

// 1. Check initialBoard
const board = ChessEngine.initialBoard();
console.log('1. initialBoard:');
console.log('   Row 0 (black back rank):', board[0]);
console.log('   Row 1 (black pawns):', board[1]);
console.log('   Row 6 (white pawns):', board[6]);
console.log('   Row 7 (white back rank):', board[7]);

// 2. Check pieceColor
console.log('\n2. pieceColor tests:');
console.log('   pieceColor("P"):', ChessEngine.pieceColor("P"));
console.log('   pieceColor("p"):', ChessEngine.pieceColor("p"));
console.log('   pieceColor("K"):', ChessEngine.pieceColor("K"));
console.log('   pieceColor("k"):', ChessEngine.pieceColor("k"));

// 3. Check pseudoMoves for e2 pawn (row 6, col 4)
console.log('\n3. pseudoMoves for e2 pawn:');
const piece = board[6][4];
console.log('   Piece at e2:', piece);
const pseudo = ChessEngine.pseudoMoves ? ChessEngine.pseudoMoves(board, 6, 4, 'w') : 'NOT FOUND';
console.log('   pseudoMoves result:', pseudo);

// 4. Try to call legalMoves
console.log('\n4. legalMoves for white:');
try {
    const moves = ChessEngine.legalMoves(board, 'w');
    console.log('   Result:', moves.length, 'moves');
} catch(e) {
    console.log('   ERROR:', e.message);
}

// 5. Check if isInCheck works
console.log('\n5. isInCheck for white:');
try {
    const inCheck = ChessEngine.isInCheck(board, 'w');
    console.log('   isInCheck:', inCheck);
} catch(e) {
    console.log('   ERROR:', e.message);
}
