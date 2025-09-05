import mongoose, { Schema, Document } from 'mongoose';

export interface IPuzzle extends Document {
  id: string;
  title: string;
  imageUrl: string;
  rows: number;
  cols: number;
  pieces: IPuzzlePiece[];
  unlockCode: string; // QR code identifier
  isUnlocked: boolean;
}

export interface IPuzzlePiece {
  id: string;
  row: number;
  col: number;
  imageUrl: string;
  isPlaced: boolean;
  unlockCode: string; // Each piece has its own QR code
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
  id: { 
    type: String, 
    required: true,
    unique: true
  },
  title: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
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
  unlockCode: {
    type: String,
    required: true,
    unique: true
  },
  isUnlocked: {
    type: Boolean,
    default: false
  },
  unlockedAt: { type: Date },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
PuzzleSchema.index({ title: 'text' });
PuzzleSchema.index({ createdAt: -1 });
PuzzleSchema.index({ unlockCode: 1 });

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

// Pre-save middleware removed - pieces are created by the seeder

export const Puzzle = mongoose.models.Puzzle || mongoose.model<IPuzzle>('Puzzle', PuzzleSchema);
