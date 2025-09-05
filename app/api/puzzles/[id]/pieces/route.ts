import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { Puzzle } from '@/lib/models/Puzzle';
import mongoose from 'mongoose';

// GET /api/puzzles/[id]/pieces - Get all pieces for a puzzle
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
      puzzle = await Puzzle.findById(id).select('pieces').lean();
    }
    
    // If not found by ObjectId, try to find by the 'id' field (string ID)
    if (!puzzle) {
      puzzle = await Puzzle.findOne({ id: id }).select('pieces').lean();
    }
    
    if (!puzzle) {
      return NextResponse.json(
        { success: false, error: 'Puzzle not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: puzzle.pieces
    });
    
  } catch (error) {
    console.error('Error fetching puzzle pieces:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch puzzle pieces' },
      { status: 500 }
    );
  }
}

// POST /api/puzzles/[id]/pieces - Place a piece in the puzzle
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    const { id } = await params;
    const body = await request.json();
    
    const { pieceId, placedBy, row, col } = body;
    
    if (!pieceId || !placedBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Targeted update to single piece to avoid full-document validation
    const placedAt = new Date();
    
    let updateResult = null;
    
    // Try to update by MongoDB ObjectId first
    if (mongoose.Types.ObjectId.isValid(id)) {
      const updateQuery: any = { _id: id, 'pieces.id': pieceId };
      const updateSet: any = {
        'pieces.$.isPlaced': true,
        'pieces.$.placedBy': placedBy,
        'pieces.$.placedAt': placedAt,
      };
      if (row !== undefined) updateSet['pieces.$.row'] = row;
      if (col !== undefined) updateSet['pieces.$.col'] = col;

      updateResult = await Puzzle.updateOne(
        updateQuery,
        { $set: updateSet },
        { runValidators: false }
      );
    }
    
    // If not found by ObjectId, try to update by the 'id' field (string ID)
    if (!updateResult || updateResult.matchedCount === 0) {
      const updateQuery: any = { id: id, 'pieces.id': pieceId };
      const updateSet: any = {
        'pieces.$.isPlaced': true,
        'pieces.$.placedBy': placedBy,
        'pieces.$.placedAt': placedAt,
      };
      if (row !== undefined) updateSet['pieces.$.row'] = row;
      if (col !== undefined) updateSet['pieces.$.col'] = col;

      updateResult = await Puzzle.updateOne(
        updateQuery,
        { $set: updateSet },
        { runValidators: false }
      );
    }

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Puzzle or piece not found' },
        { status: 404 }
      );
    }

    // Re-fetch puzzle to compute completion state
    let refreshed = null;
    
    // Try to find by MongoDB ObjectId first
    if (mongoose.Types.ObjectId.isValid(id)) {
      refreshed = await Puzzle.findById(id).lean();
    }
    
    // If not found by ObjectId, try to find by the 'id' field (string ID)
    if (!refreshed) {
      refreshed = await Puzzle.findOne({ id: id }).lean();
    }
    
    if (!refreshed) {
      return NextResponse.json(
        { success: false, error: 'Puzzle not found after update' },
        { status: 400 }
      );
    }

    const completedPieces = (refreshed.pieces || []).filter((p: any) => p.isPlaced).length;
    const totalPieces = (refreshed.pieces || []).length;
    const allPiecesPlaced = totalPieces > 0 && completedPieces === totalPieces;

    // If completed, set completed to true and advance to next puzzle
    if (allPiecesPlaced) {
      console.log('🎉 Puzzle completed! Starting automation...');
      
      try {
        // Set completed to true if not already completed
        if (!refreshed.completed) {
          let completionUpdateResult = null;
          
          // Try to update by MongoDB ObjectId first
          if (mongoose.Types.ObjectId.isValid(id)) {
            completionUpdateResult = await Puzzle.updateOne(
              { _id: id },
              { $set: { completed: true } },
              { runValidators: false }
            );
          }
          
          // If not found by ObjectId, try to update by the 'id' field (string ID)
          if (!completionUpdateResult || completionUpdateResult.matchedCount === 0) {
            completionUpdateResult = await Puzzle.updateOne(
              { id: id },
              { $set: { completed: true } },
              { runValidators: false }
            );
          }
          console.log(`🎉 Set completed: ${completionUpdateResult?.modifiedCount || 0} modified`);
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

        console.log(`📋 Found ${orderedPuzzles.length} puzzles in order`);

        // Find current puzzle index
        const currentIndex = orderedPuzzles.findIndex(p => 
          String(p._id) === String(refreshed._id) || String(p.id) === String(refreshed.id)
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
            console.log('🔄 All puzzles completed! Resetting all puzzles for new cycle...');
            
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
              console.log(`🔄 Reset puzzle ${puzzle.title}: ${resetResult.modifiedCount} modified`);
            }
            
            // Set the first puzzle as active
            const clearResult = await Puzzle.updateMany({ currentlyInUse: true }, { $set: { currentlyInUse: false } });
            console.log(`🔄 Cleared currentlyInUse flags: ${clearResult.modifiedCount} modified`);
            
            const setActiveResult = await Puzzle.updateOne(
              { _id: orderedPuzzles[0]._id }, 
              { $set: { currentlyInUse: true } }
            );
            console.log(`🔄 Set puzzle 1 as active: ${setActiveResult.modifiedCount} modified`);
            
            console.log(`✅ Cycle complete! Reset all puzzles and started new cycle with puzzle 1`);
          } else {
            // Normal advancement to next puzzle
            console.log(`🔄 Advancing from puzzle ${currentIndex + 1} to puzzle ${nextIndex + 1}...`);
            
            // Clear all currentlyInUse flags and set the next one
            const clearResult = await Puzzle.updateMany({ currentlyInUse: true }, { $set: { currentlyInUse: false } });
            console.log(`🔄 Cleared currentlyInUse flags: ${clearResult.modifiedCount} modified`);
            
            const setActiveResult = await Puzzle.updateOne(
              { _id: orderedPuzzles[nextIndex]._id }, 
              { $set: { currentlyInUse: true } }
            );
            console.log(`🔄 Set puzzle ${nextIndex + 1} as active: ${setActiveResult.modifiedCount} modified`);
            
            console.log(`✅ Advanced from puzzle ${currentIndex + 1} to puzzle ${nextIndex + 1}`);
          }
        } else {
          console.log('❌ Could not find current puzzle index for automation');
        }
      } catch (error) {
        console.error('❌ Error in automation logic:', error);
        console.error('❌ Error details:', error.message);
        console.error('❌ Error stack:', error.stack);
        // Don't throw the error, just log it so the piece placement still succeeds
      }
    }

    // Return the updated piece data from refreshed doc
    const updatedPiece = (refreshed.pieces as any[]).find(p => p.id === pieceId) || null;
    
    return NextResponse.json({
      success: true,
      data: updatedPiece,
      message: 'Piece placed successfully',
      puzzleCompleted: allPiecesPlaced
    });
    
  } catch (error) {
    console.error('Error placing piece:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to place piece' },
      { status: 500 }
    );
  }
}

