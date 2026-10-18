import { useEffect, useRef } from 'react';
import {
  BOM_GROUPS,
  HERO_PARTS,
  KEYCAP_PART_IDS,
  MATERIAL_INFO,
  PARTS,
  PART_BY_ID,
  STAB_PART_IDS,
  SWITCH_PART_IDS,
  VISIBILITY_LABELS,
} from '../data/parts';
import { ASSEMBLY_STEPS, TOTAL_STEPS } from '../data/steps';
import { KEY_BY_CODE } from '../data/layout';
import { THEME_LIST } from '../config/themes';
import { useAppStore } from '../state/store';
import { director } from '../state/director';
import { focusPart } from '../utils/camera';
import { materialPresetFor } from '../customization/materialPresets';
import { variantForPart } from '../customization/schema';
import { CustomPanel } from './CustomPanel';

const STEPS = ASSEMBLY_STEPS;

function PartDetail() {
  const selectedId = useAppStore((state) => state.selectedId);
  const customAppearance = useAppStore((state) =>
    state.selectedId ? state.appearance[state.selectedId] : undefined,
  );
  const partCustomised = Boolean(customAppearance);
  const isolateId = useAppStore((state) => state.isolateId);
  const isolateSelected = useAppStore((state) => state.isolateSelected);
  const clearIsolate = useAppStore((state) => state.clearIsolate);
  const part = selectedId ? PART_BY_ID[selectedId] : null;
  const key = part?.keyCode ? KEY_BY_CODE[part.keyCode] : undefined;

  const mode = useAppStore((state) => state.mode);

  if (!part) {
    if (mode === 'axis' || director.isHeroStage) {
      return (
        <div className="detail-empty detail-empty--compact">
          <h3>选择一个轴体零件</h3>
          <p>点击三维模型或左侧“示范轴”列表，查看上盖、轴心、弹簧、触片、引脚与定位柱。</p>
          <ul className="fact-list">
            <li>
              <span>上盖</span>
              <strong>半透 PC · 十字导向</strong>
            </li>
            <li>
              <span>轴心</span>
              <strong>POM · 线性 4.0 mm</strong>
            </li>
            <li>
              <span>触片</span>
              <strong>镀金铜 · 约 2.0 mm 触发</strong>
            </li>
            <li>
              <span>引脚</span>
              <strong>2 金属脚 + 3 定位柱</strong>
            </li>
          </ul>
        </div>
      );
    }
    if (mode === 'teach') {
      return (
        <div className="detail-empty detail-empty--compact">
          <h3>跟随当前步骤</h3>
          <p>上方的步骤卡会说明当前动作。点击步骤中的零件标签，可查看它的材质与装配关系。</p>
          <ul className="fact-list">
            <li>
              <span>操作</span>
              <strong>播放 / 暂停 / 跳转</strong>
            </li>
            <li>
              <span>声音</span>
              <strong>与时间线语义事件同步</strong>
            </li>
          </ul>
        </div>
      );
    }
    return (
      <div className="detail-empty">
        <div className="empty-graphic">
          <span>87</span>
          <em>KEYS</em>
        </div>
        <h3>选择一个零件</h3>
        <p>点击三维模型或左侧装配树，查看名称、材质、数量、功能与装配关系。</p>
        <ul className="fact-list">
          <li>
            <span>布局</span>
            <strong>ANSI TKL · 87 键</strong>
          </li>
          <li>
            <span>轴体</span>
            <strong>MX 线性 · 五脚热插拔</strong>
          </li>
          <li>
            <span>结构</span>
            <strong>Gasket · FR4 定位板</strong>
          </li>
          <li>
            <span>声音</span>
            <strong>Web Audio 合成</strong>
          </li>
        </ul>
      </div>
    );
  }

  const material = MATERIAL_INFO[part.material];
  const customMaterial = customAppearance?.material
    ? materialPresetFor(variantForPart(part), customAppearance.material)
    : undefined;
  const materialName = customMaterial?.label ?? material.name;
  const parent = part.parentId ? PART_BY_ID[part.parentId] : undefined;
  const children = PARTS.filter((entry) => entry.parentId === part.id);
  const isHero = HERO_PARTS.some((entry) => entry.id === part.id);

  return (
    <div className="detail">
      <div className="detail-top">
        <span className={`type-badge vis-${part.vis}`}>{VISIBILITY_LABELS[part.vis]}</span>
        <span className="detail-top-right">
          {partCustomised ? <span className="custom-badge">自定义外观</span> : null}
          <span className="detail-id">{part.id}</span>
        </span>
      </div>
      <h3>{part.name}</h3>
      <p className="detail-en">{part.nameEn}</p>
      <div className="metric-row">
        <div>
          <span>数量</span>
          <strong>×{part.quantity}</strong>
        </div>
        <div>
          <span>材质</span>
          <strong>{materialName}</strong>
        </div>
        <div>
          <span>层级</span>
          <strong>L{part.layer}</strong>
        </div>
      </div>
      {part.dimensions ? (
        <div className="spec-line">
          <span>尺寸</span>
          <strong>{part.dimensions}</strong>
        </div>
      ) : null}
      {key ? (
        <div className="key-meta">
          <span>
            <em>code</em> {key.code}
          </span>
          <span>
            <em>row</em> {key.row}
          </span>
          <span>
            <em>width</em> {key.widthU}U
          </span>
          {key.stabSpacing ? (
            <span>
              <em>stab</em> {key.stabSpacing} mm
            </span>
          ) : null}
        </div>
      ) : null}
      <section>
        <h4>功能</h4>
        <p>{part.functionText}</p>
      </section>
      <section>
        <h4>结构说明</h4>
        <p>{part.description}</p>
      </section>
      <section>
        <h4>装配关系</h4>
        <p>{part.assemblyText}</p>
        {parent && parent.type === 'group' ? (
          <p className="assembly-parent">
            父级装配 · <button onClick={() => useAppStore.getState().select(parent.id)}>{parent.name}</button>
          </p>
        ) : null}
      </section>
      {material.note ? (
        <section>
          <h4>材料备注</h4>
          <p>{material.note}</p>
        </section>
      ) : null}
      {part.subparts ? (
        <section>
          <h4>组内构成</h4>
          <ul className="subpart-list">
            {part.subparts.map((sub) => (
              <li key={sub.name}>
                <span>{sub.name}</span>
                <em>×{sub.quantity}</em>
                <span className="muted">{sub.material}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {children.length > 0 && !isHero ? (
        <section>
          <h4>包含零件</h4>
          <div className="chip-row">
            {children.slice(0, 8).map((child) => (
              <button key={child.id} className="link-chip" onClick={() => useAppStore.getState().select(child.id)}>
                {child.name}
              </button>
            ))}
            {children.length > 8 ? <span className="muted">+{children.length - 8}</span> : null}
          </div>
        </section>
      ) : null}
      <div className="detail-actions">
        <button className="btn btn-accent" onClick={() => focusPart(part.id)}>
          聚焦零件
        </button>
        <button className="btn btn-ghost" onClick={() => (isolateId ? clearIsolate() : isolateSelected())}>
          {isolateId ? '恢复全部' : '单独显示'}
        </button>
      </div>
    </div>
  );
}

function BomPanel() {
  const rows = [
    {
      label: '键帽',
      qty: KEYCAP_PART_IDS.length,
      material: 'PBT · 热升华',
      ids: 'cap-*（87 个独立 ID）',
    },
    {
      label: '机械轴',
      qty: SWITCH_PART_IDS.length,
      material: 'PA66 / PC / POM',
      ids: 'sw-*（87 个独立 ID）',
    },
    {
      label: '卫星轴组',
      qty: STAB_PART_IDS.length,
      material: 'PA66 + 不锈钢',
      ids: '5 组 · 10 外壳 / 10 轴心 / 5 钢丝 / 20 螺丝',
    },
    { label: 'FR4 定位板', qty: 1, material: 'FR4 1.4 mm', ids: 'plate' },
    { label: 'Gasket 缓冲垫', qty: 8, material: '硅胶', ids: 'gasket-1 … gasket-8' },
    { label: '夹心棉', qty: 1, material: 'Poron / EVA', ids: 'foam-sandwich' },
    { label: '底棉', qty: 1, material: 'Poron / EVA', ids: 'foam-bottom' },
    { label: '主 PCB', qty: 1, material: 'FR4 + 沉金', ids: 'pcb' },
    { label: '热插拔插座', qty: 87, material: 'PA66 + 弹片', ids: 'pcb-hotswap' },
    { label: '矩阵二极管', qty: 87, material: 'SMD', ids: 'pcb-diodes' },
    { label: 'RGB LED', qty: 87, material: 'SMD RGB', ids: 'pcb-leds' },
    { label: '主控 MCU', qty: 1, material: 'QFN 32-bit', ids: 'pcb-mcu' },
    { label: '阻容 / 保护元件', qty: 46, material: '0402 / 0603', ids: 'pcb-passives' },
    { label: '铝合金上壳', qty: 1, material: '6063 铝', ids: 'case-upper' },
    { label: '铝合金下壳', qty: 1, material: '6063 铝', ids: 'case-lower' },
    { label: 'USB-C 子板', qty: 1, material: 'FR4', ids: 'usb-board' },
    { label: '内部连接线', qty: 1, material: 'PVC / 铜', ids: 'usb-cable' },
    { label: '橡胶脚垫', qty: 4, material: 'NBR', ids: 'foot-1 … foot-4' },
    { label: '壳体螺丝', qty: 6, material: 'M2 × 24 不锈钢', ids: 'screw-1 … screw-6' },
    { label: '子板螺丝', qty: 2, material: 'M2 × 5 不锈钢', ids: 'usb-screw-1 / -2' },
  ];
  const total = rows.reduce((sum, row) => sum + row.qty, 0);
  return (
    <div className="bom">
      <div className="bom-head">
        <h3>BOM 概览</h3>
        <span>{total} 件 / 组</span>
      </div>
      <p className="bom-note">数量由装配树中的零件 ID 直接汇总；键帽、轴体、LED 与螺丝均可在三维场景中单独拾取。</p>
      <table className="bom-table">
        <thead>
          <tr>
            <th>零件</th>
            <th>数量</th>
            <th>材质</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td>
                <strong>{row.label}</strong>
                <em>{row.ids}</em>
              </td>
              <td>×{row.qty}</td>
              <td>{row.material}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="bom-groups">
        {BOM_GROUPS.map((group) => (
          <span key={group.vis}>{group.label}</span>
        ))}
      </div>
    </div>
  );
}

function SpecPanel() {
  const themeKey = useAppStore((state) => state.themeKey);
  const setTheme = useAppStore((state) => state.setTheme);
  return (
    <div className="specs">
      <h3>技术规格</h3>
      <dl className="spec-grid">
        <div>
          <dt>布局</dt>
          <dd>ANSI TKL · 87 键 · 18.25U × 6.5U</dd>
        </div>
        <div>
          <dt>键距</dt>
          <dd>19.05 mm，所有尺寸以 mm 定义</dd>
        </div>
        <div>
          <dt>外壳</dt>
          <dd>372 × 152 mm · 6063 铝合金 · 3.2 mm 壁厚</dd>
        </div>
        <div>
          <dt>定位板</dt>
          <dd>FR4 1.4 mm · 87 轴孔 + 10 卫星轴避让</dd>
        </div>
        <div>
          <dt>PCB</dt>
          <dd>1.6 mm · 五脚热插拔 · 87 组矩阵 · 单键 RGB</dd>
        </div>
        <div>
          <dt>结构</dt>
          <dd>Gasket 悬挂 · 夹心棉 + 底棉 · 无 Tray 螺柱</dd>
        </div>
        <div>
          <dt>接口</dt>
          <dd>USB-C 子板 + 4 pin 内部连接线</dd>
        </div>
        <div>
          <dt>卫星轴</dt>
          <dd>PCB 螺丝固定式 · Space 100 mm 跨距</dd>
        </div>
      </dl>
      <h4>材质配色</h4>
      <div className="theme-list">
        {THEME_LIST.map((theme) => (
          <button
            key={theme.key}
            className={`theme-swatch ${themeKey === theme.key ? 'is-active' : ''}`}
            onClick={() => setTheme(theme.key)}
            title={theme.note}
          >
            <span className="swatch-colors">
              <i style={{ background: theme.case }} />
              <i style={{ background: theme.keycap }} />
              <i style={{ background: theme.orange }} />
              <i style={{ background: theme.blue }} />
            </span>
            <span>
              <strong>{theme.name}</strong>
              <em>{theme.note}</em>
            </span>
          </button>
        ))}
      </div>
      <h4>灯光方案</h4>
      <p className="spec-copy">
        每颗轴位一颗反贴 RGB LED，共 87 颗，由主控独立驱动。装配状态下灯光从轴体透光间隙与键帽下沿散射；按键按下时对应 LED 增亮，颜色跟随当前材质主题的强调色。
      </p>
      <h4>教学化简化说明</h4>
      <ul className="limitations">
        <li>内部高度、间隙与螺丝长度由结构关系推导，并非某个真实产品的工程图。</li>
        <li>PCB 走线、焊盘与丝印是结构性示意纹理，不是可直接生产的 Gerber 文件。</li>
        <li>整板 87 颗轴体使用共享简化几何；只有示范轴包含完整内部零件。</li>
        <li>弹簧压力、触发点 2.0 mm 与总行程 4.0 mm 为示例设定。</li>
        <li>钢丝弯折、螺纹、卡扣形变与硅胶压缩量均做了视觉简化。</li>
        <li>所有声音由 Web Audio 实时合成，属于模拟音效，不是录音采样。</li>
        <li>未加入电池、无线模块、Tray Mount 螺柱或与 Gasket 冲突的刚性固定。</li>
      </ul>
    </div>
  );
}

function StepCard() {
  const teaching = useAppStore((state) => state.teaching);
  const step = STEPS[Math.min(teaching.stepIndex, TOTAL_STEPS - 1)];
  const selectedId = useAppStore((state) => state.selectedId);
  if (!step) return null;
  const current = teaching.activeStep ?? teaching.stepIndex;
  const stateLabel = teaching.activeStep !== null ? (teaching.playing ? '动作进行中' : '已暂停') : '等待播放';
  return (
    <div className="step-card">
      <div className="step-head">
        <div>
          <span className="eyebrow">{teaching.direction === 1 ? 'DISASSEMBLY' : 'ASSEMBLY'} STEP {String(Math.min(current + 1, TOTAL_STEPS)).padStart(2, '0')} / {TOTAL_STEPS}</span>
          <h3>{step.title}</h3>
        </div>
        <span className={`step-state ${teaching.playing ? 'is-playing' : ''}`}>{stateLabel}</span>
      </div>
      <p className="step-desc">{step.description}</p>
      <div className="step-meta">
        <span>
          <em>动作</em> {step.motion}
        </span>
        <span>
          <em>镜头</em> 自动对焦
        </span>
        <span>
          <em>依赖</em> {step.dependsOn.length ? step.dependsOn.map((id) => STEPS.find((entry) => entry.id === id)?.shortTitle).join(' / ') : '无'}
        </span>
      </div>
      <div className="step-hint">{step.hint}</div>
      <div className="step-parts">
        {step.partIds.slice(0, 7).map((id) => {
          const part = PART_BY_ID[id];
          if (!part) return null;
          return (
            <button
              key={id}
              className={`link-chip ${selectedId === id ? 'is-active' : ''}`}
              onClick={() => useAppStore.getState().select(id)}
            >
              {part.name.length > 14 ? `${part.name.slice(0, 14)}…` : part.name}
            </button>
          );
        })}
        {step.partIds.length > 7 ? <span className="muted">+{step.partIds.length - 7}</span> : null}
      </div>
      <details className="step-list">
        <summary>步骤列表 · {TOTAL_STEPS} 步</summary>
        <ol>
          {STEPS.map((entry, index) => {
            const done = teaching.direction === 1 ? index <= teaching.completedThrough : index > teaching.completedThrough;
            return (
              <li key={entry.id}>
                <button
                  className={`step-item ${index === current ? 'is-current' : ''} ${done ? 'is-done' : ''}`}
                  onClick={() => {
                    director.jumpToStep(index);
                    useAppStore.getState().select(null);
                  }}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {entry.shortTitle}
                </button>
              </li>
            );
          })}
        </ol>
      </details>
    </div>
  );
}

function AxisCard() {
  const press = useAppStore((state) => state.axisPress);
  const axisExplode = useAppStore((state) => state.axisExplode);
  const setAxisPress = useAppStore((state) => state.setAxisPress);
  const setAxisExplode = useAppStore((state) => state.setAxisExplode);
  const held = useAppStore((state) => state.axisPressHeld);
  const setHeld = useAppStore((state) => state.setAxisPressHeld);
  const closed = press >= 1.95;

  useEffect(() => {
    if (!held) return;
    const release = () => {
      setHeld(false);
      setAxisPress(0);
    };
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    return () => {
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
    };
  }, [held, setHeld]);

  return (
    <div className="axis-card">
      <span className="eyebrow">SWITCH ANATOMY</span>
      <h3>MX 线性示范轴</h3>
      <p>
        线性轴没有 click 声学机构。按下时轴心压缩弹簧，动触片在约 2.0 mm 处接触静触片，电路闭合；声音来自触底与回弹，而不是触点。
      </p>
      <div className="axis-slider-head">
        <span>按压深度</span>
        <strong>{press.toFixed(2)} mm</strong>
      </div>
      <input
        className="range range-axis"
        type="range"
        min={0}
        max={4}
        step={0.01}
        value={press}
        onChange={(event) => setAxisPress(Number(event.target.value))}
      />
      <div className="axis-track">
        <span className="axis-marker" style={{ left: `${(2 / 4) * 100}%` }}>
          <em>2.0 触发</em>
        </span>
        <span className="axis-marker" style={{ left: '100%' }}>
          <em>4.0 触底</em>
        </span>
      </div>
      <div className="axis-status">
        <span className={`status-pill ${closed ? 'is-closed' : ''}`}>{closed ? '触点闭合 · 信号触发' : '触点断开'}</span>
        <button
          className={`btn ${held ? 'btn-accent' : 'btn-ghost'}`}
          onPointerDown={(event) => {
            event.preventDefault();
            setHeld(true);
            setAxisPress(3.9);
          }}
          onPointerUp={() => setHeld(false)}
          onPointerLeave={() => setHeld(false)}
        >
          按住演示
        </button>
      </div>
      <div className="axis-slider-head">
        <span>内部展开</span>
        <strong>{Math.round(axisExplode * 100)}%</strong>
      </div>
      <input
        className="range"
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={axisExplode}
        onChange={(event) => setAxisExplode(Number(event.target.value))}
        onPointerUp={() => useAppStore.getState().requestCamera('axis')}
      />
      <div className="axis-facts">
        <div>
          <span>总行程</span>
          <strong>4.0 mm</strong>
        </div>
        <div>
          <span>触发点</span>
          <strong>2.0 mm</strong>
        </div>
        <div>
          <span>弹簧</span>
          <strong>约 45 gf</strong>
        </div>
        <div>
          <span>触片</span>
          <strong>镀金铜</strong>
        </div>
      </div>
      <p className="axis-note">行程、压力与触发点为教学示例设定；展开后可选择上盖、轴心、弹簧、下盖、动/静触片、引脚与定位柱。</p>
    </div>
  );
}

export function RightPanel() {
  const mode = useAppStore((state) => state.mode);
  const tab = useAppStore((state) => state.panelTab);
  const setTab = useAppStore((state) => state.setPanelTab);
  const rightOpen = useAppStore((state) => state.rightOpen);
  const setDrawer = useAppStore((state) => state.setDrawer);
  const selectedId = useAppStore((state) => state.selectedId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [tab, selectedId, mode]);

  return (
    <aside className={`side-panel right-panel ${rightOpen ? 'is-open' : ''}`}>
      <div className="panel-head">
        <div>
          <span className="eyebrow">{mode === 'teach' ? 'GUIDED SERVICE' : mode === 'axis' ? 'ANATOMY' : 'PART INSPECTOR'}</span>
          <h2>{mode === 'teach' ? '拆装步骤' : mode === 'axis' ? '轴体原理' : '零件信息'}</h2>
        </div>
        <button className="icon-btn drawer-close" onClick={() => setDrawer('right', false)} aria-label="关闭信息栏">
          ×
        </button>
      </div>

      <div className="panel-scroll" ref={scrollRef}>
        {mode === 'axis' ? <AxisCard /> : null}
        {mode === 'teach' ? <StepCard /> : null}

        <div className="panel-tabs">
          <button className={tab === 'detail' ? 'is-active' : ''} onClick={() => setTab('detail')}>
            详情
          </button>
          <button className={tab === 'custom' ? 'is-active' : ''} onClick={() => setTab('custom')}>
            自定义
          </button>
          <button className={tab === 'bom' ? 'is-active' : ''} onClick={() => setTab('bom')}>
            BOM
          </button>
          <button className={tab === 'spec' ? 'is-active' : ''} onClick={() => setTab('spec')}>
            规格
          </button>
        </div>

        {tab === 'detail' ? <PartDetail /> : null}
        {tab === 'custom' ? <CustomPanel /> : null}
        {tab === 'bom' ? <BomPanel /> : null}
        {tab === 'spec' ? <SpecPanel /> : null}
      </div>
    </aside>
  );
}
