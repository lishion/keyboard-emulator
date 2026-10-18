import { HERO_STEP_INDEX, TOTAL_STEPS } from '../data/steps';
import { useAppStore } from '../state/store';
import { director } from '../state/director';

const HINTS: Record<string, { title: string; text: string }> = {
  preview: {
    title: '产品预览',
    text: '拖动旋转 · 滚轮缩放 · 右键平移 · 点击键帽试按',
  },
  explode: {
    title: '整机爆炸图',
    text: '拖动爆炸滑块观察分层 · 点击零件查看结构与装配关系',
  },
  teach: {
    title: '拆装教学',
    text: '步骤由装配依赖决定 · 播放时声音与动作同步',
  },
  axis: {
    title: '机械轴原理',
    text: '拖动按压缩放 · 观察弹簧、触片与触点的电气关系',
  },
};

export function ViewportOverlay() {
  const mode = useAppStore((state) => state.mode);
  const teaching = useAppStore((state) => state.teaching);
  const axisPress = useAppStore((state) => state.axisPress);
  const axisExplode = useAppStore((state) => state.axisExplode);
  const hint = HINTS[mode];
  const step = Math.min(teaching.stepIndex + 1, TOTAL_STEPS);
  const heroStep = mode === 'teach' && teaching.stepIndex >= HERO_STEP_INDEX;

  return (
    <div className="viewport-overlay">
      <div className="vp-top">
        <div className="vp-mode">
          <span className="vp-index">0{['preview', 'explode', 'teach', 'axis'].indexOf(mode) + 1}</span>
          <div>
            <strong>{hint.title}</strong>
            <p>{hint.text}</p>
          </div>
        </div>
        {mode === 'teach' ? (
          <div className="vp-step">
            <span>
              STEP {String(step).padStart(2, '0')} / {TOTAL_STEPS}
            </span>
            <strong>{heroStep ? '轴体内部模块' : teaching.direction === 1 ? '拆解流程' : '装配流程'}</strong>
          </div>
        ) : null}
        {mode === 'axis' ? (
          <div className="vp-step">
            <span>行程 {axisPress.toFixed(2)} mm</span>
            <strong>{axisPress >= 1.95 ? '触点闭合' : '触点断开'} · 展开 {Math.round(axisExplode * 100)}%</strong>
          </div>
        ) : null}
      </div>

      <div className="vp-bottom">
        <div className="vp-legend">
          <span>
            <i className="legend-dot" /> 键帽
          </span>
          <span>
            <i className="legend-dot legend-dot--blue" /> 轴体
          </span>
          <span>
            <i className="legend-dot legend-dot--metal" /> 结构件
          </span>
        </div>
        <span className="vp-scale">1 unit = 10 mm · ANSI TKL 87</span>
      </div>

      {mode === 'teach' ? (
        <button
          className="vp-camera-reset"
          onClick={() => {
            if (useAppStore.getState().teaching.playing) director.pause();
            else director.play();
          }}
        >
          {teaching.playing ? '暂停' : '继续'}
        </button>
      ) : null}
    </div>
  );
}
