import mongoose, { Schema, Document } from 'mongoose';

export interface IPuzzle extends Document {
  title: string;
  description: string;
  imageUrl: string;
  rows: number;
  cols: number;
  pieces: IPuzzlePiece[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  isActive: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  tags: string[];
  maxPlayers: number;
  currentPlayers: number;
  // Exhibition-specific fields
  exhibitionId: string;
  unlockCode: string; // QR code identifier
  isUnlocked: boolean;
  unlockedAt?: Date;
}

export interface IPuzzlePiece {
  id: string;
  row: number;
  col: number;
  imageUrl: string;
  isPlaced: boolean;
  unlockCode: string; // Each piece has its own QR code
  unlockedAt?: Date;
  originalPosition: {
    row: number;
    col: number;
  };
}

const PuzzlePieceSchema = new Schema<IPuzzlePiece>({
  id: { type: String, required: true },
  row: { type: Number, required: true },
  col: { type: Number, required: true },
  imageUrl: { type: String, required: true },
  isPlaced: { type: Boolean, default: false },
  unlockCode: { type: String, required: true, unique: true },
  unlockedAt: { type: Date },
  originalPosition: {
    row: { type: Number, required: true },
    col: { type: Number, required: true }
  }
}, { _id: false });

const PuzzleSchema = new Schema<IPuzzle>({
  title: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  description: { 
    type: String, 
    required: true,
    maxlength: 500
  },
  imageUrl: { 
    type: String, 
    required: true 
  },
  rows: { 
    type: Number, 
    required: true,
    min: 2,
    max: 20
  },
  cols: { 
    type: Number, 
    required: true,
    min: 2,
    max: 20
  },
  pieces: [PuzzlePieceSchema],
  isActive: { 
    type: Boolean, 
    default: true 
  },
  difficulty: { 
    type: String, 
    enum: ['easy', 'medium', 'hard'], 
    default: 'medium' 
  },
  category: { 
    type: String, 
    default: 'exhibition' 
  },
  tags: [{ 
    type: String,
    trim: true 
  }],
  maxPlayers: { 
    type: Number, 
    default: 50,
    min: 1,
    max: 100
  },
  currentPlayers: { 
    type: Number, 
    default: 0,
    min: 0
  },
  exhibitionId: {
    type: String,
    required: true,
    default: 'main-exhibition'
  },
  unlockCode: {
    type: String,
    required: true,
    unique: true
  },
  isUnlocked: {
    type: Boolean,
    default: false
  },
  unlockedAt: { type: Date }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
PuzzleSchema.index({ title: 'text', description: 'text', tags: 'text' });
PuzzleSchema.index({ isActive: 1, difficulty: 1, category: 1 });
PuzzleSchema.index({ createdAt: -1 });
PuzzleSchema.index({ currentPlayers: -1 });
PuzzleSchema.index({ exhibitionId: 1 });
PuzzleSchema.index({ unlockCode: 1 });
PuzzleSchema.index({ 'pieces.unlockCode': 1 });

// Virtual for total pieces
PuzzleSchema.virtual('totalPieces').get(function() {
  return this.rows * this.cols;
});

// Virtual for completion percentage
PuzzleSchema.virtual('completionPercentage').get(function() {
  if (!this.pieces || this.pieces.length === 0) return 0;
  const placedPieces = this.pieces.filter(piece => piece.isPlaced).length;
  return Math.round((placedPieces / this.pieces.length) * 100);
});

// Virtual for unlocked pieces count
PuzzleSchema.virtual('unlockedPiecesCount').get(function() {
  if (!this.pieces || this.pieces.length === 0) return 0;
  return this.pieces.filter(piece => piece.unlockCode).length;
});

// Pre-save middleware to ensure pieces array is properly structured
PuzzleSchema.pre('save', function(next) {
  if (this.isModified('rows') || this.isModified('cols')) {
    // Regenerate pieces array if dimensions change
    this.pieces = [];
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        this.pieces.push({
          id: `${row}-${col}`,
          row,
          col,
          imageUrl: this.imageUrl,
          isPlaced: false,
          unlockCode: `${this.unlockCode}_piece_${row}_${col}`,
          originalPosition: { row, col }
        });
      }
    }
  }
  next();
});

export const Puzzle = mongoose.models.Puzzle || mongoose.model<IPuzzle>('Puzzle', PuzzleSchema);