// PUT /api/puzzles/[id]/pieces/[pieceId] - Update a specific piece
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pieceId: string }> }
) {
  try {
    await connectToDatabase();
    
    const { id, pieceId } = await params;
    const body = await request.json();
    
    let puzzle = null;
    
    // Try to find by MongoDB ObjectId first
    if (mongoose.Types.ObjectId.isValid(id)) {
      puzzle = await Puzzle.findById(id);
    }
    
    // If not found by ObjectId, try to find by the 'id' field (string ID)
    if (!puzzle) {
      puzzle = await Puzzle.findOne({ id: id });
    }
    
    if (!puzzle) {
      return NextResponse.json(
        { success: false, error: 'Puzzle not found' },
        { status: 404 }
      );
    }
    
    const pieceIndex = puzzle.pieces.findIndex(p => p.id === pieceId);
    
    if (pieceIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Piece not found' },
        { status: 404 }
      );
    }
    
    // Update piece fields
    const { row, col, isPlaced, placedBy } = body;
    
    if (row !== undefined) puzzle.pieces[pieceIndex].row = row;
    if (col !== undefined) puzzle.pieces[pieceIndex].col = col;
    if (isPlaced !== undefined) puzzle.pieces[pieceIndex].isPlaced = isPlaced;
    if (placedBy !== undefined) puzzle.pieces[pieceIndex].placedBy = placedBy;
    
    if (isPlaced) {
      puzzle.pieces[pieceIndex].placedAt = new Date();
    } else {
      puzzle.pieces[pieceIndex].placedAt = undefined;
      puzzle.pieces[pieceIndex].placedBy = undefined;
    }
    
    await puzzle.save();
    
    return NextResponse.json({
      success: true,
      data: puzzle.pieces[pieceIndex],
      message: 'Piece updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating piece:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update piece' },
      { status: 500 }
    );
  }
}
