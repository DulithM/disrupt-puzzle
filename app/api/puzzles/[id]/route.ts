import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { Puzzle } from '@/lib/models/Puzzle';
import mongoose from 'mongoose';

// GET /api/puzzles/[id] - Get a specific puzzle
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    const { id } = await params;
    
    let puzzle = null;
    
    // Try to find by MongoDB ObjectId first
    if (mongoose.Types.ObjectId.isValid(id)) {
      puzzle = await Puzzle.findById(id).lean();
    }
    
    // If not found by ObjectId, try to find by the 'id' field (string ID)
    if (!puzzle) {
      puzzle = await Puzzle.findOne({ id: id }).lean();
    }
    
    if (!puzzle) {
      return NextResponse.json(
        { success: false, error: 'Puzzle not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: puzzle
    });
    
  } catch (error) {
    console.error('Error fetching puzzle:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch puzzle' },
      { status: 500 }
    );
  }
}


