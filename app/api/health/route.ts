import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🏥 Health check requested');
    
    return NextResponse.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasMongoUri: !!process.env.MONGODB_URI,
        hasDbName: !!process.env.MONGODB_DB_NAME,
        mongoUriLength: process.env.MONGODB_URI?.length || 0
      },
      message: 'API is working correctly'
    });
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    
    return NextResponse.json({
      success: false,
      status: 'unhealthy',
      error: (error as any).message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
