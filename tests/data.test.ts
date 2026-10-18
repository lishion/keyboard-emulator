import { describe, expect, it, beforeEach } from 'vitest';
import * as THREE from 'three';
import { CAP_BOTTOM, CASE_D, CASE_W, KEYFIELD_D, KEYFIELD_W, STAB_KEYS, U } from '../src/config/constants';
import { KEYS, KEY_BY_CODE, STAB_KEYS_LIST } from '../src/data/layout';
import {
  ALL_PARTS,
  HERO_PARTS,
  KEYCAP_PART_IDS,
  MATERIAL_INFO,
  PARTS,
  PART_BY_ID,
  STAB_PART_IDS,
  SWITCH_PART_IDS,
} from '../src/data/parts';
import { ASSEMBLY_STEPS, TOTAL_STEPS, validateSteps } from '../src/data/steps';
import { useAppStore } from '../src/state/store';
import { director } from '../src/state/director';
import { THEMES } from '../src/config/themes';
import {
  APPEARANCE_KEYS,
  idsForScope,
  schemaForPart,
  scopesForPart,
  variantForPart,
} from '../src/customization/schema';
import { resolveAppearance } from '../src/customization/defaults';
import { sanitizeAppearance } from '../src/customization/persist';
import { materialOptionsFor, materialPatch, materialPresetFor } from '../src/customization/materialPresets';

describe('key layout', () => {
  it('defines exactly 87 keys with unique ids, codes and switch ids', () => {
    expect(KEYS).toHaveLength(87);
    expect(new Set(KEYS.map((key) => key.id)).size).toBe(87);
    expect(new Set(KEYS.map((key) => key.code)).size).toBe(87);
    expect(new Set(KEYS.map((key) => key.switchId)).size).toBe(87);
    expect(KEYCAP_PART_IDS).toHaveLength(87);
    expect(SWITCH_PART_IDS).toHaveLength(87);
  });

  it('contains the ANSI TKL key set including navigation and arrows', () => {
    for (const code of [
      'Escape',
      'F1',
      'F12',
      'PrintScreen',
      'ScrollLock',
      'Pause',
      'Insert',
      'Home',
      'PageUp',
      'Delete',
      'End',
      'PageDown',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Space',
      'Enter',
      'Backspace',
    ]) {
      expect(KEY_BY_CODE[code], code).toBeTruthy();
    }
    expect(KEY_BY_CODE.Digit0).toBeTruthy();
    expect(KEY_BY_CODE.ControlRight).toBeTruthy();
  });

  it('uses correct long-key widths', () => {
    expect(KEY_BY_CODE.Space.widthU).toBe(6.25);
    expect(KEY_BY_CODE.Enter.widthU).toBe(2.25);
    expect(KEY_BY_CODE.Backspace.widthU).toBe(2);
    expect(KEY_BY_CODE.ShiftLeft.widthU).toBe(2.25);
    expect(KEY_BY_CODE.ShiftRight.widthU).toBe(2.75);
    expect(KEY_BY_CODE.Tab.widthU).toBe(1.5);
    expect(KEY_BY_CODE.Backslash.widthU).toBe(1.5);
  });

  it('keeps every key cap inside the key field and the case', () => {
    for (const key of KEYS) {
      expect(Math.abs(key.x) + key.widthMm / 2).toBeLessThanOrEqual(KEYFIELD_W / 2 + 0.01);
      expect(Math.abs(key.z) + (U - 0.78) / 2).toBeLessThanOrEqual(KEYFIELD_D / 2 + 0.01);
      expect(KEYFIELD_W).toBeLessThan(CASE_W);
      expect(KEYFIELD_D).toBeLessThan(CASE_D);
    }
  });

  it('places a stabilizer on the five required long keys', () => {
    expect(STAB_KEYS_LIST).toHaveLength(5);
    expect(STAB_PART_IDS).toHaveLength(5);
    expect(Object.keys(STAB_KEYS)).toHaveLength(5);
    for (const key of STAB_KEYS_LIST) {
      expect(key.stabSpacing).toBeGreaterThan(20);
      expect(PART_BY_ID[`stab-${key.code}`]).toBeTruthy();
    }
  });
});

