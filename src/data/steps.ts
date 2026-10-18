import { KEYS, KEY_BY_CODE, STAB_KEYS_LIST } from './layout';
import { KEYCAP_PART_IDS, STAB_PART_IDS, SWITCH_PART_IDS } from './parts';

export type SoundName =
  | 'keycap-pull'
  | 'keycap-pull-long'
  | 'switch-pull'
  | 'switch-insert'
  | 'screw'
  | 'screw-lock'
  | 'aluminum-tap'
  | 'plastic-tap'
  | 'plate-tap'
  | 'stab-pull'
  | 'connector-out'
  | 'connector-in'
  | 'foam-tap'
  | 'spring'
  | 'complete'
  | 'ui';

export interface StepSoundEvent {
  /** Normalised progress in the step (0..1). */
  at: number;
  sound: SoundName;
  gain?: number;
}

export interface StepMove {
  ids: string[];
  delta: [number, number, number];
  rotation?: [number, number, number];
  /** Spread the motion over time for a less mechanical sequence. */
  stagger?: boolean;
}

export interface AssemblyStep {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  narration: string;
  dependsOn: string[];
  partIds: string[];
  moves: StepMove[];
  camera: { position: [number, number, number]; target: [number, number, number] };
  sound: StepSoundEvent[];
  motion: string;
  hint: string;
}

const REPRESENTATIVE_CAPS = ['cap-Escape', 'cap-KeyA', 'cap-KeyF'];
const REMAINING_CAPS = KEYCAP_PART_IDS.filter(
  (id) => !REPRESENTATIVE_CAPS.includes(id) && id !== 'cap-Enter',
);
const ALL_SWITCHES = SWITCH_PART_IDS;
const REMOVED_SWITCHES = ['sw-Escape', 'sw-KeyA', 'sw-Space'];
const REMAINING_SWITCHES = ALL_SWITCHES.filter((id) => !REMOVED_SWITCHES.includes(id));
const INTERNALS = [
  'plate',
  'foam-sandwich',
  'pcb',
  ...STAB_PART_IDS,
  ...REMAINING_SWITCHES,
  ...Array.from({ length: 8 }, (_, i) => `gasket-${i + 1}`),
];

const enterKey = KEY_BY_CODE.Enter;
if (!enterKey) throw new Error('Enter key missing from layout');

