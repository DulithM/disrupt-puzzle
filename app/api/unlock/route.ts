import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { Puzzle } from '@/lib/models/Puzzle';
import { PuzzleSession } from '@/lib/models/PuzzleSession';

// POST /api/unlock - Unlock a puzzle piece via QR code
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { unlockCode, exhibitionId = 'main-exhibition' } = body;
    
    if (!unlockCode) {
      return NextResponse.json(
        { success: false, error: 'Unlock code is required' },
        { status: 400 }
      );
    }
    
    // Find puzzle piece by unlock code
    const puzzle = await Puzzle.findOne({
      'pieces.unlockCode': unlockCode,
      isActive: true
    });
    
    if (!puzzle) {
      return NextResponse.json(
        { success: false, error: 'Invalid unlock code' },
        { status: 404 }
      );
    }
    
    // Find the specific piece
    const piece = puzzle.pieces.find(p => p.unlockCode === unlockCode);
    if (!piece) {
      return NextResponse.json(
        { success: false, error: 'Piece not found' },
        { status: 404 }
      );
    }
    
    // Check if piece is already unlocked
    if (piece.unlockedAt) {
      return NextResponse.json({
        success: true,
        data: {
          message: 'Piece already unlocked',
          piece: {
            id: piece.id,
            unlockCode: piece.unlockCode,
            isUnlocked: true,
            unlockedAt: piece.unlockedAt
          },
          puzzle: {
            id: puzzle._id,
            title: puzzle.title,
            completionPercentage: puzzle.completionPercentage
          }
        }
      });
    }
    
    // Unlock the piece
    piece.unlockedAt = new Date();
    await puzzle.save();
    
    // Get or create session for this puzzle
    let session = await PuzzleSession.findOne({
      puzzleId: puzzle._id,
      isActive: true,
      exhibitionId
    });
    
    if (!session) {
      session = new PuzzleSession({
        puzzleId: puzzle._id,
        sessionId: `exhibition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        exhibitionId,
        settings: {
          maxPlayers: puzzle.maxPlayers,
          allowSpectators: true
        }
      });
    }
    
    // Update session
    await session.unlockPiece(unlockCode);
    
    // Check if puzzle is completed
    const allPiecesUnlocked = puzzle.pieces.every(p => p.unlockedAt);
    if (allPiecesUnlocked && !puzzle.completedAt) {
      puzzle.completedAt = new Date();
      puzzle.isUnlocked = true;
      puzzle.unlockedAt = new Date();
      await puzzle.save();
    }
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'Piece unlocked successfully!',
        piece: {
          id: piece.id,
          unlockCode: piece.unlockCode,
          isUnlocked: true,
          unlockedAt: piece.unlockedAt
        },
        puzzle: {
          id: puzzle._id,
          title: puzzle.title,
          completionPercentage: puzzle.completionPercentage,
          isCompleted: !!puzzle.completedAt
        },
        session: {
          id: session._id,
          visitorCount: session.visitorCount
        }
      }
    });
    
  } catch (error) {
    console.error('Error unlocking piece:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to unlock piece' },
      { status: 500 }
    );
  }
}
