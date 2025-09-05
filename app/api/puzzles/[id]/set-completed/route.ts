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
    const body = await request.json()
    const { completed } = body
    
    console.log(`🔄 Setting puzzle ${id} completed to ${completed}`)
    
    // Try to update by MongoDB ObjectId first
    let updateResult = null
    if (mongoose.Types.ObjectId.isValid(id)) {
      updateResult = await Puzzle.updateOne(
        { _id: id },
        { $set: { completed: completed } },
        { runValidators: false }
      )
    }
    
    // If not found by ObjectId, try to update by the 'id' field (string ID)
    if (!updateResult || updateResult.matchedCount === 0) {
      updateResult = await Puzzle.updateOne(
        { id: id },
        { $set: { completed: completed } },
        { runValidators: false }
      )
    }
    
    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Puzzle not found' },
        { status: 404 }
      )
    }
    
    console.log(`✅ Puzzle ${id} completed set to ${completed}: ${updateResult.modifiedCount} modified`)
    
    return NextResponse.json({
      success: true,
      data: { 
        puzzleId: id, 
        completed: completed,
        modifiedCount: updateResult.modifiedCount
      },
      message: `Puzzle ${id} completed set to ${completed}`
    })
    
  } catch (error) {
    console.error('❌ Error setting puzzle completed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to set puzzle completed' },
      { status: 500 }
    )
  }
}
