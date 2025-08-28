import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { PuzzleSession } from '@/lib/models/PuzzleSession';
import mongoose from 'mongoose';

// GET /api/sessions/[id] - Get a specific session
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid session ID' },
        { status: 400 }
      );
    }
    
    const session = await PuzzleSession.findById(id)
      .populate('puzzleId', 'title imageUrl rows cols difficulty category')
      .lean();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: session
    });
    
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

// PUT /api/sessions/[id] - Update a session
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const { id } = params;
    const body = await request.json();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid session ID' },
        { status: 400 }
      );
    }
    
    const { _id, createdAt, __v, ...updateData } = body;
    
    const session = await PuzzleSession.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: session,
      message: 'Session updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

// DELETE /api/sessions/[id] - End a session
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid session ID' },
        { status: 400 }
      );
    }
    
    const session = await PuzzleSession.findByIdAndUpdate(
      id,
      { 
        isActive: false, 
        endedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Session ended successfully'
    });
    
  } catch (error) {
    console.error('Error ending session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to end session' },
      { status: 500 }
    );
  }
}
