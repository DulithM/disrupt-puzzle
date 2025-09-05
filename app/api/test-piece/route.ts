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

    // If completed, set completed to true and advance to next puzzle
    if (allPiecesPlaced) {
      console.log('🧪 Test: Puzzle completed! Starting automation...');
      
      try {
        // Set completed to true if not already completed
        if (!updatedPuzzle?.completed) {
          const completionResult = await Puzzle.updateOne(
            { _id: existingPuzzle._id },
            { $set: { completed: true } },
            { runValidators: false }
          );
          console.log(`🧪 Test: Set completed: ${completionResult.modifiedCount} modified`);
        }
        
        // Get all puzzles in order
        const allPuzzles = await Puzzle.find({}).lean();
        const orderedPuzzles = [...allPuzzles].sort((a: any, b: any) => {
          const aHasSeed = a.id && !isNaN(Number(a.id))
          const bHasSeed = b.id && !isNaN(Number(b.id))
          if (aHasSeed && bHasSeed) return Number(a.id) - Number(b.id)
          if (aHasSeed) return -1
          if (bHasSeed) return 1
          const ad = new Date(a.createdAt || 0).getTime()
          const bd = new Date(b.createdAt || 0).getTime()
          return ad - bd
        });

        // Find current puzzle index
        const currentIndex = orderedPuzzles.findIndex(p => 
          String(p._id) === String(existingPuzzle._id) || String(p.id) === String(existingPuzzle.id)
        );
        
        console.log(`🔍 Current puzzle index: ${currentIndex}`);
        
        if (currentIndex !== -1) {
          // Calculate next puzzle index
          const nextIndex = (currentIndex + 1) % orderedPuzzles.length;
          
          console.log(`🔍 Next puzzle index: ${nextIndex}`);
          console.log(`🔍 Next puzzle: ${orderedPuzzles[nextIndex].title}`);
          
          // Check if this is the last puzzle in the cycle
          const isLastPuzzle = nextIndex === 0;
          
          console.log(`🔍 Is last puzzle: ${isLastPuzzle}`);
          
          if (isLastPuzzle) {
            // This is the last puzzle in the cycle, reset all puzzles
            console.log('🔄 Test: All puzzles completed! Resetting all puzzles for new cycle...');
            
            // Reset all puzzles: set completed to false and reset all pieces to unplaced
            for (const puzzle of orderedPuzzles) {
              const resetResult = await Puzzle.updateOne(
                { _id: puzzle._id },
                { 
                  $set: { 
                    completed: false,
                    'pieces.$[].isPlaced': false,
                    'pieces.$[].placedBy': null,
                    'pieces.$[].placedAt': null
                  }
                },
                { runValidators: false }
              );
              console.log(`🔄 Test: Reset puzzle ${puzzle.title}: ${resetResult.modifiedCount} modified`);
            }
            
            // Set the first puzzle as active
            const clearResult = await Puzzle.updateMany({ currentlyInUse: true }, { $set: { currentlyInUse: false } });
            console.log(`🔄 Test: Cleared currentlyInUse flags: ${clearResult.modifiedCount} modified`);
            
            const setActiveResult = await Puzzle.updateOne(
              { _id: orderedPuzzles[0]._id }, 
              { $set: { currentlyInUse: true } }
            );
            console.log(`🔄 Test: Set puzzle 1 as active: ${setActiveResult.modifiedCount} modified`);
            
            console.log(`✅ Test: Cycle complete! Reset all puzzles and started new cycle with puzzle 1`);
          } else {
            // Normal advancement to next puzzle
            console.log(`🔄 Test: Advancing from puzzle ${currentIndex + 1} to puzzle ${nextIndex + 1}...`);
            
            // Clear all currentlyInUse flags and set the next one
            const clearResult = await Puzzle.updateMany({ currentlyInUse: true }, { $set: { currentlyInUse: false } });
            console.log(`🔄 Test: Cleared currentlyInUse flags: ${clearResult.modifiedCount} modified`);
            
            const setActiveResult = await Puzzle.updateOne(
              { _id: orderedPuzzles[nextIndex]._id }, 
              { $set: { currentlyInUse: true } }
            );
            console.log(`🔄 Test: Set puzzle ${nextIndex + 1} as active: ${setActiveResult.modifiedCount} modified`);
            
            console.log(`✅ Test: Advanced from puzzle ${currentIndex + 1} to puzzle ${nextIndex + 1}`);
          }
        } else {
          console.log('❌ Test: Could not find current puzzle index for automation');
        }
      } catch (error) {
        console.error('❌ Test: Error in automation logic:', error);
        // Don't throw the error, just log it so the piece placement still succeeds
      }
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
