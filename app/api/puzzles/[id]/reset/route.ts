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
    
    let updateResult = null;
    
    // Try to reset by MongoDB ObjectId first
    if (mongoose.Types.ObjectId.isValid(id)) {
      updateResult = await Puzzle.updateOne(
        { _id: id },
        {
          $set: {
            'pieces.$[].isPlaced': false,
            'pieces.$[].placedBy': undefined,
            'pieces.$[].placedAt': undefined,
            completedAt: undefined,
            isUnlocked: false,
            unlockedAt: undefined,
          }
        },
        { runValidators: false }
      );
    }
    
    // If not found by ObjectId, try to reset by the 'id' field (string ID)
    if (!updateResult || updateResult.matchedCount === 0) {
      updateResult = await Puzzle.updateOne(
        { id: id },
        {
          $set: {
            'pieces.$[].isPlaced': false,
            'pieces.$[].placedBy': undefined,
            'pieces.$[].placedAt': undefined,
            completedAt: undefined,
            isUnlocked: false,
            unlockedAt: undefined,
          }
        },
        { runValidators: false }
      );
    }

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Puzzle not found' },
        { status: 404 }
      );
    }

    let refreshed = null;
    
    // Try to find by MongoDB ObjectId first
    if (mongoose.Types.ObjectId.isValid(id)) {
      refreshed = await Puzzle.findById(id).lean();
    }
    
    // If not found by ObjectId, try to find by the 'id' field (string ID)
    if (!refreshed) {
      refreshed = await Puzzle.findOne({ id: id }).lean();
    }
    
    console.log(`🔄 Puzzle "${refreshed?.title || id}" reset successfully`);
    
    return NextResponse.json({
      success: true,
      data: refreshed,
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
