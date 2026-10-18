import type { CSSProperties } from 'react';
import { TOTAL_STEPS } from '../data/steps';
import { useAppStore } from '../state/store';
import { director } from '../state/director';
import { applyViewPreset } from '../utils/camera';

const SPEEDS = [0.5, 1, 1.5, 2];
const VIEWS: Array<{ key: 'perspective' | 'top' | 'bottom' | 'side' | 'close'; label: string }> = [
  { key: 'perspective', label: '透视' },
  { key: 'top', label: '俯视' },
  { key: 'bottom', label: '底视' },
  { key: 'side', label: '侧视' },
  { key: 'close', label: '特写' },
];

function ViewButtons() {
  const viewPreset = useAppStore((state) => state.viewPreset);
  return (
    <div className="view-buttons">
      {VIEWS.map((view) => (
        <button
          key={view.key}
          className={viewPreset === view.key ? 'is-active' : ''}
          onClick={() => applyViewPreset(view.key)}
        >
          {view.label}
        </button>
      ))}
    </div>
  );
}

function ExplodeControls() {
  const explode = useAppStore((state) => state.explodeTarget);
  const setExplode = useAppStore((state) => state.setExplode);
  const showLabels = useAppStore((state) => state.showLabels);
  const showGuides = useAppStore((state) => state.showGuides);
  const setShowLabels = useAppStore((state) => state.setShowLabels);
  const setShowGuides = useAppStore((state) => state.setShowGuides);
  const mode = useAppStore((state) => state.mode);

  const expand = () => {
    setExplode(1);
    useAppStore.getState().requestCamera('explode');
  };
  const collapse = () => {
    setExplode(0);
    useAppStore.getState().requestCamera('perspective', { preset: 'perspective' });
  };

  return (
    <div className="dock-explode">
      <div className="explode-title">
        <span>爆炸程度</span>
        <strong>{Math.round(explode * 100)}%</strong>
      </div>
      <input
        className="range range-main"
        style={{ '--fill': `${explode * 100}%` } as CSSProperties}
        type="range"
        min={0}
        max={1}
        step={0.005}
        value={explode}
        onChange={(event) => setExplode(Number(event.target.value))}
        onPointerUp={() => {
          if (useAppStore.getState().mode === 'explode') useAppStore.getState().requestCamera('explode');
        }}
      />
      <div className="dock-row">
        <button className="btn btn-accent btn-small" onClick={expand}>
          展开
        </button>
        <button className="btn btn-ghost btn-small" onClick={collapse}>
          收回
        </button>
        {mode === 'explode' ? (
          <>
            <button className={`pill-toggle ${showLabels ? 'is-on' : ''}`} onClick={() => setShowLabels(!showLabels)}>
              名称标签
            </button>
            <button className={`pill-toggle ${showGuides ? 'is-on' : ''}`} onClick={() => setShowGuides(!showGuides)}>
              引导线
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

function PlaybackControls() {
  const teaching = useAppStore((state) => state.teaching);
  const totalProgress =
    teaching.activeStep !== null
      ? (teaching.activeStep + teaching.progress) / TOTAL_STEPS
      : (teaching.completedThrough + 1) / TOTAL_STEPS;
  const current = Math.min(teaching.stepIndex + 1, TOTAL_STEPS);

  return (
    <div className="dock-playback">
      <div className="playback-row">
        <button className="ctl" onClick={() => director.restart()} title="从头开始" aria-label="从头开始">
          ↺
        </button>
        <button className="ctl" onClick={() => director.previous()} title="上一步" aria-label="上一步">
          ⏮
        </button>
        <button className="ctl ctl-main" onClick={() => (teaching.playing ? director.pause() : director.play())} title={teaching.playing ? '暂停' : '播放'} aria-label={teaching.playing ? '暂停' : '播放'}>
          {teaching.playing ? '⏸' : '▶'}
        </button>
        <button className="ctl" onClick={() => director.next()} title="下一步" aria-label="下一步">
          ⏭
        </button>
        <button className="ctl" onClick={() => director.replay()} title="重播当前步骤" aria-label="重播当前步骤">
          ⟲
        </button>
        <div className="step-readout">
          <strong>
            {String(current).padStart(2, '0')}
            <em>/{TOTAL_STEPS}</em>
          </strong>
          <span>{teaching.direction === 1 ? '拆解' : '装配'}</span>
        </div>
        <div className="direction-switch">
          <button
            className={teaching.direction === 1 ? 'is-active' : ''}
            onClick={() => director.setDirection(1)}
          >
            拆解
          </button>
          <button
            className={teaching.direction === -1 ? 'is-active' : ''}
            onClick={() => director.setDirection(-1)}
          >
            装配
          </button>
        </div>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${Math.max(0, Math.min(1, totalProgress)) * 100}%` }} />
        {Array.from({ length: TOTAL_STEPS }, (_, index) => (
          <span
            key={index}
            className={`progress-tick ${(teaching.direction === 1 ? index <= teaching.completedThrough : index > teaching.completedThrough) ? 'is-done' : ''}`}
            style={{ left: `${(index / TOTAL_STEPS) * 100}%` }}
          />
        ))}
      </div>
      <div className="playback-row playback-row--sub">
        <div className="speed-group">
          <span>速度</span>
          {SPEEDS.map((speed) => (
            <button
              key={speed}
              className={teaching.speed === speed ? 'is-active' : ''}
              onClick={() => director.setSpeed(speed)}
            >
              {speed}×
            </button>
          ))}
        </div>
        <label className="switch switch-small">
          <input
            type="checkbox"
            checked={teaching.autoPlay}
            onChange={(event) => director.setAutoPlay(event.target.checked)}
          />
          <span /> 自动连播
        </label>
        {teaching.direction === -1 ? (
          <span className="dock-note">装配从完全拆解状态开始</span>
        ) : null}
      </div>
    </div>
  );
}

function PreviewControls() {
  const soundEnabled = useAppStore((state) => state.soundEnabled);
  const enableSound = useAppStore((state) => state.enableSound);
  const pressedCodes = useAppStore((state) => state.pressedCodes);
  const pressedCount = Object.keys(pressedCodes).length;
  return (
    <div className="dock-preview">
      <div className="preview-hint">
        <span className="live-dot" />
        <div>
          <strong>交互已就绪</strong>
          <p>点击键帽或使用实体键盘 · 输入框聚焦时自动让出键盘</p>
        </div>
      </div>
      <div className="pressed-count">
        <span>{String(pressedCount).padStart(2, '0')}</span>
        <em>KEYS DOWN</em>
      </div>
      {!soundEnabled ? (
        <button className="btn btn-accent btn-small" onClick={() => void enableSound()}>
          开启声音
        </button>
      ) : null}
    </div>
  );
}

function AxisControls() {
  const axisExplode = useAppStore((state) => state.axisExplode);
  const setAxisExplode = useAppStore((state) => state.setAxisExplode);
  return (
    <div className="dock-axis">
      <div className="explode-title">
        <span>轴体内部展开</span>
        <strong>{Math.round(axisExplode * 100)}%</strong>
      </div>
      <input
        className="range range-main"
        style={{ '--fill': `${axisExplode * 100}%` } as CSSProperties}
        type="range"
        min={0}
        max={1}
        step={0.005}
        value={axisExplode}
        onChange={(event) => setAxisExplode(Number(event.target.value))}
        onPointerUp={() => useAppStore.getState().requestCamera('axis')}
      />
      <div className="dock-row">
        <button
          className="btn btn-accent btn-small"
          onClick={() => {
            setAxisExplode(1);
            useAppStore.getState().requestCamera('axis');
          }}
        >
          内部展开
        </button>
        <button
          className="btn btn-ghost btn-small"
          onClick={() => {
            setAxisExplode(0);
            useAppStore.getState().requestCamera('axis');
          }}
        >
          合拢轴体
        </button>
      </div>
    </div>
  );
}

export function BottomBar() {
  const mode = useAppStore((state) => state.mode);
  return (
    <footer className={`bottombar mode-${mode}`}>
      <div className="dock-left">
        {mode === 'preview' ? <PreviewControls /> : null}
        {mode === 'explode' ? <ExplodeControls /> : null}
        {mode === 'teach' ? <PlaybackControls /> : null}
        {mode === 'axis' ? <AxisControls /> : null}
      </div>
      <div className="dock-right">
        <ViewButtons />
        <div className="dock-meta">
          <span>1 unit = 10 mm</span>
          <span>MM-based parametric</span>
        </div>
      </div>
    </footer>
  );
}
