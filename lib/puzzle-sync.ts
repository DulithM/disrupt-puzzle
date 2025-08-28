// Simple browser-side sync for the active puzzle across pages via localStorage
// Uses 'storage' events so changes propagate between tabs/routes

const ACTIVE_PUZZLE_ID_KEY = 'activePuzzleId'
const ACTIVE_PUZZLE_INDEX_KEY = 'activePuzzleIndex'

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
