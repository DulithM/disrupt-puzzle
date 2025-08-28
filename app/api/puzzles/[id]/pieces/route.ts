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
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid puzzle ID' },
        { status: 400 }
      );
    }
    
    const puzzle = await Puzzle.findById(id).select('pieces').lean();
    
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
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid puzzle ID' },
        { status: 400 }
      );
    }
    
    const { pieceId, placedBy, row, col } = body;
    
    if (!pieceId || !placedBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const puzzle = await Puzzle.findById(id);
    
    if (!puzzle) {
      return NextResponse.json(
        { success: false, error: 'Puzzle not found' },
        { status: 404 }
      );
    }
    
    // Find the piece to update
    const pieceIndex = puzzle.pieces.findIndex(p => p.id === pieceId);
    
    if (pieceIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Piece not found' },
        { status: 404 }
      );
    }
    
    // Update the piece
    puzzle.pieces[pieceIndex].isPlaced = true;
    puzzle.pieces[pieceIndex].placedBy = placedBy;
    puzzle.pieces[pieceIndex].placedAt = new Date();
    
    if (row !== undefined && col !== undefined) {
      puzzle.pieces[pieceIndex].row = row;
      puzzle.pieces[pieceIndex].col = col;
    }
    
    // Check if puzzle is completed
    const allPiecesPlaced = puzzle.pieces.every(p => p.isPlaced);
    if (allPiecesPlaced && !puzzle.completedAt) {
      puzzle.completedAt = new Date();
    }
    
    await puzzle.save();
    
    return NextResponse.json({
      success: true,
      data: puzzle.pieces[pieceIndex],
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
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid puzzle ID' },
        { status: 400 }
      );
    }
    
    const puzzle = await Puzzle.findById(id);
    
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
