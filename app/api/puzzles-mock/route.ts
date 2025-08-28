import { NextRequest, NextResponse } from 'next/server';

const mockPuzzles = [
  {
    _id: 'mock-1',
    title: 'Mountain Landscape',
    description: 'A beautiful mountain landscape with snow-capped peaks and lush valleys',
    imageUrl: '/mountain-landscape-puzzle.png',
    rows: 4,
    cols: 6,
    difficulty: 'easy',
    category: 'exhibition',
    tags: ['mountains', 'landscape', 'nature', 'scenic'],
    maxPlayers: 50,
    currentPlayers: 0,
    exhibitionId: 'main-exhibition',
    unlockCode: 'mountain_landscape_2024',
    isUnlocked: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pieces: []
  },
  {
    _id: 'mock-2',
    title: 'Vintage Street Scene',
    description: 'A nostalgic view of an old European street with cobblestones and historic buildings',
    imageUrl: '/vintage-street-scene.png',
    rows: 5,
    cols: 7,
    difficulty: 'medium',
    category: 'exhibition',
    tags: ['street', 'vintage', 'architecture', 'urban'],
    maxPlayers: 50,
    currentPlayers: 0,
    exhibitionId: 'main-exhibition',
    unlockCode: 'vintage_street_2024',
    isUnlocked: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pieces: []
  }
];

export async function GET(request: NextRequest) {
  try {
    console.log('🎭 Returning mock puzzles data');
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Simple pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPuzzles = mockPuzzles.slice(startIndex, endIndex);
    
    return NextResponse.json({
      success: true,
      data: paginatedPuzzles,
      pagination: {
        page,
        limit,
        total: mockPuzzles.length,
        totalPages: Math.ceil(mockPuzzles.length / limit),
        hasNextPage: endIndex < mockPuzzles.length,
        hasPrevPage: page > 1
      },
      message: 'Mock data - Database connection not available'
    });
    
  } catch (error) {
    console.error('❌ Error returning mock puzzles:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as any).message,
      data: []
    }, { status: 500 });
  }
}
