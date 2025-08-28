const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://mayakaduwadulith_db_user:bfWrGg3yKmx5TeFc@puzzle.hvofcqf.mongodb.net/?retryWrites=true&w=majority&appName=Puzzle';
const DB_NAME = 'puzzle_db';

// Simple schema without strict validation
const PuzzleSchema = new mongoose.Schema({
  title: String,
  description: String,
  imageUrl: String,
  rows: Number,
  cols: Number,
  pieces: [{
    id: String,
    row: Number,
    col: Number,
    imageUrl: String,
    isPlaced: Boolean,
    unlockCode: String,
    unlockedAt: Date,
    originalPosition: {
      row: Number,
      col: Number
    }
  }],
  isActive: Boolean,
  difficulty: String,
  category: String,
  tags: [String],
  maxPlayers: Number,
  currentPlayers: Number,
  exhibitionId: String,
  unlockCode: String,
  isUnlocked: Boolean,
  unlockedAt: Date
}, { 
  timestamps: true,
  strict: false // Allow any fields
});

const Puzzle = mongoose.models.Puzzle || mongoose.model('Puzzle', PuzzleSchema);

async function seedDatabase() {
  try {
    console.log('🌱 Starting simple database seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, { dbName: DB_NAME });
    console.log('✅ Connected to MongoDB');
    
    // Clear existing data
    await Puzzle.deleteMany({});
    console.log('🗑️  Cleared existing puzzles');
    
    // Create a simple puzzle
    const puzzleData = {
      title: 'Vintage British Street Scene',
      description: 'A collaborative jigsaw puzzle featuring a charming vintage British street with cobblestones, brick houses, and period characters',
      imageUrl: '/vintage-street-scene.png',
      rows: 4,
      cols: 6,
      isActive: true,
      difficulty: 'medium',
      category: 'exhibition',
      tags: ['vintage', 'british', 'street', 'architecture'],
      maxPlayers: 50,
      currentPlayers: 0,
      exhibitionId: 'main-exhibition',
      unlockCode: 'vintage_street_2024',
      isUnlocked: false
    };
    
    // Generate pieces
    const pieces = [];
    for (let row = 0; row < puzzleData.rows; row++) {
      for (let col = 0; col < puzzleData.cols; col++) {
        pieces.push({
          id: `${row}-${col}`,
          row,
          col,
          imageUrl: puzzleData.imageUrl,
          isPlaced: false,
          unlockCode: `${puzzleData.unlockCode}_piece_${row}_${col}`,
          unlockedAt: null,
          originalPosition: { row, col }
        });
      }
    }
    
    // Create and save the puzzle
    const puzzle = new Puzzle({
      ...puzzleData,
      pieces
    });
    
    await puzzle.save();
    console.log(`🧩 Created puzzle: ${puzzle.title} with ${pieces.length} pieces`);
    console.log(`   Puzzle ID: ${puzzle._id}`);
    console.log(`   Title: ${puzzle.title}`);
    console.log(`   Pieces count: ${puzzle.pieces ? puzzle.pieces.length : 'No pieces'}`);
    
    // Verify the data was saved
    const savedPuzzle = await Puzzle.findById(puzzle._id);
    console.log(`\n✅ Verification:`);
    console.log(`   Saved title: ${savedPuzzle.title}`);
    console.log(`   Saved pieces: ${savedPuzzle.pieces ? savedPuzzle.pieces.length : 'No pieces'}`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    console.error('Error details:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the seeder
seedDatabase();
