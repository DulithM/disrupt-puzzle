// Simple browser-side sync for the active puzzle across pages via localStorage
// Uses 'storage' events so changes propagate between tabs/routes

const ACTIVE_PUZZLE_ID_KEY = 'activePuzzleId'
const ACTIVE_PUZZLE_INDEX_KEY = 'activePuzzleIndex'
const PUZZLE_COMPLETED_KEY = 'puzzleCompleted'

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
