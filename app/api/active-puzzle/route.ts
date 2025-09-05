import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { Puzzle } from '@/lib/models/Puzzle';

// GET /api/active-puzzle - returns all puzzles in order (frontend handles active state)
export async function GET() {
  try {
    await connectToDatabase();

    // Get all puzzles in order
    const raw = await Puzzle.find({}).lean();
    const puzzles = [...raw].sort((a: any, b: any) => {
      const aHasSeed = a.id && !isNaN(Number(a.id))
      const bHasSeed = b.id && !isNaN(Number(b.id))
      if (aHasSeed && bHasSeed) return Number(a.id) - Number(b.id)
      if (aHasSeed) return -1
      if (bHasSeed) return 1
      const ad = new Date(a.createdAt || 0).getTime()
      const bd = new Date(b.createdAt || 0).getTime()
      return ad - bd
    });

    if (!puzzles || puzzles.length === 0) {
      return NextResponse.json({ success: true, data: { active: null, next: null } });
    }

    // Return first puzzle as active (frontend will handle the actual active state)
    const active = puzzles[0] || null;
    const next = puzzles[1] || null;

    return NextResponse.json({ success: true, data: { active, next } });
  } catch (error) {
    console.error('Error fetching active puzzle:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch active puzzle' }, { status: 500 });
  }
}

// POST /api/active-puzzle - no longer needed since frontend handles state
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    // Get all puzzles in order
    const raw = await Puzzle.find({}).lean();
    const puzzles = [...raw].sort((a: any, b: any) => {
      const aHasSeed = a.id && !isNaN(Number(a.id))
      const bHasSeed = b.id && !isNaN(Number(b.id))
      if (aHasSeed && bHasSeed) return Number(a.id) - Number(b.id)
      if (aHasSeed) return -1
      if (bHasSeed) return 1
      const ad = new Date(a.createdAt || 0).getTime()
      const bd = new Date(b.createdAt || 0).getTime()
      return ad - bd
    });

    if (!puzzles || puzzles.length === 0) {
      return NextResponse.json({ success: false, error: 'No puzzles found' }, { status: 404 });
    }

    // Return first puzzle as active (frontend handles the actual active state)
    const active = puzzles[0] || null;
    const next = puzzles[1] || null;

    return NextResponse.json({ success: true, data: { active, next } });
  } catch (error) {
    console.error('Error advancing active puzzle:', error);
    return NextResponse.json({ success: false, error: 'Failed to advance active puzzle' }, { status: 500 });
  }
}