describe('part tree', () => {
  it('has unique part ids and valid parents', () => {
    expect(new Set(ALL_PARTS.map((part) => part.id)).size).toBe(ALL_PARTS.length);
    for (const part of ALL_PARTS) {
      expect(MATERIAL_INFO[part.material], `${part.id} material`).toBeTruthy();
      if (part.parentId) expect(PART_BY_ID[part.parentId], `${part.id} parent`).toBeTruthy();
    }
  });

  it('keeps board layers in the intended vertical order', () => {
    const upper = PART_BY_ID['case-upper'].explode!.position[1];
    const caps = PART_BY_ID[KEYCAP_PART_IDS[0]].explode!.position[1];
    const switches = PART_BY_ID[SWITCH_PART_IDS[0]].explode!.position[1];
    const plate = PART_BY_ID.plate.explode!.position[1];
    const foam = PART_BY_ID['foam-sandwich'].explode!.position[1];
    const pcb = PART_BY_ID.pcb.explode!.position[1];
    expect(upper).toBeGreaterThan(caps);
    expect(caps).toBeGreaterThan(switches);
    expect(switches).toBeGreaterThan(plate);
    expect(plate).toBeGreaterThan(foam);
    expect(foam).toBeGreaterThan(pcb);
  });

  it('has 87 keycaps and 87 switches with matching ids', () => {
    expect(PARTS.filter((part) => part.type === 'keycap')).toHaveLength(87);
    expect(PARTS.filter((part) => part.type === 'switch')).toHaveLength(87);
    for (const key of KEYS) {
      expect(PART_BY_ID[key.id]?.type).toBe('keycap');
      expect(PART_BY_ID[key.switchId]?.type).toBe('switch');
    }
  });

  it('models the full hero switch internal set', () => {
    const ids = HERO_PARTS.map((part) => part.id);
    for (const id of [
      'hero-top',
      'hero-stem',
      'hero-spring',
      'hero-bottom',
      'hero-contact-moving',
      'hero-contact-fixed',
      'hero-pin-1',
      'hero-pin-2',
      'hero-pole-center',
      'hero-pole-left',
      'hero-pole-right',
    ]) {
      expect(ids).toContain(id);
    }
  });

  it('does not contain battery, wireless or tray-mount parts', () => {
    for (const part of ALL_PARTS) {
      expect(part.id).not.toMatch(/battery|wireless|tray/i);
      expect(part.name).not.toMatch(/电池|无线|Tray Mount/i);
    }
  });
});

describe('assembly steps', () => {
  it('passes dependency, id and sound-time validation', () => {
    expect(validateSteps()).toEqual([]);
  });

  it('references existing part ids in every step and move', () => {
    for (const step of ASSEMBLY_STEPS) {
      expect(step.dependsOn.every((id) => ASSEMBLY_STEPS.some((entry) => entry.id === id))).toBe(
        true,
      );
      for (const id of step.partIds) expect(PART_BY_ID[id], `${step.id}: ${id}`).toBeTruthy();
      for (const move of step.moves) {
        for (const id of move.ids) expect(PART_BY_ID[id], `${step.id} move: ${id}`).toBeTruthy();
      }
      expect(step.sound.length).toBeGreaterThan(0);
      expect(step.camera.position).toHaveLength(3);
      expect(step.camera.target).toHaveLength(3);
    }
    expect(TOTAL_STEPS).toBeGreaterThanOrEqual(12);
  });
});

describe('teaching director determinism', () => {
  const point = new THREE.Vector3();

  beforeEach(() => {
    useAppStore.setState({ mode: 'teach' });
    director.setDirection(1);
    director.restart();
    director.releaseAllKeys();
  });

  it('rebuilds the same state when jumping to the same step repeatedly', () => {
    director.jumpToStep(6);
    director.getPartLocalPosition('cap-Enter', point);
    const first = point.clone();
    director.restart();
    director.jumpToStep(6);
    director.getPartLocalPosition('cap-Enter', point);
    expect(point.distanceTo(first)).toBeLessThan(1e-9);
  });

  it('returns to the assembled state after restart', () => {
    director.jumpToStep(10);
    director.restart();
    director.getPartLocalPosition('cap-Enter', point);
    expect(point.y).toBeCloseTo(CAP_BOTTOM, 5);
  });

  it('applies cumulative removal deltas without drift', () => {
    director.jumpToStep(4);
    director.getPartLocalPosition('cap-Enter', point);
    expect(point.y).toBeGreaterThan(CAP_BOTTOM + 150);
    director.jumpToStep(0);
    director.getPartLocalPosition('cap-Enter', point);
    expect(point.y).toBeCloseTo(CAP_BOTTOM, 5);
  });

  it('pauses the teaching timeline when leaving teach mode', () => {
    director.jumpToStep(0);
    director.play();
    expect(director.getTeaching().playing).toBe(true);
    useAppStore.getState().setMode('preview');
    expect(director.getTeaching().playing).toBe(false);
    expect(useAppStore.getState().mode).toBe('preview');
  });

  it('supports deterministic assembly jumps', () => {
    director.setDirection(-1);
    director.jumpToStep(5);
    expect(director.getTeaching().completedThrough).toBe(5);
    expect(director.currentStepIndex()).toBe(5);
    director.restart();
    expect(director.getTeaching().completedThrough).toBe(TOTAL_STEPS - 1);
    director.setDirection(1);
    expect(director.getTeaching().completedThrough).toBe(-1);
    useAppStore.setState({ mode: 'preview' });
  });
});


