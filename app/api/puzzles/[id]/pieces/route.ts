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

    // If completed and no completedAt, set it in a separate update without validation
    if (allPiecesPlaced && !refreshed.completedAt) {
      let completionUpdateResult = null;
      
      // Try to update by MongoDB ObjectId first
      if (mongoose.Types.ObjectId.isValid(id)) {
        completionUpdateResult = await Puzzle.updateOne(
          { _id: id },
          { $set: { completedAt: new Date() } },
          { runValidators: false }
        );
      }
      
      // If not found by ObjectId, try to update by the 'id' field (string ID)
      if (!completionUpdateResult || completionUpdateResult.matchedCount === 0) {
        await Puzzle.updateOne(
          { id: id },
          { $set: { completedAt: new Date() } },
          { runValidators: false }
        );
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
