const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://mayakaduwadulith_db_user:bfWrGg3yKmx5TeFc@puzzle.hvofcqf.mongodb.net/?retryWrites=true&w=majority&appName=Puzzle';
const DB_NAME = 'puzzle_db';

// Simple schema without strict validation
const PuzzleSchema = new mongoose.Schema({
  title: String,
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
  unlockCode: String,
  isUnlocked: Boolean,
  unlockedAt: Date,
  completedAt: Date
}, { 
  timestamps: true,
  strict: false // Allow any fields
});

const Puzzle = mongoose.models.Puzzle || mongoose.model('Puzzle', PuzzleSchema);

// Puzzle data in the desired order
const puzzleDataArray = [
  {
    title: 'Image 4',
    imageUrl: '/puzzles/DA-2016.jpg',
    rows: 10,
    cols: 10,
    isActive: true,
    unlockCode: 'image_4',
    isUnlocked: false
  },
  {
    title: 'Image 3',
    imageUrl: '/puzzles/DA-2017.jpg',
    rows: 10,
    cols: 10,
    isActive: true,
    unlockCode: 'image_3',
    isUnlocked: false
  },
  {
    title: 'Image 2',
    imageUrl: '/puzzles/DA-2018.jpg',
    rows: 10,
    cols: 10,
    isActive: true,
    unlockCode: 'image_2',
    isUnlocked: false
  },
  {
    title: 'Image 1',
    imageUrl: '/puzzles/DA-2019.jpg',
    rows: 10,
    cols: 10,
    isActive: true,
    unlockCode: 'image_1',
    isUnlocked: false
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding with new puzzle order...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, { dbName: DB_NAME });
    console.log('✅ Connected to MongoDB');
    
    // Clear existing data
    await Puzzle.deleteMany({});
    console.log('🗑️  Cleared existing puzzles');
    
    // Create puzzles in the desired order
    const createdPuzzles = [];
    let globalPieceCounter = 0;
    
    for (const puzzleData of puzzleDataArray) {
      // Generate pieces for this puzzle
      const pieces = [];
      for (let row = 0; row < puzzleData.rows; row++) {
        for (let col = 0; col < puzzleData.cols; col++) {
          pieces.push({
            id: `piece-${globalPieceCounter}`,
            row,
            col,
            imageUrl: puzzleData.imageUrl,
            isPlaced: false,
            unlockCode: `${puzzleData.unlockCode}_piece_${row * puzzleData.cols + col}`,
            unlockedAt: null,
            originalPosition: { row, col }
          });
          globalPieceCounter++;
        }
      }
      
      // Create and save the puzzle
      const puzzle = new Puzzle({
        ...puzzleData,
        pieces
      });
      
      await puzzle.save();
      createdPuzzles.push(puzzle);
      console.log(`🧩 Created puzzle: ${puzzle.title} (${puzzle.rows}x${puzzle.cols}) with ${pieces.length} pieces`);
    }
    
    console.log('\n📋 Final Puzzle Sequence:');
    createdPuzzles.forEach((puzzle, index) => {
      console.log(`  ${index + 1}. ${puzzle.title} (${puzzle.unlockCode})`);
    });
    
    console.log('\n✅ Database seeding completed successfully!');
    
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
