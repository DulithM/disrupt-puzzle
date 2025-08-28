import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    console.log('🎭 Mock piece endpoint called for ID:', id);
    
    // For piece IDs like piece-0, piece-1, etc.
    if (id.startsWith('piece-')) {
      const pieceNumber = parseInt(id.replace('piece-', ''));
      
      // Create a mock piece
      const mockPiece = {
        id: id,
        row: Math.floor(pieceNumber / 6), // Assuming 6 columns for first puzzle
        col: pieceNumber % 6,
        imageUrl: '/puzzles/DA-2017-19.jpg',
        isPlaced: false,
        unlockCode: `disrupt_asia_2017_piece_${pieceNumber}`,
        originalPosition: {
          row: Math.floor(pieceNumber / 6),
          col: pieceNumber % 6
        }
      };
      
      return NextResponse.json({
        success: true,
        data: mockPiece,
        message: 'Mock piece data - Database connection not available'
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid piece ID' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('❌ Error in mock piece endpoint:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as any).message,
      message: 'Mock piece endpoint error'
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    console.log('🎭 Mock piece update called for ID:', id, body);
    
    // Simulate successful piece placement
    return NextResponse.json({
      success: true,
      data: {
        id: id,
        isPlaced: true,
        placedAt: new Date().toISOString(),
        placedBy: body.placedBy || 'Anonymous'
      },
      message: 'Mock piece placement successful'
    });
    
  } catch (error) {
    console.error('❌ Error in mock piece update:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as any).message,
      message: 'Mock piece update error'
    }, { status: 500 });
  }
}
