import { connectToDatabase } from './database';
import { Puzzle } from './models/Puzzle';
import { printQRCodeInstructions } from './qr-generator';

const samplePuzzles = [
  {
    title: 'Mountain Landscape',
    description: 'A beautiful mountain landscape with snow-capped peaks and lush valleys',
    imageUrl: '/mountain-landscape-puzzle.png',
    rows: 4,
    cols: 6,
    difficulty: 'easy',
    category: 'exhibition',
    tags: ['mountains', 'landscape', 'nature', 'scenic'],
    maxPlayers: 50,
    exhibitionId: 'main-exhibition',
    unlockCode: 'mountain_landscape_2024'
  },
  {
    title: 'Vintage Street Scene',
    description: 'A nostalgic view of an old European street with cobblestones and historic buildings',
    imageUrl: '/vintage-street-scene.png',
    rows: 5,
    cols: 7,
    difficulty: 'medium',
    category: 'exhibition',
    tags: ['street', 'vintage', 'architecture', 'urban'],
    maxPlayers: 50,
    exhibitionId: 'main-exhibition',
    unlockCode: 'vintage_street_2024'
  },
  {
    title: 'Ocean Sunset',
    description: 'A breathtaking ocean sunset with golden skies and calm waters',
    imageUrl: '/Ocean Sunset.png',
    rows: 6,
    cols: 8,
    difficulty: 'hard',
    category: 'exhibition',
    tags: ['ocean', 'sunset', 'nature', 'water'],
    maxPlayers: 50,
    exhibitionId: 'main-exhibition',
    unlockCode: 'ocean_sunset_2024'
  },
  {
    title: 'City Skyline',
    description: 'Modern city skyline with towering skyscrapers and urban architecture',
    imageUrl: '/City Skyline.png',
    rows: 4,
    cols: 5,
    difficulty: 'easy',
    category: 'exhibition',
    tags: ['city', 'skyline', 'architecture', 'modern'],
    maxPlayers: 50,
    exhibitionId: 'main-exhibition',
    unlockCode: 'city_skyline_2024'
  },
  {
    title: 'Forest Path',
    description: 'A serene forest path surrounded by tall trees and natural beauty',
    imageUrl: '/Forest Path.png',
    rows: 5,
    cols: 6,
    difficulty: 'medium',
    category: 'exhibition',
    tags: ['forest', 'nature', 'path', 'trees'],
    maxPlayers: 50,
    exhibitionId: 'main-exhibition',
    unlockCode: 'forest_path_2024'
  }
];

export async function seedDatabase() {
  try {
    console.log('🌱 Starting exhibition database seeding...');
    
    // Clear existing data
    await Puzzle.deleteMany({});
    console.log('🗑️  Cleared existing puzzles');
    
    // Create puzzles
    const createdPuzzles = await Puzzle.insertMany(samplePuzzles);
    console.log(`🧩 Created ${createdPuzzles.length} exhibition puzzles`);
    
    console.log('✅ Exhibition database seeding completed successfully!');
    
    // Log created data
    console.log('\n📊 Created Exhibition Puzzles:');
    createdPuzzles.forEach(puzzle => {
      console.log(`  • ${puzzle.title} (${puzzle.rows}x${puzzle.cols}) - Unlock: ${puzzle.unlockCode}`);
      console.log(`    Pieces: ${puzzle.rows * puzzle.cols} | Difficulty: ${puzzle.difficulty}`);
    });
    
    // Generate QR code instructions
    printQRCodeInstructions();
    
  } catch (error) {
    console.error('❌ Error seeding exhibition database:', error);
    throw error;
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Exhibition seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Exhibition seeding failed:', error);
      process.exit(1);
    });
}
