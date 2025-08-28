import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { Puzzle } from '@/lib/models/Puzzle';

// POST /api/test-piece - Test piece placement
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { pieceId, placedBy } = body;
    
    console.log('🧪 Test: Placing piece:', pieceId, 'by:', placedBy);
    
    // Find the puzzle that contains this piece
    const puzzle = await Puzzle.findOne({
      'pieces.id': pieceId
    });
    
    if (!puzzle) {
      return NextResponse.json(
        { success: false, error: 'Puzzle not found for piece' },
        { status: 404 }
      );
    }
    
    console.log('🧪 Test: Found puzzle:', puzzle.title, 'ID:', puzzle._id);
    
    // Find and update the piece
    const pieceIndex = puzzle.pieces.findIndex(p => p.id === pieceId);
    
    if (pieceIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Piece not found' },
        { status: 404 }
      );
    }
    
    // Check if piece is already placed
    if (puzzle.pieces[pieceIndex].isPlaced) {
      return NextResponse.json({
        success: false,
        error: 'Piece already completed',
        data: {
          pieceId,
          puzzleTitle: puzzle.title,
          puzzleId: puzzle._id,
          alreadyPlacedBy: puzzle.pieces[pieceIndex].placedBy,
          placedAt: puzzle.pieces[pieceIndex].placedAt
        }
      }, { status: 400 });
    }
    
    // Update the piece
    puzzle.pieces[pieceIndex].isPlaced = true;
    puzzle.pieces[pieceIndex].placedBy = placedBy;
    puzzle.pieces[pieceIndex].placedAt = new Date();
    
    // Check if puzzle is completed
    const allPiecesPlaced = puzzle.pieces.every(p => p.isPlaced);
    if (allPiecesPlaced && !puzzle.completedAt) {
      puzzle.completedAt = new Date();
      console.log('🧪 Test: Puzzle completed!');
    }
    
    await puzzle.save();
    
    console.log('🧪 Test: Piece placed successfully');
    
    return NextResponse.json({
      success: true,
      data: {
        pieceId,
        placedBy,
        puzzleTitle: puzzle.title,
        puzzleId: puzzle._id,
        puzzleCompleted: allPiecesPlaced,
        completedPieces: puzzle.pieces.filter(p => p.isPlaced).length,
        totalPieces: puzzle.pieces.length
      },
      message: 'Test piece placement successful'
    });
    
  } catch (error) {
    console.error('Error in test piece placement:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to place test piece' },
      { status: 500 }
    );
  }
}
