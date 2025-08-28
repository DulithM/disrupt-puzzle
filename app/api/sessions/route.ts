import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { PuzzleSession } from '@/lib/models/PuzzleSession';
import { Puzzle } from '@/lib/models/Puzzle';
import mongoose from 'mongoose';

// GET /api/sessions - Get all active sessions
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const puzzleId = searchParams.get('puzzleId');
    const isActive = searchParams.get('isActive');
    
    const query: any = {};
    
    if (puzzleId) {
      if (!mongoose.Types.ObjectId.isValid(puzzleId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid puzzle ID' },
          { status: 400 }
        );
      }
      query.puzzleId = puzzleId;
    }
    
    if (isActive !== null) {
      query.isActive = isActive === 'true';
    }
    
    const sessions = await PuzzleSession.find(query)
      .populate('puzzleId', 'title imageUrl rows cols')
      .sort({ startedAt: -1 })
      .lean();
    
    return NextResponse.json({
      success: true,
      data: sessions
    });
    
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// POST /api/sessions - Create a new session
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { puzzleId, settings = {} } = body;
    
    if (!puzzleId || !mongoose.Types.ObjectId.isValid(puzzleId)) {
      return NextResponse.json(
        { success: false, error: 'Valid puzzle ID is required' },
        { status: 400 }
      );
    }
    
    // Check if puzzle exists
    const puzzle = await Puzzle.findById(puzzleId);
    if (!puzzle) {
      return NextResponse.json(
        { success: false, error: 'Puzzle not found' },
        { status: 404 }
      );
    }
    
    // Check if there's already an active session for this puzzle
    const existingSession = await PuzzleSession.findOne({
      puzzleId,
      isActive: true
    });
    
    if (existingSession) {
      return NextResponse.json({
        success: true,
        data: existingSession,
        message: 'Active session already exists for this puzzle'
      });
    }
    
    // Create new session
    const session = new PuzzleSession({
      puzzleId,
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      settings: {
        maxPlayers: puzzle.maxPlayers || 10,
        allowSpectators: true,
        ...settings
      }
    });
    
    await session.save();
    
    return NextResponse.json({
      success: true,
      data: session,
      message: 'Session created successfully'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
