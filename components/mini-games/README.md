# Mini-Games System

This directory contains a collection of interactive mini-games that users can play to unlock puzzle pieces in the Disrupt Asia 2025 puzzle experience.

## Games Available

### 1. Tic-Tac-Toe (`tic-tac-toe.tsx`)
- **Type**: Strategy & Logic
- **Difficulty**: Medium
- **Time Limit**: 120 seconds
- **Objective**: Beat the AI in a classic game of Tic-Tac-Toe
- **Features**: AI opponent with different difficulty levels, strategic gameplay

### 2. Rock, Paper, Scissors (`rock-paper-scissors.tsx`)
- **Type**: Strategy
- **Difficulty**: Easy
- **Time Limit**: 60 seconds
- **Objective**: Beat the AI by choosing the winning weapon
- **Features**: Classic RPS gameplay, AI opponent, win streak tracking, visual result display

### 5. Memory Match (`memory-match.tsx`)
- **Type**: Memory & Logic
- **Difficulty**: Medium
- **Time Limit**: 75 seconds
- **Objective**: Find 8 matching pairs of cards
- **Features**: Card flipping animation, efficiency scoring, memory challenge

### 6. Speed Tap (`speed-tap.tsx`)
- **Type**: Speed & Endurance
- **Difficulty**: Hard
- **Time Limit**: 45 seconds
- **Objective**: Tap 100 times as fast as possible
- **Features**: Real-time tap rate, combo system, speed tracking

## Game Selection System

### Game Manager (`game-manager.tsx`)
- Randomly selects a game from the available options
- Automatically assigns a game when the component mounts
- No user choice - games are randomized for variety
- Manages game state and transitions

## Usage

```tsx
import { GameManager } from '@/components/mini-games/game-manager'

<GameManager
  piece={piece}
  onSuccess={handleGameSuccess}
  onFailure={handleGameFailure}
  isSubmitting={isSubmitting}
  pieceSubmitted={pieceSubmitted}
/>
```

## Game Categories

- **Logic**: Strategic thinking and mathematical patterns
- **Strategy**: Tactical decision making and game theory
- **Memory**: Pattern recognition and visual recall
- **Speed**: Quick reflexes and timing

## Difficulty Levels

- **Easy**: Suitable for all users, forgiving time limits
- **Medium**: Balanced challenge, moderate time pressure
- **Hard**: High skill requirement, tight time constraints

## Features

- **Responsive Design**: Works on mobile and desktop
- **Touch Support**: Optimized for touch devices
- **Progress Tracking**: Real-time progress indicators
- **Scoring System**: Star ratings based on performance
- **Visual Feedback**: Animations and visual cues
- **Accessibility**: Clear instructions and feedback

## Adding New Games

To add a new mini-game:

1. Create a new component in this directory
2. Follow the existing interface pattern:
   ```tsx
   interface GameProps {
     piece: PuzzlePiece
     onSuccess: () => void
     onFailure: () => void
     isSubmitting?: boolean
     pieceSubmitted?: boolean
   }
   ```
3. Add the game to `game-selector.tsx` GAME_OPTIONS array
4. Add the game case to `game-manager.tsx` renderGame function
5. Export the component in `index.ts`

## Game States

All games follow a consistent state pattern:
- **waiting**: Game not started, showing instructions
- **playing**: Active gameplay
- **success**: Game completed successfully
- **failure**: Game failed (time ran out or objective not met)
