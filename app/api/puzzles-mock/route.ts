import { NextRequest, NextResponse } from 'next/server';

const mockPuzzles = [
  {
    _id: 'mock-1',
    title: 'Disrupt Asia 2017',
    description: 'Celebrating the breakthroughs and connections of Disrupt Asia 2017',
    imageUrl: '/puzzles/DA-2017-19.jpg',
    rows: 4,
    cols: 6,
    difficulty: 'easy',
    category: 'exhibition',
    tags: ['disrupt-asia', '2017', 'startups', 'networking'],
    maxPlayers: 50,
    currentPlayers: 0,
    exhibitionId: 'main-exhibition',
    unlockCode: 'disrupt_asia_2017',
    isUnlocked: false,
    isActive: true, // Only the first puzzle should be active
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pieces: []
  },
  {
    _id: 'mock-2',
    title: 'Disrupt Asia 2016',
    description: 'A glimpse into the innovative spirit of Disrupt Asia 2016',
    imageUrl: '/puzzles/DA-2016-7.jpg',
    rows: 5,
    cols: 7,
    difficulty: 'medium',
    category: 'exhibition',
    tags: ['disrupt-asia', '2016', 'innovation', 'technology'],
    maxPlayers: 50,
    currentPlayers: 0,
    exhibitionId: 'main-exhibition',
    unlockCode: 'disrupt_asia_2016',
    isUnlocked: false,
    isActive: false, // Second puzzle should not be active
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
