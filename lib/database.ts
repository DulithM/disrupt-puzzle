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

export async function connectToDatabase() {
  if (connection.isConnected) {
    return;
  }

  try {
    const db = await mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME,
    });

    connection.isConnected = db.connections[0].readyState === 1;
    
    if (connection.isConnected) {
      console.log('✅ Connected to MongoDB successfully');
    }
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
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
