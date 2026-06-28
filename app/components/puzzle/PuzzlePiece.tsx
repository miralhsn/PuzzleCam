'use client';

import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS }         from '@dnd-kit/utilities';
import type { PuzzlePiece as TPiece } from '../../types';

interface Props {
  piece: TPiece;
  size: number;
  isCorrect: boolean;
}

export const PuzzlePiece = memo(function PuzzlePiece({ piece, size, isCorrect }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: piece.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    width:  size,
    height: size,
    cursor: isDragging ? 'grabbing' : 'grab',
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.82 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={[
        'relative overflow-hidden rounded-[3px] select-none touch-none',
        'transition-shadow duration-150',
        isDragging ? 'scale-[1.05] shadow-[0_0_24px_rgba(0,180,255,0.35)]' : '',
        isCorrect  ? 'shadow-[0_0_10px_rgba(0,220,100,0.45)]' : '',
        !isDragging && !isCorrect ? 'hover:scale-[1.03] hover:shadow-[0_0_12px_rgba(0,180,255,0.2)]' : '',
      ].join(' ')}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={piece.imageDataUrl}
        alt=""
        draggable={false}
        style={{ width: size, height: size, display: 'block', pointerEvents: 'none' }}
      />

      {/* Correct indicator flash */}
      {isCorrect && (
        <div className="absolute inset-0 rounded-[3px] ring-1 ring-emerald-400/60 pointer-events-none" />
      )}
    </div>
  );
});
