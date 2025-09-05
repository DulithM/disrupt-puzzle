import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { Puzzle } from '@/lib/models/Puzzle';

// POST /api/init-active-puzzle - Initialize the first puzzle as active
export async function POST() {
  try {
    await connectToDatabase();

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

    if (orderedPuzzles.length === 0) {
      return NextResponse.json({ success: false, error: 'No puzzles found' }, { status: 404 });
    }

    // Clear all currentlyInUse flags
    await Puzzle.updateMany({ currentlyInUse: true }, { $set: { currentlyInUse: false } });
    
    // Set the first puzzle as active
    await Puzzle.updateOne(
      { _id: orderedPuzzles[0]._id }, 
      { $set: { currentlyInUse: true } }
    );

    const activePuzzle = await Puzzle.findById(orderedPuzzles[0]._id).lean();

    return NextResponse.json({ 
      success: true, 
      data: { 
        active: activePuzzle,
        message: `Initialized puzzle 1 as active: ${activePuzzle?.title}`
      } 
    });
  } catch (error) {
    console.error('Error initializing active puzzle:', error);
    return NextResponse.json({ success: false, error: 'Failed to initialize active puzzle' }, { status: 500 });
  }
}

