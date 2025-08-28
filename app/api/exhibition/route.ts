import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { Puzzle } from '@/lib/models/Puzzle';
import { PuzzleSession } from '@/lib/models/PuzzleSession';

// GET /api/exhibition - Get exhibition dashboard data
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const exhibitionId = searchParams.get('exhibitionId') || 'main-exhibition';
    
    // Get all active puzzles for the exhibition
    const puzzles = await Puzzle.find({
      isActive: true,
      exhibitionId
    }).lean();
    
    // Get active sessions for these puzzles
    const puzzleIds = puzzles.map(p => p._id);
    const sessions = await PuzzleSession.find({
      puzzleId: { $in: puzzleIds },
      isActive: true,
      exhibitionId
    }).lean();
    
    // Create a map of puzzle sessions
    const sessionMap = new Map();
    sessions.forEach(session => {
      sessionMap.set(session.puzzleId.toString(), session);
    });
    
    // Combine puzzle and session data
    const exhibitionData = puzzles.map(puzzle => {
      const session = sessionMap.get(puzzle._id.toString());
      const unlockedPieces = puzzle.pieces.filter(p => p.unlockedAt).length;
      const totalPieces = puzzle.pieces.length;
      const completionPercentage = totalPieces > 0 ? Math.round((unlockedPieces / totalPieces) * 100) : 0;
      
      return {
        id: puzzle._id,
        title: puzzle.title,
        description: puzzle.description,
        imageUrl: puzzle.imageUrl,
        difficulty: puzzle.difficulty,
        category: puzzle.category,
        rows: puzzle.rows,
        cols: puzzle.cols,
        unlockedPieces,
        totalPieces,
        completionPercentage,
        isCompleted: !!puzzle.completedAt,
        completedAt: puzzle.completedAt,
        session: session ? {
          id: session._id,
          visitorCount: session.visitorCount,
          lastActivityAt: session.lastActivityAt,
          startedAt: session.startedAt
        } : null
      };
    });
    
    // Calculate overall exhibition statistics
    const totalPuzzles = puzzles.length;
    const completedPuzzles = puzzles.filter(p => p.completedAt).length;
    const totalVisitors = sessions.reduce((sum, s) => sum + s.visitorCount, 0);
    const overallCompletion = totalPuzzles > 0 ? Math.round((completedPuzzles / totalPuzzles) * 100) : 0;
    
    return NextResponse.json({
      success: true,
      data: {
        exhibitionId,
        puzzles: exhibitionData,
        statistics: {
          totalPuzzles,
          completedPuzzles,
          totalVisitors,
          overallCompletion,
          lastUpdated: new Date()
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching exhibition data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch exhibition data' },
      { status: 500 }
    );
  }
}
