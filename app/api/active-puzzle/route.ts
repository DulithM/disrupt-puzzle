import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { Puzzle } from '@/lib/models/Puzzle';

// GET /api/active-puzzle - returns current active puzzle and the next puzzle in line
export async function GET() {
  try {
    await connectToDatabase();

    // Prefer explicit active by currentlyInUse
    let active = await Puzzle.findOne({ currentlyInUse: true }).lean();

    // Fallback to first incomplete (no completedAt), else first by created order
    if (!active) {
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
      let activeIndex = puzzles.findIndex((p: any) => !p.completedAt);
      if (activeIndex === -1) activeIndex = 0; // all completed, cycle to first
      active = puzzles[activeIndex] || null as any;
    }

    // Determine next
    const all = await Puzzle.find({}).lean();
    const ordered = [...all].sort((a: any, b: any) => {
      const aHasSeed = a.id && !isNaN(Number(a.id))
      const bHasSeed = b.id && !isNaN(Number(b.id))
      if (aHasSeed && bHasSeed) return Number(a.id) - Number(b.id)
      if (aHasSeed) return -1
      if (bHasSeed) return 1
      const ad = new Date(a.createdAt || 0).getTime()
      const bd = new Date(b.createdAt || 0).getTime()
      return ad - bd
    });
    const activeIdx = active ? ordered.findIndex(p => String(p._id) === String((active as any)._id)) : 0
    const next = ordered[(activeIdx + 1) % ordered.length] || null

    return NextResponse.json({ success: true, data: { active, next } });
  } catch (error) {
    console.error('Error fetching active puzzle:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch active puzzle' }, { status: 500 });
  }
}

// POST /api/active-puzzle - advance currentlyInUse to the next puzzle
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json().catch(() => ({}));
    const { forceCompleteId } = body || {};

    // Fetch ordered list
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

    // Find current active by flag, else fallback to first
    let activeIndex = puzzles.findIndex(p => p.currentlyInUse === true);
    if (activeIndex === -1) activeIndex = 0;

    // If forceCompleteId refers to a different puzzle, jump to it
    if (forceCompleteId && String(puzzles[activeIndex]._id) !== String(forceCompleteId)) {
      const idx = puzzles.findIndex(p => String(p._id) === String(forceCompleteId));
      if (idx !== -1) {
        activeIndex = idx;
      }
    }

    const nextIndex = (activeIndex + 1) % puzzles.length;

    // Flip flags atomically: clear all, then set next
    await Puzzle.updateMany({ currentlyInUse: true }, { $set: { currentlyInUse: false } });
    await Puzzle.updateOne({ _id: puzzles[nextIndex]._id }, { $set: { currentlyInUse: true } });

    const active = await Puzzle.findById(puzzles[nextIndex]._id).lean();
    const next = puzzles[(nextIndex + 1) % puzzles.length] || null;

    return NextResponse.json({ success: true, data: { active, next } });
  } catch (error) {
    console.error('Error advancing active puzzle:', error);
    return NextResponse.json({ success: false, error: 'Failed to advance active puzzle' }, { status: 500 });
  }
}


