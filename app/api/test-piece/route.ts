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
    
    // Find the puzzle that contains this piece (ensure it exists first)
    const existingPuzzle = await Puzzle.findOne({ 'pieces.id': pieceId });
    if (!existingPuzzle) {
      return NextResponse.json(
        { success: false, error: 'Puzzle not found for piece' },
        { status: 404 }
      );
    }
    
    console.log('🧪 Test: Found puzzle:', existingPuzzle.title, 'ID:', existingPuzzle._id);

    // If already placed, short-circuit without attempting to save
    const existingPiece = existingPuzzle.pieces.find(p => p.id === pieceId);
    if (!existingPiece) {
      return NextResponse.json(
        { success: false, error: 'Piece not found' },
        { status: 404 }
      );
    }
    if ((existingPiece as any).isPlaced) {
      return NextResponse.json({
        success: false,
        error: 'Piece already completed',
        data: {
          pieceId,
          puzzleTitle: existingPuzzle.title,
          puzzleId: existingPuzzle._id,
          alreadyPlacedBy: (existingPiece as any).placedBy,
          placedAt: (existingPiece as any).placedAt
        }
      }, { status: 400 });
    }

    // Perform targeted update to avoid full-document validation
    const placedAt = new Date();
    const updateResult = await Puzzle.updateOne(
      { 'pieces.id': pieceId },
      {
        $set: {
          'pieces.$.isPlaced': true,
          'pieces.$.placedBy': placedBy,
          'pieces.$.placedAt': placedAt,
        }
      },
      { runValidators: false }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Piece not found' },
        { status: 404 }
      );
    }

    // Re-fetch to compute completion stats
    const updatedPuzzle = await Puzzle.findById(existingPuzzle._id);
    const completedPieces = updatedPuzzle?.pieces.filter(p => (p as any).isPlaced).length ?? 0;
    const totalPieces = updatedPuzzle?.pieces.length ?? 0;
    const allPiecesPlaced = completedPieces > 0 && completedPieces === totalPieces;

    // Optionally set completedAt without validation
    if (allPiecesPlaced && !updatedPuzzle?.completedAt) {
      await Puzzle.updateOne(
        { _id: existingPuzzle._id },
        { $set: { completedAt: new Date() } },
        { runValidators: false }
      );
      console.log('🧪 Test: Puzzle completed!');
    }

    console.log('🧪 Test: Piece placed successfully');

    return NextResponse.json({
      success: true,
      data: {
        pieceId,
        placedBy,
        puzzleTitle: existingPuzzle.title,
        puzzleId: existingPuzzle._id,
        puzzleCompleted: allPiecesPlaced,
        completedPieces,
        totalPieces
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
