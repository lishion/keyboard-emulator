import { useEffect, useRef, useState } from 'react';
import { MODE_NAMES } from '../config/constants';
import { useAppStore, type Mode } from '../state/store';
import { director } from '../state/director';
import { speechService } from '../audio/speech';

const MODES: Mode[] = ['preview', 'explode', 'teach', 'axis'];

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="mini-slider">
      <span>{label}</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <em>{Math.round(value * 100)}</em>
    </label>
  );
}

function SoundPopover({ innerRef }: { innerRef: React.RefObject<HTMLDivElement | null> }) {
  const soundEnabled = useAppStore((state) => state.soundEnabled);
  const soundReady = useAppStore((state) => state.soundReady);
  const sfxEnabled = useAppStore((state) => state.sfxEnabled);
  const voiceEnabled = useAppStore((state) => state.voiceEnabled);
  const master = useAppStore((state) => state.masterVolume);
  const keys = useAppStore((state) => state.keyVolume);
  const assembly = useAppStore((state) => state.assemblyVolume);
  const ui = useAppStore((state) => state.uiVolume);
  const enableSound = useAppStore((state) => state.enableSound);
  const setSfx = useAppStore((state) => state.setSfxEnabled);
  const setVoice = useAppStore((state) => state.setVoiceEnabled);
  const setVolume = useAppStore((state) => state.setVolume);
  const available = speechService.available;

  return (
    <div className="sound-popover" ref={innerRef}>
      <div className="sound-head">
        <div>
          <strong>{soundReady ? '音频已就绪' : soundEnabled ? '正在初始化音频' : '声音尚未开启'}</strong>
          <p>Web Audio 合成音效 · 首次点击后启用</p>
        </div>
        {!soundEnabled ? (
          <button className="btn btn-accent" onClick={() => void enableSound()}>
            开启声音
          </button>
        ) : (
          <button className="btn btn-ghost" onClick={() => useAppStore.getState().setSoundEnabled(false)}>
            关闭音频
          </button>
        )}
      </div>
      <div className="toggle-row">
        <label className="switch">
          <input type="checkbox" checked={sfxEnabled} onChange={(event) => setSfx(event.target.checked)} />
          <span /> 动作音效
        </label>
        <label className="switch">
          <input type="checkbox" checked={voiceEnabled} onChange={(event) => setVoice(event.target.checked)} />
          <span /> 中文讲解
        </label>
      </div>
      {!available ? (
        <p className="sound-note">当前浏览器没有可用中文语音；文字讲解与动作音效仍会继续。</p>
      ) : (
        <p className="sound-note">讲解使用系统 SpeechSynthesis 中文语音，与动作音效独立控制。</p>
      )}
      <Slider label="主音量" value={master} onChange={(value) => setVolume('master', value)} />
      <Slider label="按键" value={keys} onChange={(value) => setVolume('keys', value)} />
      <Slider label="装配" value={assembly} onChange={(value) => setVolume('assembly', value)} />
      <Slider label="界面" value={ui} onChange={(value) => setVolume('ui', value)} />
      <p className="sound-note sound-note--fine">
        合成音效模拟机械键盘的触底、回弹与结构碰撞，并非真实录音；并发声部受限并使用压缩器避免削波。
      </p>
    </div>
  );
}

export function TopBar() {
  const mode = useAppStore((state) => state.mode);
  const setMode = useAppStore((state) => state.setMode);
  const soundEnabled = useAppStore((state) => state.soundEnabled);
  const sfxEnabled = useAppStore((state) => state.sfxEnabled);
  const quality = useAppStore((state) => state.quality);
  const setQuality = useAppStore((state) => state.setQuality);
  const setDrawer = useAppStore((state) => state.setDrawer);
  const [soundOpen, setSoundOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!soundOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (popoverRef.current?.contains(target as Node)) return;
      if (target?.closest('.sound-button')) return;
      setSoundOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown, true);
    return () => window.removeEventListener('pointerdown', onPointerDown, true);
  }, [soundOpen]);

  const reset = () => {
    director.releaseAllKeys();
    director.restart();
    director.setExplodeTarget(0);
    director.setAxisExplodeTarget(0);
    useAppStore.getState().select(null);
    useAppStore.getState().hover(null);
    useAppStore.getState().requestCamera('perspective', { preset: 'perspective' });
  };

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">MX</div>
        <div className="brand-text">
          <h1>
            MX-87 <span>STRUCTURE LAB</span>
          </h1>
          <p>机械键盘三维结构实验室</p>
        </div>
      </div>

      <nav className="mode-tabs" aria-label="模式切换">
        {MODES.map((item, index) => (
          <button
            key={item}
            className={`mode-tab ${mode === item ? 'is-active' : ''}`}
            onClick={() => setMode(item)}
          >
            <span className="mode-index">0{index + 1}</span>
            {MODE_NAMES[item]}
          </button>
        ))}
      </nav>

      <div className="top-actions">
        <button className="btn mobile-only" onClick={() => setDrawer('left', true)}>
          装配树
        </button>
        <button className={`sound-button ${soundEnabled ? 'is-on' : ''}`} onClick={() => setSoundOpen((open) => !open)}>
          <span className="sound-icon" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 9v6h4l5 4V5L8 9H4z" />
              <path d="M16.5 8.5a5 5 0 010 7" />
            </svg>
          </span>
          <span className="sound-dot" />
          {soundEnabled ? (sfxEnabled ? '声音已开启' : '音效静音') : '开启声音'}
        </button>
        <button
          className="btn btn-ghost quality-button"
          onClick={() => setQuality(quality === 'high' ? 'low' : 'high')}
          title="切换渲染质量"
        >
          {quality === 'high' ? '画质 高' : '画质 流畅'}
        </button>
        <button className="btn btn-ghost" onClick={reset} title="重置视角与动画状态">
          重置
        </button>
        <button className="btn mobile-only" onClick={() => setDrawer('right', true)}>
          信息
        </button>
        {soundOpen ? <SoundPopover innerRef={popoverRef} /> : null}
      </div>
    </header>
  );
}
