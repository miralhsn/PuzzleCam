export type GamePhase =
  | 'permission'
  | 'camera'
  | 'countdown'
  | 'capturing'
  | 'puzzle'
  | 'complete';

export interface Point2D {
  x: number;
  y: number;
}

export interface FrameRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export type GridSize = 3 | 4 | 5;

export interface PuzzlePiece {
  id: string;
  correctIndex: number;
  row: number;
  col: number;
  imageDataUrl: string;
}

export interface GameStats {
  moves: number;
  startTime: number;
  elapsedSeconds: number;
}

export interface PuzzleState {
  pieces: PuzzlePiece[];
  order: string[];       // piece ids in current grid order
  gridSize: GridSize;
  capturedImage: string; // base64 data URL
}
