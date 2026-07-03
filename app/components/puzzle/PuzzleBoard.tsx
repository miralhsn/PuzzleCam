'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';

import type { PuzzleState } from '../../types';
import { countCorrect, isSolved } from '../../lib/puzzle';
import { PuzzlePiece } from './PuzzlePiece';

interface Props {
  state: PuzzleState;
  onMove: (newOrder: string[], solved: boolean) => void;
}

function getPieceSize(gridSize: number): number {
  const maxBoard = Math.min(
    typeof window !== 'undefined' ? window.innerWidth * 0.84 : 480,
    typeof window !== 'undefined' ? window.innerHeight * 0.58 : 480,
    520
  );
  return Math.floor(maxBoard / gridSize);
}

export function PuzzleBoard({ state, onMove }: Props) {
  const [order, setOrder] = useState<string[]>(state.order);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pxSize, setPxSize] = useState(() => getPieceSize(state.gridSize));

  useEffect(() => { setOrder(state.order); }, [state.order]);

  useEffect(() => {
    const handleResize = () => setPxSize(getPieceSize(state.gridSize));
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [state.gridSize]);

  const pieceMap = useMemo(
    () => Object.fromEntries(state.pieces.map(p => [p.id, p])),
    [state.pieces]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 100, tolerance: 6 } })
  );

  const onDragStart = useCallback((e: DragStartEvent) => {
    setActiveId(e.active.id as string);
  }, []);

  const onDragEnd = useCallback((e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    // Compute next order outside the state updater to avoid setState-during-render
    const currentOrder = order;
    const from = currentOrder.indexOf(active.id as string);
    const to   = currentOrder.indexOf(over.id   as string);
    if (from === -1 || to === -1) return;
    const next = arrayMove(currentOrder, from, to);
    setOrder(next);

    // Call onMove after the state update, not inside the updater
    const testState = { ...state, order: next };
    setTimeout(() => onMove(next, isSolved(testState)), 0);
  }, [state, onMove]);

  const activePiece = activeId ? pieceMap[activeId] : null;
  const boardPx = pxSize * state.gridSize;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={order} strategy={rectSortingStrategy}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${state.gridSize}, ${pxSize}px)`,
            gridTemplateRows:    `repeat(${state.gridSize}, ${pxSize}px)`,
            gap: '3px',
            width: boardPx,
            height: boardPx,
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 12,
            padding: 4,
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {order.map((id, idx) => {
            const piece = pieceMap[id];
            const isCorrect = piece.correctIndex === idx;
            return (
              <PuzzlePiece
                key={id}
                piece={piece}
                size={pxSize - 3}
                isCorrect={isCorrect}
              />
            );
          })}
        </div>
      </SortableContext>

      <DragOverlay>
        {activePiece && (
          <img
            src={activePiece.imageDataUrl}
            alt=""
            style={{
              width: pxSize, height: pxSize,
              borderRadius: 3,
              opacity: 0.9,
              boxShadow: '0 0 28px rgba(0,180,255,0.4)',
              transform: 'scale(1.06)',
              pointerEvents: 'none',
            }}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
