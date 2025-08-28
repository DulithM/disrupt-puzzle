import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { Puzzle } from '@/lib/models/Puzzle';
import mongoose from 'mongoose';

// POST /api/puzzles/[id]/reset - Reset puzzle completion status
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid puzzle ID' },
        { status: 400 }
      );
    }
    
    const puzzle = await Puzzle.findById(id);
    
    if (!puzzle) {
      return NextResponse.json(
        { success: false, error: 'Puzzle not found' },
        { status: 404 }
      );
    }
    
    // Reset all pieces to unplaced status
    puzzle.pieces.forEach(piece => {
      piece.isPlaced = false;
      piece.placedBy = undefined;
      piece.placedAt = undefined;
    });
    
    // Clear completion status
    puzzle.completedAt = undefined;
    puzzle.isUnlocked = false;
    puzzle.unlockedAt = undefined;
    
    await puzzle.save();
    
    console.log(`🔄 Puzzle "${puzzle.title}" reset successfully`);
    
    return NextResponse.json({
      success: true,
      data: puzzle,
      message: 'Puzzle reset successfully'
    });
    
  } catch (error) {
    console.error('Error resetting puzzle:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset puzzle' },
      { status: 500 }
    );
  }
}
