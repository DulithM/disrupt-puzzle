import { NextRequest, NextResponse } from 'next/server';
import { puzzleApi } from '@/lib/puzzle-api';
import { findCurrentActivePuzzle } from '@/lib/puzzle-utils';

// GET /api/test-active-puzzle - Test which puzzle should be active
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing active puzzle detection...');
    
    // Get all puzzles
    const puzzles = await puzzleApi.getAllPuzzles();
    console.log('🧪 Found puzzles:', puzzles.length);
    
    if (puzzles.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No puzzles found'
      });
    }
    
    // Use the shared utility to find active puzzle
    const { activeIndex, activePuzzle } = await findCurrentActivePuzzle(puzzles);
    
    // Get detailed info about all puzzles
    const puzzleDetails = [];
    for (let i = 0; i < puzzles.length; i++) {
      const puzzleData = puzzles[i];
      const puzzleId = puzzleData.id || (puzzleData as any)._id;
      
      if (puzzleId) {
        try {
          const loadedPuzzle = await puzzleApi.getPuzzle(puzzleId);
          if (loadedPuzzle) {
            puzzleDetails.push({
              index: i,
              title: loadedPuzzle.title,
              completedPieces: loadedPuzzle.pieces.filter(p => p.isPlaced).length,
              totalPieces: loadedPuzzle.pieces.length,
              completedAt: loadedPuzzle.completedAt,
              isActive: i === activeIndex
            });
          }
        } catch (error) {
          console.error(`Error loading puzzle ${i}:`, error);
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        activeIndex,
        activePuzzle: activePuzzle ? {
          title: activePuzzle.title,
          completedPieces: activePuzzle.pieces.filter(p => p.isPlaced).length,
          totalPieces: activePuzzle.pieces.length,
          completedAt: activePuzzle.completedAt
        } : null,
        allPuzzles: puzzleDetails
      }
    });
    
  } catch (error) {
    console.error('Error in test active puzzle:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to test active puzzle detection' },
      { status: 500 }
    );
  }
}
