import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { Puzzle } from '@/lib/models/Puzzle'
import mongoose from 'mongoose'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const { id } = params
    
    console.log(`🔄 Setting puzzle ${id} as active (currentlyInUse: true)`)
    
    // First, clear all currentlyInUse flags
    const clearResult = await Puzzle.updateMany(
      { currentlyInUse: true },
      { $set: { currentlyInUse: false } },
      { runValidators: false }
    )
    console.log(`🔄 Cleared currentlyInUse flags: ${clearResult.modifiedCount} modified`)
    
    // Then set the specified puzzle as active
    let updateResult = null
    if (mongoose.Types.ObjectId.isValid(id)) {
      updateResult = await Puzzle.updateOne(
        { _id: id },
        { $set: { currentlyInUse: true } },
        { runValidators: false }
      )
    }
    
    // If not found by ObjectId, try to update by the 'id' field (string ID)
    if (!updateResult || updateResult.matchedCount === 0) {
      updateResult = await Puzzle.updateOne(
        { id: id },
        { $set: { currentlyInUse: true } },
        { runValidators: false }
      )
    }
    
    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Puzzle not found' },
        { status: 404 }
      )
    }
    
    console.log(`✅ Puzzle ${id} set as active: ${updateResult.modifiedCount} modified`)
    
    return NextResponse.json({
      success: true,
      data: { 
        puzzleId: id, 
        currentlyInUse: true,
        modifiedCount: updateResult.modifiedCount
      },
      message: `Puzzle ${id} set as active`
    })
    
  } catch (error) {
    console.error('❌ Error setting puzzle as active:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to set puzzle as active' },
      { status: 500 }
    )
  }
}

