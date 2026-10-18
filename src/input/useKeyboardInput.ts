import { useEffect } from 'react';
import { KEY_BY_CODE } from '../data/layout';
import { useAppStore } from '../state/store';
import { director } from '../state/director';

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
}

export function useKeyboardInput(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;
      if (useAppStore.getState().mode !== 'preview') return;
      const key = KEY_BY_CODE[event.code];
      if (!key) return;
      if (event.code === 'Space') event.preventDefault();
      const active = document.activeElement;
      if (active instanceof HTMLElement && active.tagName === 'BUTTON') active.blur();
      director.pressKey(event.code, 'keyboard');
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (!KEY_BY_CODE[event.code]) return;
      director.releaseKey(event.code);
    };
    const onBlur = () => director.releaseAllKeys(true);
    const onVisibility = () => {
      if (document.hidden) director.releaseAllKeys(true);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
      director.releaseAllKeys(true);
    };
  }, []);
}
