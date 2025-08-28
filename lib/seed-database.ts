import { connectToDatabase } from './database';
import { Puzzle } from './models/Puzzle';
import { printQRCodeInstructions } from './qr-generator';

const samplePuzzles = [
  {
    title: 'Disrupt Asia 2016',
    description: 'A glimpse into the innovative spirit of Disrupt Asia 2016',
    imageUrl: '/puzzles/DA-2016-7.jpg',
    rows: 5,
    cols: 7,
    difficulty: 'medium',
    category: 'exhibition',
    tags: ['disrupt-asia', '2016', 'innovation', 'technology'],
    maxPlayers: 50,
    exhibitionId: 'main-exhibition',
    unlockCode: 'disrupt_asia_2016'
  },
  {
    title: 'Disrupt Asia 2017',
    description: 'Celebrating the breakthroughs and connections of Disrupt Asia 2017',
    imageUrl: '/puzzles/DA-2017-19.jpg',
    rows: 4,
    cols: 6,
    difficulty: 'easy',
    category: 'exhibition',
    tags: ['disrupt-asia', '2017', 'startups', 'networking'],
    maxPlayers: 50,
    exhibitionId: 'main-exhibition',
    unlockCode: 'disrupt_asia_2017'
  },
  {
    title: 'Disrupt Asia 2018',
    description: 'The future of technology unveiled at Disrupt Asia 2018',
    imageUrl: '/puzzles/DA-2018-17.jpg',
    rows: 6,
    cols: 8,
    difficulty: 'hard',
    category: 'exhibition',
    tags: ['disrupt-asia', '2018', 'future-tech', 'disruption'],
    maxPlayers: 50,
    exhibitionId: 'main-exhibition',
    unlockCode: 'disrupt_asia_2018'
  },
  {
    title: 'Disrupt Asia 2019',
    description: 'Building tomorrow\'s solutions at Disrupt Asia 2019',
    imageUrl: '/puzzles/DA-2019-9.jpg',
    rows: 4,
    cols: 5,
    difficulty: 'easy',
    category: 'exhibition',
    tags: ['disrupt-asia', '2019', 'solutions', 'entrepreneurship'],
    maxPlayers: 50,
    exhibitionId: 'main-exhibition',
    unlockCode: 'disrupt_asia_2019'
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
