import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mayakaduwadulith_db_user:bfWrGg3yKmx5TeFc@puzzle.hvofcqf.mongodb.net/?retryWrites=true&w=majority&appName=Puzzle';
const DB_NAME = process.env.MONGODB_DB_NAME || 'puzzle_db';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

interface ConnectionState {
  isConnected: boolean;
}

const connection: ConnectionState = {
  isConnected: false,
};

// For Vercel serverless environment
declare global {
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (connection.isConnected) {
    console.log('✅ Using existing MongoDB connection');
    return;
  }

  try {
    console.log('🔌 Attempting to connect to MongoDB...');
    console.log('📊 Database URI:', MONGODB_URI ? 'Set' : 'Not set');
    console.log('📊 Database Name:', DB_NAME);
    
    const db = await mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME,
      maxPoolSize: 1, // Reduce for serverless
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false, // Disable mongoose buffering
    });

    connection.isConnected = db.connections[0].readyState === 1;
    
    if (connection.isConnected) {
      console.log('✅ Connected to MongoDB successfully');
    } else {
      console.log('⚠️ MongoDB connection state:', db.connections[0].readyState);
    }
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.error('❌ Error details:', {
      name: (error as any).name,
      message: (error as any).message,
      code: (error as any).code
    });
    throw error;
  }
}

export async function disconnectFromDatabase() {
  if (!connection.isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    connection.isConnected = false;
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ MongoDB disconnection error:', error);
    throw error;
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  await disconnectFromDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectFromDatabase();
  process.exit(0);
});
