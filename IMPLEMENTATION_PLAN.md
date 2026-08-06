# Implementation Plan: Top 5 Chessy Enhancements

## Phase 1: CSS & Visual Improvements

### 1. Smooth piece movement (Day 1)
**Files to modify:**
- css/style.css (add transitions)
- js/app.js (trigger animations)

**Implementation:**
```css
.sq .piece {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Visual improvement:** Pieces slide smoothly instead of jumping

### 2. Last move arrow (Day 1)
**Files to modify:**
- css/style.css (add .last-move arrow)
- js/app.js (update arrow on move)

**Implementation:**
```css
.sq.last-move::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  /* Draw arrow */
}
```

**Visual improvement:** Clear visual indicator of move history

### 3. Theme selector (Day 2)
**Files to modify:**
- index.html (add theme dropdown)
- css/style.css (add theme variables)
- js/app.js (theme switching logic)
- localStorage (save preference)

**Implementation:**
```javascript
const themes = {
  default: { '--sq-light': '#f0d9b5', '--sq-dark': '#b58863' },
  dark: { '--sq-light': '#4a4a4a', '--sq-dark': '#2a2a2a' },
  pastel: { '--sq-light': '#ffedcb', '--sq-dark': '#e6c99c' }
};
```

**Visual improvement:** User customization prevents eye strain

## Phase 2: Gameplay Enhancements

### 4. Puzzle mode (Day 3-4)
**Files to modify:**
- js/puzzles.js (new file - puzzle database)
- app.js (puzzle UI and logic)
- localStorage (daily puzzle tracking)

**Implementation:**
```javascript
const puzzles = [
  {
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    puzzle: 'mateIn1', // or mateIn2, mateIn3
    solution: [...],
    rating: 1200
  }
];
```

**Visual improvement:** Daily challenge drives return visits

### 5. Rating system (Day 5)
**Files to modify:**
- js/chess.js (add rating tracking)
- js/ai.js (adjust AI difficulty based on rating)
- app.js (Elo display and updates)
- localStorage (save rating history)

**Implementation:**
```javascript
function calculateElo(win, ratingA, ratingB) {
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const K = 32; // Standard K-factor
  return ratingA + K * (win ? 1 - expectedA : 0 - expectedA);
}
```

**Visual improvement:** Competitive element makes AI play meaningful

## Rollout Strategy

**Week 1:** Complete CSS & Visual improvements (Days 1-2)
**Week 2:** Add Theme selector (Day 3)
**Week 3:** Launch Puzzle mode (Days 4-5)
**Week 4:** Complete Rating system
**Week 5:** Polish, test, iterate

**Expected Impact:**
- **Day 1-2:** Visual polish, better UX
- **Day 3:** User customization
- **Day 4-5:** Daily engagement + competitive play
- **Full rollout:** Transform from basic to delightful experience
