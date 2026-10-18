import type { ThreeEvent } from '@react-three/fiber';
import { useAppStore } from '../../state/store';
import { ASSEMBLY_STEPS } from '../../data/steps';

export function useStepHighlight(id: string): boolean {
  return useAppStore((state) => {
    if (state.mode !== 'teach') return false;
    const step = ASSEMBLY_STEPS[Math.min(state.teaching.stepIndex, ASSEMBLY_STEPS.length - 1)];
    return step ? step.partIds.includes(id) : false;
  });
}

export function selectPart(id: string) {
  useAppStore.getState().select(id);
}

export function hoverPart(id: string) {
  useAppStore.getState().hover(id);
}

export function clearHover(id: string) {
  if (useAppStore.getState().hoveredId === id) useAppStore.getState().hover(null);
  document.body.style.cursor = '';
}

export function partPointerHandlers(id: string) {
  return {
    onClick: (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      selectPart(id);
    },
    onPointerOver: (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      hoverPart(id);
      document.body.style.cursor = 'pointer';
    },
    onPointerOut: (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      clearHover(id);
    },
  };
}
