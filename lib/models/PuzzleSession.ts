import mongoose, { Schema, Document } from 'mongoose';

export interface IPuzzleSession extends Document {
  puzzleId: mongoose.Types.ObjectId;
  sessionId: string;
  isActive: boolean;
  startedAt: Date;
  endedAt?: Date;
  currentState: {
    placedPieces: string[];
    lastPiecePlacedAt?: Date;
    completionPercentage: number;
    unlockedPieces: string[];
  };
  settings: {
    maxPlayers: number;
    allowSpectators: boolean;
    timeLimit?: number; // in minutes
  };
  // Exhibition tracking
  exhibitionId: string;
  visitorCount: number;
  lastActivityAt: Date;
}

const PuzzleSessionSchema = new Schema<IPuzzleSession>({
  puzzleId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Puzzle', 
    required: true 
  },
  sessionId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  startedAt: { 
    type: Date, 
    default: Date.now 
  },
  endedAt: { 
    type: Date 
  },
  currentState: {
    placedPieces: [{ type: String }],
    lastPiecePlacedAt: { type: Date },
    completionPercentage: { type: Number, default: 0 },
    unlockedPieces: [{ type: String }]
  },
  settings: {
    maxPlayers: { type: Number, default: 50, min: 1, max: 100 },
    allowSpectators: { type: Boolean, default: true },
    timeLimit: { type: Number, min: 1, max: 1440 } // 1 minute to 24 hours
  },
  exhibitionId: {
    type: String,
    required: true,
    default: 'main-exhibition'
  },
  visitorCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
PuzzleSessionSchema.index({ puzzleId: 1, isActive: 1 });
PuzzleSessionSchema.index({ sessionId: 1 });
PuzzleSessionSchema.index({ startedAt: -1 });
PuzzleSessionSchema.index({ exhibitionId: 1 });
PuzzleSessionSchema.index({ lastActivityAt: -1 });

// Virtual for current player count
PuzzleSessionSchema.virtual('currentPlayerCount').get(function() {
  return this.visitorCount;
});

// Virtual for session duration
PuzzleSessionSchema.virtual('duration').get(function() {
  const endTime = this.endedAt || new Date();
  return Math.floor((endTime.getTime() - this.startedAt.getTime()) / 1000); // in seconds
});

// Method to unlock piece
PuzzleSessionSchema.methods.unlockPiece = function(pieceUnlockCode: string) {
  if (!this.currentState.unlockedPieces.includes(pieceUnlockCode)) {
    this.currentState.unlockedPieces.push(pieceUnlockCode);
  }
  
  this.lastActivityAt = new Date();
  this.visitorCount += 1;
  
  return this.save();
};

// Method to place piece
PuzzleSessionSchema.methods.placePiece = function(pieceId: string) {
  if (!this.currentState.placedPieces.includes(pieceId)) {
    this.currentState.placedPieces.push(pieceId);
  }
  
  this.currentState.lastPiecePlacedAt = new Date();
  this.lastActivityAt = new Date();
  
  // Calculate completion percentage
  // This would need to be updated based on total pieces from the puzzle
  // For now, we'll just track the count
  
  return this.save();
};

// Static method to create session
PuzzleSessionSchema.statics.createSession = function(puzzleId: mongoose.Types.ObjectId, settings: any) {
  const sessionId = `exhibition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return this.create({
    puzzleId,
    sessionId,
    settings: { ...this.settings, ...settings }
  });
};

export const PuzzleSession = mongoose.models.PuzzleSession || mongoose.model<IPuzzleSession>('PuzzleSession', PuzzleSessionSchema);
