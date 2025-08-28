import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { Puzzle } from '@/lib/models/Puzzle';

// GET /api/debug/puzzles - Debug endpoint to see all puzzles
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const puzzles = await Puzzle.find({}).lean();
    
    console.log('🔍 Debug: Found puzzles in database:', puzzles.length);
    
    const debugData = puzzles.map(puzzle => ({
      _id: puzzle._id,
      id: puzzle.id,
      title: puzzle.title,
      unlockCode: puzzle.unlockCode,
      piecesCount: puzzle.pieces?.length || 0,
      completedPieces: puzzle.pieces?.filter(p => p.isPlaced).length || 0,
      completedAt: puzzle.completedAt,
      isActive: puzzle.isActive
    }));
    
    return NextResponse.json({
      success: true,
      data: debugData,
      total: puzzles.length
    });
    
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch debug data' },
      { status: 500 }
    );
  }
}
