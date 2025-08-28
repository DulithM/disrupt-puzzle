import { connectToDatabase } from './database';
import { Puzzle } from './models/Puzzle';
import { User } from './models/User';
import { PuzzleSession } from './models/PuzzleSession';
import mongoose from 'mongoose';

// Puzzle utilities
export async function getPuzzleById(id: string) {
  await connectToDatabase();
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid puzzle ID');
  }
  
  const puzzle = await Puzzle.findById(id).lean();
  if (!puzzle) {
    throw new Error('Puzzle not found');
  }
  
  return puzzle;
}

export async function getPuzzlesByCategory(category: string, limit = 10) {
  await connectToDatabase();
  
  const puzzles = await Puzzle.find({ 
    category, 
    isActive: true 
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .lean();
  
  return puzzles;
}

export async function getPuzzlesByDifficulty(difficulty: 'easy' | 'medium' | 'hard', limit = 10) {
  await connectToDatabase();
  
  const puzzles = await Puzzle.find({ 
    difficulty, 
    isActive: true 
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .lean();
  
  return puzzles;
}

export async function searchPuzzles(query: string, limit = 10) {
  await connectToDatabase();
  
  const puzzles = await Puzzle.find({
    $text: { $search: query },
    isActive: true
  })
  .sort({ score: { $meta: 'textScore' } })
  .limit(limit)
  .lean();
  
  return puzzles;
}

// Session utilities
export async function getActiveSessionByPuzzleId(puzzleId: string) {
  await connectToDatabase();
  
  if (!mongoose.Types.ObjectId.isValid(puzzleId)) {
    throw new Error('Invalid puzzle ID');
  }
  
  const session = await PuzzleSession.findOne({
    puzzleId,
    isActive: true
  })
  .populate('puzzleId', 'title imageUrl rows cols')
  .lean();
  
  return session;
}

export async function createOrGetSession(puzzleId: string, settings = {}) {
  await connectToDatabase();
  
  if (!mongoose.Types.ObjectId.isValid(puzzleId)) {
    throw new Error('Invalid puzzle ID');
  }
  
  // Check if active session exists
  let session = await PuzzleSession.findOne({
    puzzleId,
    isActive: true
  });
  
  if (!session) {
    // Create new session
    session = new PuzzleSession({
      puzzleId,
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      settings: {
        maxPlayers: 10,
        allowSpectators: true,
        ...settings
      }
    });
    
    await session.save();
  }
  
  return session;
}

// User utilities
export async function getUserById(id: string) {
  await connectToDatabase();
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid user ID');
  }
  
  const user = await User.findById(id).lean();
  if (!user) {
    throw new Error('User not found');
  }
  
  return user;
}

export async function getUserByUsername(username: string) {
  await connectToDatabase();
  
  const user = await User.findOne({ username }).lean();
  if (!user) {
    throw new Error('User not found');
  }
  
  return user;
}

export async function updateUserStats(userId: string, stats: {
  puzzlesCompleted?: number;
  totalPiecesPlaced?: number;
  averageCompletionTime?: number;
  favoriteCategories?: string[];
}) {
  await connectToDatabase();
  
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid user ID');
  }
  
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  // Update stats
  if (stats.puzzlesCompleted !== undefined) {
    user.puzzleStats.puzzlesCompleted = stats.puzzlesCompleted;
  }
  if (stats.totalPiecesPlaced !== undefined) {
    user.puzzleStats.totalPiecesPlaced = stats.totalPiecesPlaced;
  }
  if (stats.averageCompletionTime !== undefined) {
    user.puzzleStats.averageCompletionTime = stats.averageCompletionTime;
  }
  if (stats.favoriteCategories !== undefined) {
    user.puzzleStats.favoriteCategories = stats.favoriteCategories;
  }
  
  await user.save();
  return user;
}

// Statistics utilities
export async function getPuzzleStats() {
  await connectToDatabase();
  
  const [
    totalPuzzles,
    activePuzzles,
    completedPuzzles,
    totalPieces,
    placedPieces
  ] = await Promise.all([
    Puzzle.countDocuments(),
    Puzzle.countDocuments({ isActive: true }),
    Puzzle.countDocuments({ completedAt: { $exists: true } }),
    Puzzle.aggregate([
      { $group: { _id: null, total: { $sum: { $multiply: ['$rows', '$cols'] } } } }
    ]),
    Puzzle.aggregate([
      { $unwind: '$pieces' },
      { $match: { 'pieces.isPlaced': true } },
      { $count: 'total' }
    ])
  ]);
  
  return {
    totalPuzzles,
    activePuzzles,
    completedPuzzles,
    totalPieces: totalPieces[0]?.total || 0,
    placedPieces: placedPieces[0]?.total || 0,
    completionRate: totalPieces[0]?.total ? 
      Math.round((placedPieces[0]?.total / totalPieces[0].total) * 100) : 0
  };
}

export async function getTopPuzzles(limit = 5) {
  await connectToDatabase();
  
  const puzzles = await Puzzle.aggregate([
    { $match: { isActive: true } },
    {
      $addFields: {
        completionRate: {
          $cond: {
            if: { $gt: [{ $size: '$pieces' }, 0] },
            then: {
              $multiply: [
                {
                  $divide: [
                    { $size: { $filter: { input: '$pieces', cond: { $eq: ['$$this.isPlaced', true] } } } },
                    { $size: '$pieces' }
                  ]
                },
                100
              ]
            },
            else: 0
          }
        }
      }
    },
    { $sort: { completionRate: -1 } },
    { $limit: limit },
    { $project: { title: 1, completionRate: 1, difficulty: 1, category: 1 } }
  ]);
  
  return puzzles;
}
