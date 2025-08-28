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
    title: 'Vintage Street Scene',
    description: 'A nostalgic view of an old European street with cobblestones and historic buildings',
    imageUrl: '/vintage-street-scene.png',
    rows: 5,
    cols: 7,
    isActive: true,
    difficulty: 'medium',
    category: 'exhibition',
    tags: ['street', 'vintage', 'architecture', 'urban'],
    maxPlayers: 50,
    currentPlayers: 0,
    exhibitionId: 'main-exhibition',
    unlockCode: 'vintage_street_2024',
    isUnlocked: false
  },
  {
    title: 'Mountain Landscape',
    description: 'A beautiful mountain landscape with snow-capped peaks and lush valleys',
    imageUrl: '/mountain-landscape-puzzle.png',
    rows: 4,
    cols: 6,
    isActive: true,
    difficulty: 'easy',
    category: 'exhibition',
    tags: ['mountains', 'landscape', 'nature', 'scenic'],
    maxPlayers: 50,
    currentPlayers: 0,
    exhibitionId: 'main-exhibition',
    unlockCode: 'mountain_landscape_2024',
    isUnlocked: false
  },
  {
    title: 'Ocean Sunset',
    description: 'A breathtaking ocean sunset with golden skies and calm waters',
    imageUrl: '/Ocean Sunset.png',
    rows: 6,
    cols: 8,
    isActive: true,
    difficulty: 'hard',
    category: 'exhibition',
    tags: ['ocean', 'sunset', 'nature', 'water'],
    maxPlayers: 50,
    currentPlayers: 0,
    exhibitionId: 'main-exhibition',
    unlockCode: 'ocean_sunset_2024',
    isUnlocked: false
  },
  {
    title: 'City Skyline',
    description: 'Modern city skyline with towering skyscrapers and urban architecture',
    imageUrl: '/City Skyline.png',
    rows: 4,
    cols: 5,
    isActive: true,
    difficulty: 'easy',
    category: 'exhibition',
    tags: ['city', 'skyline', 'architecture', 'modern'],
    maxPlayers: 50,
    currentPlayers: 0,
    exhibitionId: 'main-exhibition',
    unlockCode: 'city_skyline_2024',
    isUnlocked: false
  },
  {
    title: 'Forest Path',
    description: 'A serene forest path surrounded by tall trees and natural beauty',
    imageUrl: '/Forest Path.png',
    rows: 5,
    cols: 6,
    isActive: true,
    difficulty: 'medium',
    category: 'exhibition',
    tags: ['forest', 'nature', 'path', 'trees'],
    maxPlayers: 50,
    currentPlayers: 0,
    exhibitionId: 'main-exhibition',
    unlockCode: 'forest_path_2024',
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
