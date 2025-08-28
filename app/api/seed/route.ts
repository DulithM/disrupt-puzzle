import { NextRequest, NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/seed-database';

export async function POST(request: NextRequest) {
  try {
    console.log('🌱 Starting database seeding via API...');
    
    await seedDatabase();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database seeded successfully with sample puzzles' 
    });
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: (error as any).message,
      details: process.env.NODE_ENV === 'development' ? (error as any).stack : undefined
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Use POST method to seed the database',
    instructions: 'Send a POST request to this endpoint to populate the database with sample puzzles'
  });
}
