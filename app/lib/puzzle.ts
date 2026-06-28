import type { GridSize, PuzzlePiece, PuzzleState } from '../types';
import { shuffleGuaranteed } from '../utils/shuffle';

/**
 * Slice a captured image into N×N puzzle pieces.
 * Returns a fully shuffled PuzzleState.
 */
export async function createPuzzle(
  capturedImage: string,
  gridSize: GridSize
): Promise<PuzzleState> {
  const img = await loadImage(capturedImage);

  // Crop to square from center
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = (img.naturalWidth  - side) / 2;
  const sy = (img.naturalHeight - side) / 2;

  // Piece size in source pixels
  const piecePx = side / gridSize;

  const pieces: PuzzlePiece[] = [];

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const canvas = document.createElement('canvas');
      canvas.width  = 256;
      canvas.height = 256;
      const c = canvas.getContext('2d')!;
      c.drawImage(
        img,
        sx + col * piecePx, sy + row * piecePx, piecePx, piecePx,
        0, 0, 256, 256
      );
      const id = `piece-${row}-${col}`;
      pieces.push({
        id,
        correctIndex: row * gridSize + col,
        row,
        col,
        imageDataUrl: canvas.toDataURL('image/jpeg', 0.85),
      });
    }
  }

  const shuffledOrder = shuffleGuaranteed(pieces.map(p => p.id));

  return { pieces, order: shuffledOrder, gridSize, capturedImage };
}

/** Check whether the current order is solved */
export function isSolved(state: PuzzleState): boolean {
  return state.order.every((id, idx) => {
    const piece = state.pieces.find(p => p.id === id)!;
    return piece.correctIndex === idx;
  });
}

/** Count correctly placed pieces */
export function countCorrect(state: PuzzleState): number {
  return state.order.filter((id, idx) => {
    const piece = state.pieces.find(p => p.id === id)!;
    return piece.correctIndex === idx;
  }).length;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
