# Chessy - Technical Specifications

## 🏗️ System Architecture

### Frontend Stack
```
HTML5 + Vanilla JavaScript + CSS3
No external frameworks or libraries
Progressive Enhancement approach
```

### Backend
```
No backend required - Client-side only
Static site deployment
WebAudio API for sound generation
LocalStorage for persistence (rating, XP, level, streaks, theme)
```

### Deployment
```
Target: Vercel (mentioned in conversation)
Build: Static export
CDN: Edge distribution
```

## 📁 Project Structure
```
chessy/
├── index.html                    # Main application
├── css/
│   ├── style.css                # Main styles + themes + XP bar
│   └── (no subdirs)             # Flat structure
├── js/
│   ├── chess.js                 # Chess engine
│   ├── ai.js                    # AI opponent logic
│   ├── app.js                   # Game management + UI + gamification
│   └── puzzles.js               # Puzzle database and logic
├── assets/                      # Static assets (if any)
├── README.md                    # Documentation
├── TODO.md                      # Task management
├── IMPLEMENTATION_PLAN.md       # Development roadmap
├── PRD.md                      # Product requirements
├── spec.md                     # Technical specs (this file)
├── kanban.md                    # Sprint tracking
├── learnings.md                 # Development insights
└── .gitignore                  # Version control
```

## 🔧 Core Technologies

### Web APIs Used
- **WebAudio API**: Sound generation and playback
- **Canvas API**: Not used (CSS-based rendering)
- **Web Storage API**: Local preferences and game save
- **Animation API**: CSS transforms and transitions

### Development Tools
- **Node.js**: For local development server
- **Git**: Version control

## 🧒 Kid Gamification Layer (Current)

### State Variables (app.js)
- `playerXP`, `playerLevel` — persisted progression
- `currentOpponent` — cute animal chosen by level (Bunny, Fox, Panda, Dragon)
- `winStreak`, `puzzlesSolved` — achievement triggers

### UI Additions
- Level display + dynamic XP progress bar
- Opponent name + emoji shown in status
- Confetti launcher on every player win
- Achievement toast notifications

### Opponent Scaling
Level 1-2 → Bunny (easy)  
Level 3-4 → Fox  
Level 5-6 → Panda  
Level 7+ → Dragon (hard)
- **Vercel CLI**: Deployment
- **Modern browser**: Chrome, Firefox, Safari, Edge

## 📊 Data Flow

### Client-Side Data Storage
```javascript
// Local Storage Keys
'chesstest-theme'                    // User theme preference
'chesstest-rating-progress'          // Elo rating history
'chesstest-puzzle-progress'         // Puzzle completion state
'chesstest-game-history'             // Game session history
```

### Runtime Data Flow
1. User actions → Event handlers → Game logic → State update → Render
2. AI moves → Chess engine → Animation → Sound effects
3. Puzzle solving → Validation → Scoring → State update
4. Theme switching → CSS variable update → Re-render

## 🎨 UI/UX Design System

### Color System
```css
:root {
  /* Core theme */
  --sq-light: #f0d9b5;
  --sq-dark: #b58863;
  --sq-light-hover: #ffeb99;
  --sq-dark-hover: #d4af37;

  /* Accent colors */
  --ring: #4169e1;        /* Royal blue */
  --ink: #2d1b0d;        /* Dark brown */
  --ink-soft: #7c6a86;   /* Medium brown */

  /* Supporting colors */
  --bg: #faf8f5;          /* Off-white */
  --card: #ffffff;        /* Card background */
  --border: #d4c5a5;      /* Subtle border */
}
```

### Typography
```css
.font-display {
  font-family: "Baloo 2", "Quicksand", "Nunito", system-ui, sans-serif;
  font-weight: 600-800;
  letter-spacing: -0.02em;
}

.font-body {
  font-family: "Quicksand", "Nunito", system-ui, sans-serif;
  font-weight: 400-600;
}
```

## 🔒 Security Architecture

### Threat Model
- **Client-side data**: Local storage only (no server)
- **Input validation**: All user inputs validated
- **XSS protection**: Content security policy headers
- **No external dependencies**: Zero third-party risk

### Security Features
- No API keys or secrets
- No external network requests (except Vercel deployment)
- Sanitized HTML/CSS generation
- Client-side only logic

## 📈 Performance Targets

### Core Web Vitals
- **LCP**: < 1.5 seconds
- **FID**: < 100ms
- **CLS**: < 0.1
- **TTFB**: < 0.8 seconds

### Resource Budgets
- **HTML**: < 50KB
- **CSS**: < 100KB (gzipped)
- **JavaScript**: < 200KB (gzipped)
- **Images**: None (SVG/CSS art)

## 🔄 Development Workflow

### Sprint Process
1. **Morning**: Review backlog, plan day
2. **Coding**: Implement features in phases
3. **Testing**: Unit and integration tests
4. **Review**: Code quality and UX testing
5. **Deploy**: Vercel preview deployment
6. **Documentation**: Update PRD/spec

### Code Standards
```javascript
// ES6+ JavaScript
const const = immutable values
let for variables that change
arrow functions for callbacks
modular pattern for organization
```

```css
/* CSS custom properties for theming
/* BEM naming convention
/* Mobile-first approach
/* CSS variables for runtime theming
```

## 📊 Monitoring & Analytics

### Usage Analytics
- **Page views**: Vercel analytics
- **Conversion events**: Puzzle completion, game start
- **Error tracking**: Client-side error reporting
- **Performance monitoring**: Core Web Vitals

### Health Checks
- **Automated tests**: CI/CD pipeline
- **Load testing**: Vercel built-in
- **Accessibility audits**: Regular testing
- **Security scans**: Dependency scanning

## 🚀 Deployment Pipeline

### Environment Setup
```bash
# Local development
npm run dev
# Build for production
npm run build
# Deploy to Vercel
npx vercel --prod
```

### Deployment Targets
- **Staging**: Vercel preview URLs
- **Production**: Custom domain
- **Preview**: GitHub Actions workflow

## 🔄 Version Control

### Branch Strategy
```
main/              # Production-ready code
feature/           # New features
bugfix/           # Hot fixes
experimental/     # Proof of concepts
```

### Commit Conventions
```
feat: new feature
fix: bug fix
docs: documentation
style: formatting, missing semi colons
refactor: code refactor
perf: performance improvement
test: adding tests
chore: maintenance tasks
```

---
*Document Version: 1.0*
*Last Updated: {timestamp}*
*Author: Development Team*