export const ASSEMBLY_STEPS: AssemblyStep[] = [
  {
    id: 'cap-sample',
    title: '拔下代表性普通键帽',
    shortTitle: '普通键帽',
    description:
      '从左上角开始，用拔键器垂直提起 Esc、A、F 三颗普通键帽。键帽底部的十字槽与轴心十字柱是唯一的传力接口。F 与 J 的定位凸起也在这一步被看清。',
    narration: '先拔下三颗普通键帽。键帽底部的十字槽压配在轴心十字柱上，垂直向上即可分离。',
    dependsOn: [],
    partIds: REPRESENTATIVE_CAPS,
    moves: [{ ids: REPRESENTATIVE_CAPS, delta: [0, 78, 0], rotation: [0, -3, 0], stagger: true }],
    camera: { position: [-14, 17, 20], target: [-12, 6, -1] },
    sound: [
      { at: 0.12, sound: 'keycap-pull' },
      { at: 0.38, sound: 'keycap-pull' },
      { at: 0.64, sound: 'keycap-pull' },
    ],
    motion: '垂直提拉 78 mm',
    hint: '观察底部十字柱与轴心导向柱的配合',
  },
  {
    id: 'cap-stabilized',
    title: '拔下代表性长键',
    shortTitle: '长键键帽',
    description:
      'Enter 是 2.25U 长键。它除了中央的轴心十字柱，还通过底部两个卫星轴连接柱跨接左右平衡钢丝。拔下时三个连接点必须同时脱开，长键才能平稳取下。',
    narration: '长键不只有中间的轴心。两侧的卫星轴连接柱和平衡钢丝一起工作，所以拔下时要保持水平。',
    dependsOn: ['cap-sample'],
    partIds: ['cap-Enter', 'stab-Enter'],
    moves: [
      { ids: ['cap-Enter'], delta: [0, 92, 0], rotation: [0, 3, 0] },
      { ids: ['stab-Enter'], delta: [0, 9, 0] },
    ],
    camera: { position: [10, 18, 23], target: [4, 6, 2] },
    sound: [
      { at: 0.18, sound: 'keycap-pull-long' },
      { at: 0.72, sound: 'plastic-tap', gain: 0.45 },
    ],
    motion: '长键水平抬起 92 mm',
    hint: '长键的三个连接点：中心轴心 + 左右卫星轴',
  },
  {
    id: 'cap-rest',
    title: '移除其余键帽',
    shortTitle: '全部键帽',
    description:
      '按行依次拔下剩余键帽，露出 87 颗轴体的十字轴心。此时可以看到不同行的高度和倾角差异，也能确认每颗键帽下都对应一颗独立机械轴。',
    narration: '其余键帽按行依次取下。87 颗轴体全部露出，每一颗都对应独立轴位。',
    dependsOn: ['cap-sample', 'cap-stabilized'],
    partIds: KEYCAP_PART_IDS,
    moves: [
      { ids: REMAINING_CAPS, delta: [0, 160, 0], rotation: [0, -2, 0], stagger: true },
      { ids: REPRESENTATIVE_CAPS, delta: [0, 82, 0] },
      { ids: ['cap-Enter'], delta: [0, 68, 0] },
    ],
    camera: { position: [0, 34, 48], target: [0, 11, 0] },
    sound: [
      { at: 0.1, sound: 'keycap-pull' },
      { at: 0.26, sound: 'keycap-pull' },
      { at: 0.44, sound: 'keycap-pull' },
      { at: 0.6, sound: 'keycap-pull' },
      { at: 0.78, sound: 'keycap-pull' },
      { at: 0.92, sound: 'plastic-tap', gain: 0.4 },
    ],
    motion: '分层波浪式提拉',
    hint: '87 个轴位一一对应，长键下方还有卫星轴',
  },
  {
    id: 'switch-remove',
    title: '沿热插拔方向拔出机械轴',
    shortTitle: '拔出轴体',
    description:
      '捏住 Esc、A、空格三颗轴的上盖，沿垂直方向拔出。五脚轴的两根金属脚被 PCB 背面的热插拔插座弹片夹持，不需要焊接；拔出时不能横向扭动，以免损伤插座。',
    narration: '接下来拔出三颗机械轴。垂直向上，让两根轴脚从热插拔插座里退出。',
    dependsOn: ['cap-rest'],
    partIds: REMOVED_SWITCHES,
    moves: [{ ids: REMOVED_SWITCHES, delta: [0, 58, 0], rotation: [0, 4, 0], stagger: true }],
    camera: { position: [-6, 19, 32], target: [-6, 4.5, 0] },
    sound: [
      { at: 0.18, sound: 'switch-pull' },
      { at: 0.46, sound: 'switch-pull' },
      { at: 0.74, sound: 'switch-pull' },
    ],
    motion: '沿 +Y 拔出 58 mm',
    hint: '轴脚由 PCB 背面的热插拔插座夹持',
  },
  {
    id: 'case-screws',
    title: '拆下上下壳连接螺丝',
    shortTitle: '壳体螺丝',
    description:
      '将键盘翻转，从底壳六个沉孔旋出 M2 × 24 mm 螺丝。螺丝沿自身轴向退出，同时顺时针旋转，避免在上壳牙套中滑牙。拆完六颗后才能分离上下壳。',
    narration: '翻转键盘，从底部旋出六颗壳体螺丝。螺丝先退到底，再取下上壳。',
    dependsOn: ['switch-remove'],
    partIds: ['screw-1', 'screw-2', 'screw-3', 'screw-4', 'screw-5', 'screw-6'],
    moves: [
      {
        ids: ['screw-1', 'screw-2', 'screw-3', 'screw-4', 'screw-5', 'screw-6'],
        delta: [0, -46, 0],
        rotation: [0, 540, 0],
        stagger: true,
      },
    ],
    camera: { position: [23, -24, 38], target: [0, 4, 0] },
    sound: [
      { at: 0.08, sound: 'screw' },
      { at: 0.24, sound: 'screw' },
      { at: 0.4, sound: 'screw' },
      { at: 0.56, sound: 'screw' },
      { at: 0.72, sound: 'screw' },
      { at: 0.88, sound: 'screw-lock' },
    ],
    motion: '沿 −Y 退出 46 mm，旋转 540°',
    hint: '螺丝完全退出后再抬起上壳',
  },
  {
    id: 'case-upper',
    title: '分离上壳',
    shortTitle: '分离上壳',
    description:
      '螺丝全部退出后，垂直抬起铝合金上框。上壳内侧压着定位板边缘的 Gasket 缓冲垫，抬起时会释放约 0.2 mm 的预压量。注意不要用金属工具撬动阳极表面。',
    narration: '上壳可以抬起了。它压着边缘的硅胶 Gasket，抬起时会有轻微的释放感。',
    dependsOn: ['case-screws'],
    partIds: ['case-upper'],
    moves: [{ ids: ['case-upper'], delta: [0, 96, -18] }],
    camera: { position: [0, 29, 42], target: [0, 9, 0] },
    sound: [
      { at: 0.2, sound: 'aluminum-tap' },
      { at: 0.7, sound: 'aluminum-tap', gain: 0.5 },
    ],
    motion: '沿 +Y 抬起 96 mm，向上后方偏移',
    hint: 'Gasket 预压释放，定位板仍由硅胶垫承托',
  },
  {
    id: 'lift-internals',
    title: '抬起内部组件，停在连接线允许的位置',
    shortTitle: '抬起内胆',
    description:
      '定位板、Gasket、夹心棉、PCB、卫星轴和剩余轴体作为内胆一起抬起。内部连接线只保留有限余量，因此只能抬起约 20 mm——这是先断开线缆、再取出内胆的原因。',
    narration: '整个内胆可以稍微抬起，但连接线长度有限。先停在这里，观察线缆的走线。',
    dependsOn: ['case-upper'],
    partIds: ['plate', ...INTERNALS.slice(1), 'usb-cable'],
    moves: [
      {
        ids: ['plate', 'foam-sandwich', 'pcb', ...STAB_PART_IDS, ...REMAINING_SWITCHES, ...Array.from({ length: 8 }, (_, i) => `gasket-${i + 1}`)],
        delta: [0, 20, 0],
      },
    ],
    camera: { position: [27, 13, 24], target: [0, 7, 0] },
    sound: [
      { at: 0.24, sound: 'plate-tap', gain: 0.5 },
      { at: 0.82, sound: 'plastic-tap', gain: 0.35 },
    ],
    motion: '内胆整体抬升 20 mm',
    hint: '连接线仍然连接子板与 PCB，不能直接取出内胆',
  },
  {
    id: 'disconnect-cable',
    title: '断开内部连接线并取出内胆',
    shortTitle: '断开线缆',
    description:
      '拔下 PCB 侧的 4 pin 连接器，再把内胆从底壳中取出。连接器有防呆方向，不能斜向硬拔；取出内胆时让线缆从 PCB 开口处完全脱开。',
    narration: '先拔掉 PCB 侧的连接器，内胆就可以完整取出。记住插接方向，装回时不要折到针脚。',
    dependsOn: ['lift-internals'],
    partIds: ['usb-cable', 'plate', 'pcb'],
    moves: [
      { ids: ['usb-cable'], delta: [0, -18, -22] },
      {
        ids: ['plate', 'foam-sandwich', 'pcb', ...STAB_PART_IDS, ...REMAINING_SWITCHES, ...Array.from({ length: 8 }, (_, i) => `gasket-${i + 1}`)],
        delta: [0, 58, 0],
      },
    ],
    camera: { position: [20, 12, 23], target: [0, 6, -2] },
    sound: [
      { at: 0.16, sound: 'connector-out' },
      { at: 0.72, sound: 'plastic-tap', gain: 0.4 },
    ],
    motion: '连接器拔出，内胆抬升 58 mm',
    hint: '先断线，再取内胆；装配时顺序相反',
  },
  {
    id: 'split-stack',
    title: '分离定位板、夹心棉与 PCB',
    shortTitle: '分离板层',
    description:
      '内胆翻到侧面后，依次抬起定位板和夹心棉。夹心棉按轴体与卫星轴位置开孔，不参与承力，只负责吸收板间高频反射。PCB 留在最下层。',
    narration: '现在分离板层：定位板在最上，夹心棉在中间，PCB 在最下。',
    dependsOn: ['disconnect-cable'],
    partIds: ['plate', 'foam-sandwich', 'pcb', ...Array.from({ length: 8 }, (_, i) => `gasket-${i + 1}`)],
    moves: [
      { ids: ['plate'], delta: [0, 55, 0] },
      { ids: Array.from({ length: 8 }, (_, i) => `gasket-${i + 1}`), delta: [0, 65, 0], stagger: true },
      { ids: ['foam-sandwich'], delta: [0, 25, 0] },
    ],
    camera: { position: [0, 34, 48], target: [0, 14, 0] },
    sound: [
      { at: 0.2, sound: 'plate-tap' },
      { at: 0.5, sound: 'foam-tap' },
      { at: 0.85, sound: 'plate-tap', gain: 0.5 },
    ],
    motion: '定位板 +55 mm，Gasket +65 mm，夹心棉 +25 mm',
    hint: '夹心棉开孔避让轴体与卫星轴，避免实心穿插',
  },
  {
    id: 'stab-remove',
    title: '拆卸 PCB 卫星轴',
    shortTitle: '拆卫星轴',
    description:
      '从 PCB 背面松开每组的 4 颗 M2 螺丝，卫星轴外壳从定位板避让孔退出。钢丝仍卡在左右轴心上，可以整体取下观察。装配时先固定外壳，再装入轴心并扣入钢丝。',
    narration: '最后拆下五组 PCB 卫星轴。每组四个螺丝，松开后外壳连同钢丝一起取下。',
    dependsOn: ['split-stack'],
    partIds: STAB_PART_IDS,
    moves: [
      { ids: STAB_PART_IDS, delta: [0, -36, 0], rotation: [0, 0, 2], stagger: true },
    ],
    camera: { position: [20, 20, 30], target: [4, 9, 0] },
    sound: [
      { at: 0.12, sound: 'screw' },
      { at: 0.3, sound: 'screw' },
      { at: 0.48, sound: 'stab-pull' },
      { at: 0.72, sound: 'stab-pull' },
    ],
    motion: '沿 −Y 退出 36 mm',
    hint: '螺丝固定式卫星轴从 PCB 背面锁入',
  },
  {
    id: 'bottom-details',
    title: '检查底棉、Gasket 与 USB-C 子板',
    shortTitle: '底部结构',
    description:
      '底壳内还剩底棉、Gasket 支撑台阶、USB-C 子板与内部线缆。底棉避让螺柱与接口；Gasket 垫坐在下壳台阶上，上壳则以对应台阶压住它。USB-C 子板由两颗螺丝固定，可独立更换。',
    narration: '底部还留下底棉、Gasket 台阶和 USB-C 子板。它们都可以独立维护，不需要拆焊主板。',
    dependsOn: ['disconnect-cable'],
    partIds: ['foam-bottom', 'case-lower', 'usb-board', 'usb-cable', 'usb-screw-1', 'usb-screw-2', ...Array.from({ length: 8 }, (_, i) => `gasket-${i + 1}`)],
    moves: [
      { ids: ['foam-bottom'], delta: [0, 44, 0] },
      { ids: ['usb-board', 'usb-cable', 'usb-screw-1', 'usb-screw-2'], delta: [0, 8, -52] },
    ],
    camera: { position: [22, 12, -34], target: [0, 3, -6] },
    sound: [
      { at: 0.18, sound: 'foam-tap' },
      { at: 0.55, sound: 'connector-out', gain: 0.5 },
      { at: 0.86, sound: 'plastic-tap', gain: 0.4 },
    ],
    motion: '底棉 +44 mm，USB 子板向前取出',
    hint: 'Gasket 垫上下都有对应的壳体台阶',
  },
  {
    id: 'hero-teardown',
    title: '示范轴内部拆解',
    shortTitle: '轴体内部',
    description:
      '切换到示范轴视角：依次分离上盖、轴心、弹簧与下盖，展开动触片、静触片、两根金属引脚和三个定位柱。按下轴心时，动触片在约 2.0 mm 处接触静触片，弹簧同时被压缩。',
    narration: '最后看示范轴的内部。线性轴没有点击机构，声音来自触底和回弹，信号由触片闭合产生。',
    dependsOn: [],
    partIds: [
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
    ],
    moves: [
      { ids: ['hero-top'], delta: [0, 44, 0] },
      { ids: ['hero-stem'], delta: [0, 28, 0] },
      { ids: ['hero-spring'], delta: [-27, 14, 0] },
      { ids: ['hero-contact-moving'], delta: [28, 4, 0] },
      { ids: ['hero-contact-fixed'], delta: [-28, 4, 0] },
      { ids: ['hero-pin-1', 'hero-pin-2'], delta: [0, -22, 0] },
      { ids: ['hero-pole-center', 'hero-pole-left', 'hero-pole-right'], delta: [0, -16, 0] },
    ],
    camera: { position: [4.2, 3.6, 6.1], target: [0, 1.8, 0] },
    sound: [
      { at: 0.16, sound: 'plastic-tap' },
      { at: 0.46, sound: 'spring' },
      { at: 0.78, sound: 'plastic-tap', gain: 0.5 },
    ],
    motion: '示范轴分层展开',
    hint: '触片闭合是电气触发；线性轴没有 click 声学机构',
  },
];

