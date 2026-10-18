import { Component, useEffect, useState, type ReactNode } from 'react';
import { KeyboardScene } from './three/KeyboardScene';
import { TopBar } from './ui/TopBar';
import { LeftPanel } from './ui/LeftPanel';
import { RightPanel } from './ui/RightPanel';
import { BottomBar } from './ui/BottomBar';
import { ViewportOverlay } from './ui/ViewportOverlay';
import { useKeyboardInput } from './input/useKeyboardInput';
import { useAppStore } from './state/store';
import { audioEngine } from './audio/AudioEngine';
import { speechService } from './audio/speech';

class SceneErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch() {
    useAppStore.getState().setLoading(false);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="webgl-fallback">
          <span className="fallback-code">WEBGL / SCENE ERROR</span>
          <h2>三维视口无法初始化</h2>
          <p>{this.state.error.message}</p>
          <p>请确认浏览器启用了 WebGL，或尝试关闭“画质 高”后重试。</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl')),
    );
  } catch {
    return false;
  }
}

function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(() => window.innerWidth < 1040);
  useEffect(() => {
    const update = () => setMobile(window.innerWidth < 1040);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return mobile;
}

export default function App() {
  useKeyboardInput();
  const loading = useAppStore((state) => state.loading);
  const leftOpen = useAppStore((state) => state.leftOpen);
  const rightOpen = useAppStore((state) => state.rightOpen);
  const setDrawer = useAppStore((state) => state.setDrawer);
  const [webgl] = useState(detectWebGL);
  const isMobile = useIsMobile();

  useEffect(() => {
    const state = useAppStore.getState();
    state.requestCamera('perspective', { preset: 'perspective' });
    if (window.innerWidth < 1040) {
      setDrawer('left', false);
      setDrawer('right', false);
    }
    const resume = () => {
      if (useAppStore.getState().soundEnabled) void audioEngine.init();
    };
    const quiet = () => {
      audioEngine.cancelTimeline();
      speechService.cancel();
    };
    window.addEventListener('pointerdown', resume);
    window.addEventListener('blur', quiet);
    document.addEventListener('visibilitychange', quiet);
    const loaderFallback = window.setTimeout(() => useAppStore.getState().setLoading(false), 15000);
    return () => {
      window.clearTimeout(loaderFallback);
      window.removeEventListener('pointerdown', resume);
      window.removeEventListener('blur', quiet);
      document.removeEventListener('visibilitychange', quiet);
      audioEngine.cancelTimeline();
      speechService.cancel();
    };
  }, [setDrawer]);

  if (!webgl) {
    return (
      <div className="webgl-fallback webgl-fallback--full">
        <span className="fallback-code">WEBGL NOT AVAILABLE</span>
        <h1>这台设备暂时无法运行三维视口</h1>
        <p>本项目需要 WebGL。请在启用硬件加速的浏览器中打开，或更新显卡驱动后重试。</p>
        <ul>
          <li>键盘结构、BOM 与拆装步骤仍以数据形式打包在项目中。</li>
          <li>建议使用最新版 Chrome、Edge、Safari 或 Firefox。</li>
        </ul>
      </div>
    );
  }

  return (
    <div className="app">
      <TopBar />
      <div className="workspace">
        <LeftPanel />
        <main className="viewport">
          <SceneErrorBoundary>
            <KeyboardScene />
          </SceneErrorBoundary>
          <ViewportOverlay />
        </main>
        <RightPanel />
      </div>
      <BottomBar />
      {isMobile ? (
        <div
          className={`drawer-scrim ${leftOpen || rightOpen ? 'is-visible' : ''}`}
          onClick={() => {
            setDrawer('left', false);
            setDrawer('right', false);
          }}
        />
      ) : null}
      <div className={`loading-screen ${loading ? 'is-visible' : ''}`} aria-hidden={!loading}>
        <div className="loading-mark">MX</div>
        <div className="loading-text">
          <strong>MX-87 STRUCTURE LAB</strong>
          <span>正在生成 87 键参数化几何…</span>
        </div>
        <div className="loading-bar">
          <i />
        </div>
      </div>
      <div className="corner-note">MX-87 · REFERENCE STRUCTURE · NOT A PRODUCT REPLICA</div>
    </div>
  );
}
