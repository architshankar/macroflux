import React, { useState } from 'react';
import { isApiError } from '../apiClient';

export function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return arr;
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Sort by `position` when the backend sends it; otherwise keep the server's order. */
export function sortByPosition<T extends { position?: number }>(items: T[]): T[] {
  if (!items.some((i) => typeof i.position === 'number')) return items;
  return items.slice().sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity));
}

export function reorderErrorMessage(err: unknown): string {
  // PUT .../order lands on the existing .../{id} route until the backend adds it → 405.
  if (isApiError(err, 405) || isApiError(err, 404)) {
    return 'Reordering is not live on the backend yet (GYM_MODULE_SPEC.md §12b)';
  }
  return (err as any)?.message || 'Error saving order';
}

/**
 * Native HTML5 drag-and-drop for one list. Each hook instance only accepts drops
 * from its own items, so separate lists (e.g. per equipment-type category) can't
 * be mixed. Touch devices don't fire HTML5 drag events — pair with move buttons.
 */
export function useDragReorder<T extends { id: string }>(
  items: T[],
  onCommit: (next: T[]) => void,
  disabled = false
) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const reset = () => {
    setDragId(null);
    setOverId(null);
  };

  const getItemProps = (item: T, enabled = true) => ({
    draggable: !disabled && enabled,
    onDragStart: (e: React.DragEvent) => {
      setDragId(item.id);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', item.id);
    },
    onDragOver: (e: React.DragEvent) => {
      if (!dragId) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (overId !== item.id) setOverId(item.id);
    },
    onDrop: (e: React.DragEvent) => {
      if (!dragId) return;
      e.preventDefault();
      const from = items.findIndex((i) => i.id === dragId);
      const to = items.findIndex((i) => i.id === item.id);
      reset();
      if (from !== -1 && to !== -1 && from !== to) onCommit(moveItem(items, from, to));
    },
    onDragEnd: reset,
  });

  return { getItemProps, dragId, overId };
}

/**
 * Optimistic save: show the new order immediately, call the API, and put the old
 * order back (with a toast) if the call fails.
 */
export function useOrderSaver<T>(
  setItems: (items: T[]) => void,
  showToast: (msg: string) => void
) {
  const [isSaving, setIsSaving] = useState(false);

  const save = async (prev: T[], next: T[], persist: (next: T[]) => Promise<unknown>) => {
    setItems(next);
    setIsSaving(true);
    try {
      await persist(next);
      showToast('Order saved');
    } catch (err) {
      console.error(err);
      setItems(prev);
      showToast(reorderErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return { save, isSaving };
}
