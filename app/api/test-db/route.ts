import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing database connection...');
    
    // Test connection
    await connectToDatabase();
    
    // Check connection state
    const connectionState = mongoose.connection.readyState;
    const connectionStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    console.log('📊 Connection state:', connectionStates[connectionState]);
    
    // Test a simple query
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    return NextResponse.json({
      success: true,
      connection: {
        state: connectionStates[connectionState],
        readyState: connectionState
      },
      database: {
        name: mongoose.connection.db.databaseName,
        collections: collections.map(col => col.name)
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasMongoUri: !!process.env.MONGODB_URI,
        hasDbName: !!process.env.MONGODB_DB_NAME
      }
    });
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as any).message,
      details: {
        name: (error as any).name,
        code: (error as any).code,
        stack: process.env.NODE_ENV === 'development' ? (error as any).stack : undefined
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasMongoUri: !!process.env.MONGODB_URI,
        hasDbName: !!process.env.MONGODB_DB_NAME
      }
    }, { status: 500 });
  }
}
