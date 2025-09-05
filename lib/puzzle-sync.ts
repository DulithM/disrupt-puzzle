// Simple browser-side sync for the active puzzle across pages via localStorage
// Uses 'storage' events so changes propagate between tabs/routes

const ACTIVE_PUZZLE_ID_KEY = 'activePuzzleId'
const ACTIVE_PUZZLE_INDEX_KEY = 'activePuzzleIndex'
const PUZZLE_COMPLETED_KEY = 'puzzleCompleted'
const PUZZLE_STATE_KEY = 'puzzleState' // For tracking completed puzzles

export function setActivePuzzleLocal(puzzleId: string, index: number): void {
	try {
		localStorage.setItem(ACTIVE_PUZZLE_ID_KEY, puzzleId)
		localStorage.setItem(ACTIVE_PUZZLE_INDEX_KEY, String(index))
	} catch {}
}

export function getActivePuzzleIdLocal(): string | null {
	try {
		return localStorage.getItem(ACTIVE_PUZZLE_ID_KEY)
	} catch {
		return null
	}
}

export function getActivePuzzleIndexLocal(): number | null {
	try {
		const val = localStorage.getItem(ACTIVE_PUZZLE_INDEX_KEY)
		return val != null ? Number(val) : null
	} catch {
		return null
	}
}

export function onActivePuzzleChangeLocal(handler: (puzzleId: string | null, index: number | null) => void): () => void {
	const listener = (e: StorageEvent) => {
		if (e.key === ACTIVE_PUZZLE_ID_KEY || e.key === ACTIVE_PUZZLE_INDEX_KEY) {
			const id = getActivePuzzleIdLocal()
			const idx = getActivePuzzleIndexLocal()
			handler(id, idx)
		}
	}
	window.addEventListener('storage', listener)
	return () => window.removeEventListener('storage', listener)
}

export function notifyPuzzleCompleted(puzzleId: string, index: number): void {
	try {
		localStorage.setItem(PUZZLE_COMPLETED_KEY, JSON.stringify({ puzzleId, index, timestamp: Date.now() }))
	} catch {}
}

export function onPuzzleCompleted(handler: (puzzleId: string, index: number) => void): () => void {
	const listener = (e: StorageEvent) => {
		if (e.key === PUZZLE_COMPLETED_KEY) {
			try {
				const data = JSON.parse(e.newValue || '{}')
				if (data.puzzleId && data.index !== undefined) {
					handler(data.puzzleId, data.index)
				}
			} catch {}
		}
	}
	window.addEventListener('storage', listener)
	return () => window.removeEventListener('storage', listener)
}

// Puzzle state management functions
export function getPuzzleState(): { completedPuzzles: Set<string>, currentPuzzleIndex: number } {
	try {
		const state = localStorage.getItem(PUZZLE_STATE_KEY)
		if (state) {
			const parsed = JSON.parse(state)
			return {
				completedPuzzles: new Set(parsed.completedPuzzles || []),
				currentPuzzleIndex: parsed.currentPuzzleIndex || 0
			}
		}
	} catch {}
	return { completedPuzzles: new Set(), currentPuzzleIndex: 0 }
}

export function setPuzzleState(completedPuzzles: Set<string>, currentPuzzleIndex: number): void {
	try {
		localStorage.setItem(PUZZLE_STATE_KEY, JSON.stringify({
			completedPuzzles: Array.from(completedPuzzles),
			currentPuzzleIndex
		}))
	} catch {}
}

export function markPuzzleCompleted(puzzleId: string): void {
	const state = getPuzzleState()
	state.completedPuzzles.add(puzzleId)
	setPuzzleState(state.completedPuzzles, state.currentPuzzleIndex)
}

export function isPuzzleCompleted(puzzleId: string): boolean {
	const state = getPuzzleState()
	return state.completedPuzzles.has(puzzleId)
}

export function advanceToNextPuzzle(totalPuzzles: number): number {
	const state = getPuzzleState()
	const nextIndex = state.currentPuzzleIndex + 1
	const newIndex = nextIndex >= totalPuzzles ? 0 : nextIndex
	setPuzzleState(state.completedPuzzles, newIndex)
	return newIndex
}

export function resetAllPuzzles(): void {
	try {
		localStorage.setItem(PUZZLE_STATE_KEY, JSON.stringify({
			completedPuzzles: [],
			currentPuzzleIndex: 0
		}))
	} catch {}
}

export function onPuzzleStateChange(handler: (state: { completedPuzzles: Set<string>, currentPuzzleIndex: number }) => void): () => void {
	const listener = (e: StorageEvent) => {
		if (e.key === PUZZLE_STATE_KEY) {
			handler(getPuzzleState())
		}
	}
	window.addEventListener('storage', listener)
	return () => window.removeEventListener('storage', listener)
}
