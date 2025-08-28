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
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid puzzle ID' },
        { status: 400 }
      );
    }
    
    const puzzle = await Puzzle.findById(id).lean();
    
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

// PUT /api/puzzles/[id] - Update a puzzle
export async function PUT(
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
    
    // Remove fields that shouldn't be updated
    const { _id, createdAt, __v, ...updateData } = body;
    
    const puzzle = await Puzzle.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!puzzle) {
      return NextResponse.json(
        { success: false, error: 'Puzzle not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: puzzle,
      message: 'Puzzle updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating puzzle:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update puzzle' },
      { status: 500 }
    );
  }
}

// DELETE /api/puzzles/[id] - Delete a puzzle
export async function DELETE(
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
    
    const puzzle = await Puzzle.findByIdAndDelete(id);
    
    if (!puzzle) {
      return NextResponse.json(
        { success: false, error: 'Puzzle not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Puzzle deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting puzzle:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete puzzle' },
      { status: 500 }
    );
  }
}
