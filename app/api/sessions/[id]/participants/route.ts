import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { PuzzleSession } from '@/lib/models/PuzzleSession';
import { User } from '@/lib/models/User';
import mongoose from 'mongoose';

// GET /api/sessions/[id]/participants - Get all participants in a session
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
      .select('participants')
      .populate('participants.userId', 'username avatar')
      .lean();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: session.participants
    });
    
  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch participants' },
      { status: 500 }
    );
  }
}

// POST /api/sessions/[id]/participants - Add a participant to a session
export async function POST(
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
    
    const { userId, username, isSpectator = false } = body;
    
    if (!userId || !username) {
      return NextResponse.json(
        { success: false, error: 'User ID and username are required' },
        { status: 400 }
      );
    }
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }
    
    const session = await PuzzleSession.findById(id);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }
    
    if (!session.isActive) {
      return NextResponse.json(
        { success: false, error: 'Session is not active' },
        { status: 400 }
      );
    }
    
    // Check if user is already a participant
    const existingParticipant = session.participants.find(
      p => p.userId.toString() === userId
    );
    
    if (existingParticipant) {
      // Update existing participant
      existingParticipant.lastActiveAt = new Date();
      if (existingParticipant.leftAt) {
        existingParticipant.leftAt = undefined;
      }
    } else {
      // Check if session is full
      const activeParticipants = session.participants.filter(p => !p.leftAt);
      if (activeParticipants.length >= session.settings.maxPlayers && !isSpectator) {
        return NextResponse.json(
          { success: false, error: 'Session is full' },
          { status: 400 }
        );
      }
      
      // Add new participant
      session.participants.push({
        userId: new mongoose.Types.ObjectId(userId),
        username,
        joinedAt: new Date(),
        piecesPlaced: 0,
        isSpectator,
        lastActiveAt: new Date()
      });
    }
    
    await session.save();
    
    return NextResponse.json({
      success: true,
      message: 'Participant added successfully',
      data: session.participants
    });
    
  } catch (error) {
    console.error('Error adding participant:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add participant' },
      { status: 500 }
    );
  }
}

// DELETE /api/sessions/[id]/participants/[userId] - Remove a participant from a session
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    await connectToDatabase();
    
    const { id, userId } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid session ID or user ID' },
        { status: 400 }
      );
    }
    
    const session = await PuzzleSession.findById(id);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }
    
    const participantIndex = session.participants.findIndex(
      p => p.userId.toString() === userId
    );
    
    if (participantIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Participant not found in session' },
        { status: 404 }
      );
    }
    
    // Mark participant as left
    session.participants[participantIndex].leftAt = new Date();
    
    await session.save();
    
    return NextResponse.json({
      success: true,
      message: 'Participant removed successfully'
    });
    
  } catch (error) {
    console.error('Error removing participant:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove participant' },
      { status: 500 }
    );
  }
}
