import { useEffect, useRef, type ReactNode } from 'react';
import type { Group } from 'three';
import { PART_BY_ID } from '../data/parts';
import { registerPart } from '../state/director';
import { useAppStore } from '../state/store';

interface PartGroupProps {
  id: string;
  position?: [number, number, number];
  rotationDeg?: [number, number, number];
  pressCode?: string;
  children: ReactNode;
  visible?: boolean;
  renderOrder?: number;
}

const DEG = Math.PI / 180;

export function PartGroup({
  id,
  position = [0, 0, 0],
  rotationDeg = [0, 0, 0],
  pressCode,
  children,
  visible = true,
  renderOrder,
}: PartGroupProps) {
  const ref = useRef<Group>(null);
  const part = PART_BY_ID[id];
  const categoryVisible = useAppStore((state) =>
    part ? state.categoryVisibility[part.vis] : true,
  );
  const isolated = useAppStore((state) =>
    state.isolateId === null ? false : state.isolateId === id,
  );
  const isIsolating = useAppStore((state) => state.isolateId !== null);
  const [px, py, pz] = position;
  const [rx, ry, rz] = rotationDeg;

  useEffect(() => {
    const object = ref.current;
    if (!object) return;
    object.position.set(px, py, pz);
    object.rotation.set(rx * DEG, ry * DEG, rz * DEG);
    return registerPart(id, object, pressCode);
  }, [id, pressCode, px, py, pz, rx, ry, rz]);

  return (
    <group
      ref={ref}
      visible={visible && categoryVisible && (!isIsolating || isolated)}
      renderOrder={renderOrder}
    >
      {children}
    </group>
  );
}
