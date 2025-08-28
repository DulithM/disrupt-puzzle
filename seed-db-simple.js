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
    title: 'Disrupt Asia 2016',
    description: 'A glimpse into the innovative spirit of Disrupt Asia 2016',
    imageUrl: '/puzzles/DA-2016-7.jpg',
    rows: 5,
    cols: 7,
    isActive: true,
    difficulty: 'medium',
    category: 'exhibition',
    tags: ['disrupt-asia', '2016', 'innovation', 'technology'],
    maxPlayers: 50,
    currentPlayers: 0,
    exhibitionId: 'main-exhibition',
    unlockCode: 'disrupt_asia_2016',
    isUnlocked: false
  },
  {
    title: 'Disrupt Asia 2017',
    description: 'Celebrating the breakthroughs and connections of Disrupt Asia 2017',
    imageUrl: '/puzzles/DA-2017-19.jpg',
    rows: 4,
    cols: 6,
    isActive: true,
    difficulty: 'easy',
    category: 'exhibition',
    tags: ['disrupt-asia', '2017', 'startups', 'networking'],
    maxPlayers: 50,
    currentPlayers: 0,
    exhibitionId: 'main-exhibition',
    unlockCode: 'disrupt_asia_2017',
    isUnlocked: false
  },
  {
    title: 'Disrupt Asia 2018',
    description: 'The future of technology unveiled at Disrupt Asia 2018',
    imageUrl: '/puzzles/DA-2018-17.jpg',
    rows: 6,
    cols: 8,
    isActive: true,
    difficulty: 'hard',
    category: 'exhibition',
    tags: ['disrupt-asia', '2018', 'future-tech', 'disruption'],
    maxPlayers: 50,
    currentPlayers: 0,
    exhibitionId: 'main-exhibition',
    unlockCode: 'disrupt_asia_2018',
    isUnlocked: false
  },
  {
    title: 'Disrupt Asia 2019',
    description: 'Building tomorrow\'s solutions at Disrupt Asia 2019',
    imageUrl: '/puzzles/DA-2019-9.jpg',
    rows: 4,
    cols: 5,
    isActive: true,
    difficulty: 'easy',
    category: 'exhibition',
    tags: ['disrupt-asia', '2019', 'solutions', 'entrepreneurship'],
    maxPlayers: 50,
    currentPlayers: 0,
    exhibitionId: 'main-exhibition',
    unlockCode: 'disrupt_asia_2019',
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