export const STEP_BY_ID: Record<string, AssemblyStep> = Object.fromEntries(
  ASSEMBLY_STEPS.map((step) => [step.id, step]),
);

export const TOTAL_STEPS = ASSEMBLY_STEPS.length;

export const HERO_STEP_INDEX = ASSEMBLY_STEPS.findIndex((step) => step.id === 'hero-teardown');

/** Validate step dependencies and collect a friendly error list. */
export function validateSteps(): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  ASSEMBLY_STEPS.forEach((step, index) => {
    if (seen.has(step.id)) errors.push(`重复步骤 ID：${step.id}`);
    if (step.dependsOn.includes(step.id)) errors.push(`${step.id} 依赖自身`);
    for (const dep of step.dependsOn) {
      if (!STEP_BY_ID[dep]) errors.push(`${step.id} 依赖不存在的步骤 ${dep}`);
      const depIndex = ASSEMBLY_STEPS.findIndex((candidate) => candidate.id === dep);
      if (depIndex >= index) errors.push(`${step.id} 依赖未来步骤 ${dep}`);
    }
    if (step.sound.some((event) => event.at < 0 || event.at > 1)) {
      errors.push(`${step.id} 的声音事件时间超出 0..1`);
    }
    seen.add(step.id);
  });
  return errors;
}

/** All long keys expected to carry a stabilizer. */
export const LONG_KEYS = STAB_KEYS_LIST.map((key) => key.code);

export const KEY_LOOKUP = Object.fromEntries(KEYS.map((key) => [key.code, key]));