describe('appearance customisation model', () => {
  it('provides a visible appearance schema for every real part', () => {
    const realParts = ALL_PARTS.filter((part) => part.type !== 'group');
    expect(realParts.length).toBeGreaterThan(180);
    for (const part of realParts) {
      const schema = schemaForPart(part);
      const fields = schema.sections.flatMap((section) => section.fields);
      expect(fields.length, `${part.id} schema`).toBeGreaterThan(0);
      for (const field of fields) {
        expect(APPEARANCE_KEYS.has(field.key), `${part.id}/${field.key}`).toBe(true);
      }
      expect(variantForPart(part).length).toBeGreaterThan(0);
    }
  });

  it('resolves theme defaults and overlays only the requested appearance fields', () => {
    const defaults = resolveAppearance('cap-Escape', 'graphite');
    expect(defaults.color?.toLowerCase()).toBe(THEMES.graphite.orange.toLowerCase());
    expect(defaults.legendText).toBe('Esc');
    expect(defaults.opacity).toBe(1);
    const custom = resolveAppearance('cap-Escape', 'graphite', {
      color: '#123456',
      legendText: 'EX',
      opacity: 0.55,
    });
    expect(custom.color).toBe('#123456');
    expect(custom.legendText).toBe('EX');
    expect(custom.opacity).toBe(0.55);
    expect(custom.roughness).toBe(defaults.roughness);
  });

  it('exposes real material families and normalises case/USB/cable variants', () => {
    expect(materialOptionsFor('case').map((option) => option.value)).toContain('acrylic');
    expect(materialOptionsFor('case').map((option) => option.value)).toContain('walnut');
    expect(materialOptionsFor('usb-board').map((option) => option.value)).toContain('aluminum');
    expect(materialPresetFor('case-upper', 'acrylic')?.label).toBe('透明亚克力');
    expect(materialPresetFor('usb-cable', 'braided')?.map).toBe('braid');
    const patch = materialPatch('case-upper', 'acrylic');
    expect(patch.material).toBe('acrylic');
    expect(patch.opacity).toBeCloseTo(0.34);
    expect(patch.color).toBe('#cfe8ee');
    expect(resolveAppearance('case-upper', 'graphite').material).toBe('aluminum');
    expect(resolveAppearance('cap-Escape', 'graphite').material).toBe('pbt');
    expect(resolveAppearance('case-upper', 'graphite').hideInternals).toBe(true);
  });

  it('maps scopes to stable part IDs including groups of gaskets and foam', () => {
    expect(idsForScope(PART_BY_ID['cap-Escape'], 'allKeycaps')).toHaveLength(87);
    expect(idsForScope(PART_BY_ID['cap-Escape'], 'sameWidth').length).toBeGreaterThan(1);
    expect(idsForScope(PART_BY_ID[SWITCH_PART_IDS[0]], 'allSwitches')).toHaveLength(87);
    expect(idsForScope(PART_BY_ID[STAB_PART_IDS[0]], 'allStabs')).toHaveLength(5);
    expect(idsForScope(PART_BY_ID['gasket-1'], 'allGaskets')).toHaveLength(8);
    expect(idsForScope(PART_BY_ID['foam-sandwich'], 'allFoam')).toHaveLength(2);
    expect(idsForScope(PART_BY_ID['case-upper'], 'caseSet')).toEqual(['case-upper', 'case-lower']);
    expect(scopesForPart(PART_BY_ID['gasket-1']).some((scope) => scope.key === 'allGaskets')).toBe(true);
  });

  it('sanitises imported JSON to known parts, keys and primitive values', () => {
    const clean = sanitizeAppearance({
      'cap-Escape': { color: '#123456', legendText: 'X', bogus: 'no', opacity: 'bad' },
      'not-a-part': { color: '#ffffff' },
      'case-upper': { color: '#abcdef', opacity: 0.4 },
    });
    expect(clean['cap-Escape']).toEqual({ color: '#123456', legendText: 'X' });
    expect(clean['not-a-part']).toBeUndefined();
    expect(clean['case-upper']).toEqual({ color: '#abcdef', opacity: 0.4 });
  });

  it('applies and resets appearance overrides through the store', () => {
    useAppStore.getState().replaceAppearance({});
    useAppStore.getState().applyAppearance(['cap-Escape'], { color: '#112233' });
    expect(useAppStore.getState().appearance['cap-Escape']?.color).toBe('#112233');
    useAppStore.getState().resetAppearance(['cap-Escape']);
    expect(useAppStore.getState().appearance['cap-Escape']).toBeUndefined();
  });
});
