import {
  BOTTOM_FOAM_BOTTOM,
  CAP_BOTTOM,
  CASE_W,
  CASE_D,
  GASKET_BOTTOM,
  GASKET_HEIGHT,
  GASKET_W,
  LOWER_TOP,
  PCB_BOTTOM,
  PLATE_BOTTOM,
  SANDWICH_FOAM_BOTTOM,
  SCREW_POSITIONS,
  SWITCH_BASE_Y,
  U,
  UPPER_BOTTOM,
  USB,
} from '../config/constants';
import { KEYS, STAB_KEYS_LIST, type KeyDefinition } from './layout';

export type MaterialKey =
  | 'aluminum'
  | 'aluminumLight'
  | 'pbtCream'
  | 'pbtModifier'
  | 'pbtOrange'
  | 'pbtBlue'
  | 'fr4'
  | 'pcb'
  | 'foam'
  | 'silicone'
  | 'nylon'
  | 'polycarbonate'
  | 'pom'
  | 'steel'
  | 'gold'
  | 'rubber'
  | 'cable'
  | 'acrylic'
  | 'copper'
  | 'solder';

export type VisibilityCategory =
  | 'keycaps'
  | 'switches'
  | 'stabilizers'
  | 'plates'
  | 'pcb'
  | 'case'
  | 'usb'
  | 'fasteners';

export type PartType =
  | 'group'
  | 'keycap'
  | 'switch'
  | 'stabilizer'
  | 'plate'
  | 'foam'
  | 'gasket'
  | 'pcb'
  | 'component'
  | 'case'
  | 'screw'
  | 'foot'
  | 'usb'
  | 'cable'
  | 'hero';

export interface Transform {
  position: [number, number, number];
  rotation?: [number, number, number];
}

export interface SubPart {
  name: string;
  quantity: number;
  material: string;
}

export interface PartDefinition {
  id: string;
  name: string;
  nameEn: string;
  type: PartType;
  vis: VisibilityCategory;
  material: MaterialKey;
  quantity: number;
  parentId?: string;
  layer: number;
  assembly?: Transform;
  explode?: Transform;
  description: string;
  functionText: string;
  assemblyText: string;
  dimensions?: string;
  subparts?: SubPart[];
  keyCode?: string;
}

export const MATERIAL_INFO: Record<MaterialKey, { name: string; note: string }> = {
  aluminum: { name: '6063 铝合金', note: '阳极氧化，喷砂表面，石墨色' },
  aluminumLight: { name: '6063 铝合金', note: '阳极氧化，暖银色喷砂表面' },
  pbtCream: { name: 'PBT', note: '1.5 mm 厚热升华键帽，米白 RAL 近似色' },
  pbtModifier: { name: 'PBT', note: '加深一档的暖灰色 PBT，修饰键配色' },
  pbtOrange: { name: 'PBT', note: '橙色强调键，热升华字符' },
  pbtBlue: { name: 'PBT', note: '低饱和蓝灰强调键，热升华字符' },
  fr4: { name: 'FR4', note: '1.4 mm 玻璃纤维定位板，哑光深绿' },
  pcb: { name: 'FR4 + 铜', note: '1.6 mm 双面 PCB，沉金焊盘与白色丝印' },
  foam: { name: 'Poron / EVA 泡棉', note: '闭孔泡棉，用于夹心与底部吸音' },
  silicone: { name: '硅胶', note: '60 Shore A 缓冲垫，Gasket 悬挂支撑' },
  nylon: { name: 'PA66 尼龙', note: '轴体下盖与定位结构，自润滑' },
  polycarbonate: { name: 'PC 聚碳酸酯', note: '半透上盖，可观察轴心导向' },
  pom: { name: 'POM 赛钢', note: '线性轴心，低摩擦自润滑' },
  steel: { name: '不锈钢', note: '磷化处理的螺丝与钢丝，防锈耐磨' },
  gold: { name: '镀金铜合金', note: '触片与触点，低接触电阻' },
  rubber: { name: '丁腈橡胶', note: '脚垫，防滑并隔离桌面共振' },
  cable: { name: 'PVC / 镀锡铜', note: '内部连接线，柔性走线' },
  acrylic: { name: '亚克力', note: '展示底座与透光件' },
  copper: { name: '铜', note: 'PCB 走线与焊盘' },
  solder: { name: '焊锡', note: 'SMT 焊点' },
};

const GROUPS: PartDefinition[] = [
  {
    id: 'asm-keycaps',
    name: '键帽层',
    nameEn: 'Keycap layer',
    type: 'group',
    vis: 'keycaps',
    material: 'pbtCream',
    quantity: 0,
    layer: 10,
    description: '87 颗独立 PBT 键帽，按 ANSI TKL 布局分布。',
    functionText: '提供字符输入表面、保护轴心并传递按压力。',
    assemblyText: '十字柱压配到轴心；长键另外通过卫星轴连接柱与钢丝联动。',
  },
  {
    id: 'asm-switches',
    name: '轴体层',
    nameEn: 'Switch layer',
    type: 'group',
    vis: 'switches',
    material: 'nylon',
    quantity: 0,
    layer: 20,
    description: '87 颗五脚线性机械轴，支持热插拔。',
    functionText: '把机械行程转换为电信号，并产生按压手感。',
    assemblyText: '五脚穿过定位板与 PCB 开孔，由热插拔插座夹持固定。',
  },
  {
    id: 'asm-stabs',
    name: '卫星轴组',
    nameEn: 'Stabilizer sets',
    type: 'group',
    vis: 'stabilizers',
    material: 'nylon',
    quantity: 0,
    layer: 25,
    description: '5 组长键卫星轴：Space、Enter、Backspace、左右 Shift。',
    functionText: '约束长键两端，降低倾斜与晃动，让长键平稳下行。',
    assemblyText: 'PCB 螺丝固定式外壳从板下穿入，与 PCB 螺钉锁合；钢丝连接左右轴心。',
  },
  {
    id: 'asm-plate',
    name: '定位板与 Gasket',
    nameEn: 'Plate & gasket',
    type: 'group',
    vis: 'plates',
    material: 'fr4',
    quantity: 0,
    layer: 40,
    description: 'FR4 定位板和在边缘分布的 8 枚硅胶缓冲垫。',
    functionText: '为轴体提供定位和支撑，Gasket 将定位板弹性悬挂在上下壳之间。',
    assemblyText: '定位板边缘搭在硅胶垫上，由上下壳的台阶压紧，不使用刚性螺柱锁死。',
  },
  {
    id: 'asm-foam',
    name: '声学层',
    nameEn: 'Acoustic layer',
    type: 'group',
    vis: 'plates',
    material: 'foam',
    quantity: 0,
    layer: 50,
    description: '夹心棉与底棉，提供不同的空腔填充。',
    functionText: '吸收高频空腔回声，压低敲击声的金属尾音。',
    assemblyText: '夹心棉夹在定位板与 PCB 之间，底棉平铺在底壳内腔。',
  },
  {
    id: 'asm-pcb',
    name: 'PCB 与电子元件',
    nameEn: 'PCB & electronics',
    type: 'group',
    vis: 'pcb',
    material: 'pcb',
    quantity: 0,
    layer: 30,
    description: '主 PCB、热插拔插座、二极管、RGB LED 与主控。',
    functionText: '承载轴体电气连接，完成矩阵扫描与灯效控制。',
    assemblyText: 'PCB 由轴体与定位板共同定位，通过内部线缆与 USB-C 子板连接。',
  },
  {
    id: 'asm-case',
    name: '外壳与底部结构',
    nameEn: 'Case & bottom assembly',
    type: 'group',
    vis: 'case',
    material: 'aluminum',
    quantity: 0,
    layer: 60,
    description: '上下铝合金外壳、6 颗壳体螺丝、脚垫与 USB-C 子板。',
    functionText: '提供结构刚性、内部腔体与接口固定。',
    assemblyText: '6 颗螺丝从底壳穿入顶壳牙套；上下壳在 Gasket 处形成压缩配合。',
  },
];

export const PARTS: PartDefinition[] = [...GROUPS];

function push(part: PartDefinition) {
  PARTS.push(part);
}

for (const key of KEYS) {
  push(keycapPart(key));
  push(switchPart(key));
}

for (const key of STAB_KEYS_LIST) {
  push(stabilizerPart(key));
}

push({
  id: 'plate',
  name: 'FR4 定位板',
  nameEn: 'FR4 plate',
  type: 'plate',
  vis: 'plates',
  material: 'fr4',
  quantity: 1,
  parentId: 'asm-plate',
  layer: 40,
  assembly: { position: [0, PLATE_BOTTOM, 0] },
  explode: { position: [0, 82, 0] },
  dimensions: '356 × 132 × 1.4 mm',
  description:
    '1.4 mm FR4 定位板，为 87 个轴位和 10 个卫星轴外壳开出真实避让孔，边缘做倒角。',
  functionText: '固定轴体位置、传递按压回馈，并作为 Gasket 悬挂的结构核心。',
  assemblyText: '搭在 8 枚硅胶 Gasket 垫上，轴体卡扣夹住板厚；定位板不与底壳刚性锁死。',
});

for (let i = 0; i < 8; i += 1) {
  push({
    id: `gasket-${i + 1}`,
    name: `Gasket 缓冲垫 ${i + 1}`,
    nameEn: `Silicone gasket ${i + 1}`,
    type: 'gasket',
    vis: 'plates',
    material: 'silicone',
    quantity: 1,
    parentId: 'asm-plate',
    layer: 41,
    assembly: {
      position: [gasketOffset(i).x, GASKET_BOTTOM, gasketOffset(i).z],
      rotation: [0, gasketOffset(i).rot, 0],
    },
    explode: { position: [0, 100, 0] },
    dimensions: `${GASKET_W} × 24 × ${GASKET_HEIGHT.toFixed(2)} mm`,
    description: '定位板边缘的硅胶缓冲垫，沿板边对称布置 8 枚。',
    functionText: '把定位板弹性悬挂在上下壳之间，吸收冲击并隔离壳体共振。',
    assemblyText: '下半部分坐在底壳台阶上，上表面被顶壳压住约 0.2 mm，形成预压。',
  });
}

push({
  id: 'foam-sandwich',
  name: '夹心棉',
  nameEn: 'Plate foam',
  type: 'foam',
  vis: 'plates',
  material: 'foam',
  quantity: 1,
  parentId: 'asm-foam',
  layer: 50,
  assembly: { position: [0, SANDWICH_FOAM_BOTTOM, 0] },
  explode: { position: [0, 62, 0] },
  dimensions: '355 × 131 × 4.2 mm',
  description: '夹在定位板与 PCB 之间的闭孔泡棉，按轴体、卫星轴和元件位置开孔。',
  functionText: '填充板间空腔，削弱高频回声，让敲击声更集中。',
  assemblyText: '由定位板和 PCB 自然夹持，不需要粘接；开孔略大于轴体下盖，避免挤压。',
});

push({
  id: 'foam-bottom',
  name: '底棉',
  nameEn: 'Case foam',
  type: 'foam',
  vis: 'plates',
  material: 'foam',
  quantity: 1,
  parentId: 'asm-foam',
  layer: 51,
  assembly: { position: [0, BOTTOM_FOAM_BOTTOM, 0] },
  explode: { position: [0, 30, 0] },
  dimensions: '358 × 138 × 6 mm',
  description: '铺在底壳内腔的吸音棉，避开螺柱、USB 子板和连接线。',
  functionText: '吸收底腔驻波，减少空腔感与桌面反射。',
  assemblyText: '自然平铺在底壳内，留出螺丝柱与接口避让，不参与结构承力。',
});

push({
  id: 'pcb',
  name: '主 PCB',
  nameEn: 'Main PCB',
  type: 'pcb',
  vis: 'pcb',
  material: 'pcb',
  quantity: 1,
  parentId: 'asm-pcb',
  layer: 30,
  assembly: { position: [0, PCB_BOTTOM, 0] },
  explode: { position: [0, 42, 0] },
  dimensions: '354 × 130 × 1.6 mm',
  description:
    '1.6 mm 双面 FR4 主板，包含 87 组轴脚孔、定位孔、卫星轴螺孔、走线、焊盘与丝印。',
  functionText: '连接全部轴体、二极管、LED 和主控，是电信号与供电的载体。',
  assemblyText: '由轴体与定位板共同定位；背面热插拔插座夹住轴脚，不依赖焊接轴体。',
});

push({
  id: 'pcb-hotswap',
  name: '热插拔插座 × 87',
  nameEn: 'Hot-swap sockets',
  type: 'component',
  vis: 'pcb',
  material: 'nylon',
  quantity: 87,
  parentId: 'asm-pcb',
  layer: 31,
  dimensions: '10 × 5.6 × 2.8 mm / 个',
  description: 'Kailh 风格五脚兼容热插拔插座，焊接在 PCB 背面，与轴脚位置一一对应。',
  functionText: '用弹片夹持轴脚，允许不焊接更换轴体。',
  assemblyText: '先回流焊接在 PCB 背面；轴体从正面插入时弹片夹紧两根金属脚。',
});

push({
  id: 'pcb-diodes',
  name: '贴片二极管 × 87',
  nameEn: 'Matrix diodes',
  type: 'component',
  vis: 'pcb',
  material: 'fr4',
  quantity: 87,
  parentId: 'asm-pcb',
  layer: 32,
  dimensions: '1.6 × 0.9 × 0.6 mm / 个',
  description: '每个轴位一颗贴片二极管，构成无冲矩阵。',
  functionText: '阻止矩阵串键，实现多键同时按下时的独立识别。',
  assemblyText: 'SMT 焊接在 PCB 背面，紧邻对应热插拔插座。',
});

push({
  id: 'pcb-leds',
  name: 'RGB LED × 87',
  nameEn: 'Per-key RGB LEDs',
  type: 'component',
  vis: 'pcb',
  material: 'solder',
  quantity: 87,
  parentId: 'asm-pcb',
  layer: 33,
  dimensions: '1.6 × 1.6 × 0.7 mm / 个',
  description: '每键一颗反贴 RGB LED，轴体开孔与键帽下沿形成柔和混光。',
  functionText: '提供按需点亮的单键背光与状态反馈。',
  assemblyText: 'SMT 安装在 PCB 正面轴位旁；灯光通过轴体透光间隙和键帽底沿散射。',
});

push({
  id: 'pcb-mcu',
  name: '主控 MCU',
  nameEn: 'ARM MCU',
  type: 'component',
  vis: 'pcb',
  material: 'fr4',
  quantity: 1,
  parentId: 'asm-pcb',
  layer: 34,
  dimensions: '7 × 7 mm QFN',
  description: '32 位 ARM 主控，负责矩阵扫描、USB HID 与灯效。',
  functionText: '把按键矩阵变化转换为 USB 报文，并驱动灯效时序。',
  assemblyText: '焊接在 PCB 正面背侧，周围布置晶振、去耦电容与 ESD 保护。',
});

push({
  id: 'pcb-passives',
  name: '阻容与保护元件',
  nameEn: 'Passives & protection',
  type: 'component',
  vis: 'pcb',
  material: 'solder',
  quantity: 46,
  parentId: 'asm-pcb',
  layer: 35,
  dimensions: '0402 / 0603 封装',
  description: '晶振、去耦电容、限流电阻、ESD 与稳压元件，为教学化代表性布置。',
  functionText: '为主控、灯效与 USB 接口提供时钟、滤波和静电保护。',
  assemblyText: 'SMT 焊接于 PCB 正面与背面，本模型只表达类型和相对位置。',
});

push({
  id: 'case-lower',
  name: '下壳',
  nameEn: 'Lower case',
  type: 'case',
  vis: 'case',
  material: 'aluminum',
  quantity: 1,
  parentId: 'asm-case',
  layer: 60,
  dimensions: `${CASE_W} × ${CASE_D} × ${LOWER_TOP} mm（含底壁）`,
  description:
    'CNC 铝合金下壳，3.2 mm 壁厚，内腔带定位板台阶、螺柱与 USB-C 开口，底部有 6 个螺丝沉孔。',
  functionText: '承载内部组件，提供刚性与配重；内腔与底棉共同决定声音基调。',
  assemblyText: '顶面与上壳扣合，6 颗螺丝从底部穿入上壳牙套；Gasket 垫坐在内部台阶上。',
});

push({
  id: 'case-upper',
  name: '上壳',
  nameEn: 'Upper case',
  type: 'case',
  vis: 'case',
  material: 'aluminum',
  quantity: 1,
  parentId: 'asm-case',
  layer: 61,
  assembly: { position: [0, UPPER_BOTTOM, 0] },
  explode: { position: [0, 218, -58] },
  dimensions: `${CASE_W} × ${CASE_D} × 4 mm（框体）`,
  description: '铝合金上框，中央为键区开口，内侧边缘压住 Gasket 上方并形成壳体分缝。',
  functionText: '压紧 Gasket、遮蔽内部板件，并构成键盘的顶部轮廓。',
  assemblyText: '向下扣在定位板边缘的 Gasket 上，与下壳通过 6 颗螺丝锁合。',
});

SCREW_POSITIONS.forEach((pos, index) => {
  push({
    id: `screw-${index + 1}`,
    name: `壳体螺丝 ${index + 1}`,
    nameEn: `Case screw ${index + 1}`,
    type: 'screw',
    vis: 'fasteners',
    material: 'steel',
    quantity: 1,
    parentId: 'asm-case',
    layer: 62,
    assembly: { position: [pos.x, -1.8, pos.z] },
    explode: { position: [0, -56, 0], rotation: [0, 540, 0] },
    dimensions: 'M2 × 24 mm，杯头内六角',
    description: 'M2 不锈钢机牙螺丝，从底壳沉孔穿入上壳牙套。',
    functionText: '连接上下壳并压紧 Gasket 预压量。',
    assemblyText: '沿 −Y 方向旋入，扭矩约 0.35 N·m；拆卸时先完全退出再取下上壳。',
  });
});

for (let i = 0; i < 4; i += 1) {
  const x = i % 2 === 0 ? -160 : 160;
  const z = i < 2 ? -62 : 62;
  push({
    id: `foot-${i + 1}`,
    name: `脚垫 ${i + 1}`,
    nameEn: `Rubber foot ${i + 1}`,
    type: 'foot',
    vis: 'case',
    material: 'rubber',
    quantity: 1,
    parentId: 'asm-case',
    layer: 63,
    assembly: { position: [x, -2.4, z] },
    explode: { position: [0, -72, 0] },
    dimensions: 'Ø16 × 1.8 mm',
    description: '丁腈橡胶脚垫，四角布置。',
    functionText: '防滑、抬高底壳、降低桌面共振。',
    assemblyText: '嵌入底壳脚垫槽，可无损取下。',
  });
}

push({
  id: 'usb-board',
  name: 'USB-C 子板',
  nameEn: 'USB-C daughterboard',
  type: 'usb',
  vis: 'usb',
  material: 'pcb',
  quantity: 1,
  parentId: 'asm-case',
  layer: 64,
  assembly: { position: [0, USB.boardY, USB.boardZ] },
  explode: { position: [180, 222, -20] },
  dimensions: `${USB.boardW} × ${USB.boardH} × 1.6 mm`,
  description: '独立 USB-C 子板，含 16 pin 母座、ESD 保护与 JST 连接座，通过 2 颗螺丝固定在下壳。',
  functionText: '把外部 USB-C 线缆接入键盘内部，并承受插拔机械力。',
  assemblyText: '先与连接线插接，再用 2 颗 M2 螺丝固定；USB 座从外壳开口伸出约 0.5 mm。',
});

push({
  id: 'usb-cable',
  name: '内部连接线',
  nameEn: 'Internal cable',
  type: 'cable',
  vis: 'usb',
  material: 'cable',
  quantity: 1,
  parentId: 'asm-case',
  layer: 65,
  assembly: { position: [30, 11, -65] },
  explode: { position: [180, 222, -20] },
  dimensions: '约 78 mm，4 pin',
  description: '4 pin 柔性连接线，在子板 JST 座与 PCB 接口之间保留弯曲余量。',
  functionText: '在子板与主板之间传输供电和数据，允许内部组件小范围抬升。',
  assemblyText: '两端插接后再固定子板；拆卸内部组件前必须先断开连接线。',
});

for (let i = 0; i < 2; i += 1) {
  push({
    id: `usb-screw-${i + 1}`,
    name: `USB-C 子板螺丝 ${i + 1}`,
    nameEn: `Daughterboard screw ${i + 1}`,
    type: 'screw',
    vis: 'fasteners',
    material: 'steel',
    quantity: 1,
    parentId: 'asm-case',
    layer: 66,
    assembly: { position: [i === 0 ? -8.5 : 8.5, 7.0, USB.boardZ + 0.9] },
    explode: { position: [180, 222, -20], rotation: [0, 360, 0] },
    dimensions: 'M2 × 5 mm',
    description: '固定 USB-C 子板的短螺丝。',
    functionText: '抵抗 USB 线插拔产生的力矩。',
    assemblyText: '从子板正面旋入下壳螺柱。',
  });
}

/* ------------------------------------------------------------------ */
/* Hero demonstration switch                                           */
/* ------------------------------------------------------------------ */

export const HERO_PARTS: PartDefinition[] = [
  {
    id: 'hero-top',
    name: '上盖',
    nameEn: 'Top housing',
    type: 'hero',
    vis: 'switches',
    material: 'polycarbonate',
    quantity: 1,
    layer: 10,
    assembly: { position: [0, 8.2, 0] },
    explode: { position: [0, 40, 0] },
    dimensions: '11.6 × 11.6 × 7.6 mm',
    description: '半透 PC 上盖，顶部为十字导向孔，两侧有卡扣。',
    functionText: '约束轴心行程、挡住灰尘，并作为轴体与键帽之间的定位基准。',
    assemblyText: '从上方压合到下盖，靠两侧卡扣锁住；拆卸时可从角部撬起。',
  },
  {
    id: 'hero-stem',
    name: '十字轴心',
    nameEn: 'Stem',
    type: 'hero',
    vis: 'switches',
    material: 'pom',
    quantity: 1,
    layer: 11,
    assembly: { position: [0, 8.2, 0] },
    explode: { position: [0, 26, 0] },
    dimensions: '4.1 mm 十字，行程 4.0 mm',
    description: 'POM 线性轴心，顶部标准 MX 十字柱，两侧带导向翼。',
    functionText: '把键帽的按压传递到弹簧与动触片，并提供顺滑的线性手感。',
    assemblyText: '从下盖上方装入，导向翼沿上盖内壁滑动。',
  },
  {
    id: 'hero-spring',
    name: '弹簧',
    nameEn: 'Spring',
    type: 'hero',
    vis: 'switches',
    material: 'steel',
    quantity: 1,
    layer: 12,
    assembly: { position: [0, 1.1, 0] },
    explode: { position: [-26, 12, 0] },
    dimensions: '线径 0.45 mm，约 7 圈',
    description: '不锈钢压缩弹簧，示例设定约 45 gf 触发压力。',
    functionText: '提供轴心的回弹力与线性压力曲线。',
    assemblyText: '套在下盖中心柱上，上端顶住轴心内部。',
  },
  {
    id: 'hero-bottom',
    name: '下盖',
    nameEn: 'Bottom housing',
    type: 'hero',
    vis: 'switches',
    material: 'nylon',
    quantity: 1,
    layer: 13,
    assembly: { position: [0, 0, 0] },
    explode: { position: [0, 0, 0] },
    dimensions: '15.6 × 15.6 × 8.2 mm',
    description: 'PA66 下盖，包含中心定位柱、两个辅助定位柱和两根金属引脚。',
    functionText: '承载弹簧与触片，与定位板和 PCB 建立机械与电气连接。',
    assemblyText: '五脚穿过定位板与 PCB，下盖由热插拔插座夹持。',
  },
  {
    id: 'hero-contact-moving',
    name: '动触片',
    nameEn: 'Movable contact leaf',
    type: 'hero',
    vis: 'switches',
    material: 'gold',
    quantity: 1,
    layer: 14,
    assembly: { position: [2.25, 1.2, 2.4] },
    explode: { position: [17, 3, 0] },
    dimensions: '0.25 mm 镀金铜片',
    description: '随轴心下压而弯曲的动触片，末端带镀金触点。',
    functionText: '在触发点与静触片接触，闭合电路。',
    assemblyText: '插入下盖侧槽，引脚从底部穿出。',
  },
  {
    id: 'hero-contact-fixed',
    name: '静触片',
    nameEn: 'Fixed contact leaf',
    type: 'hero',
    vis: 'switches',
    material: 'gold',
    quantity: 1,
    layer: 15,
    assembly: { position: [-2.25, 1.2, 2.4] },
    explode: { position: [-17, 3, 0] },
    dimensions: '0.25 mm 镀金铜片',
    description: '固定在下盖中的静触片，与动触片保持约 0.4 mm 间隙。',
    functionText: '与动触片构成常开触点，轴心下压后导通。',
    assemblyText: '卡入下盖隔槽，不可活动。',
  },
  {
    id: 'hero-pin-1',
    name: '金属引脚 1',
    nameEn: 'Contact pin 1',
    type: 'hero',
    vis: 'switches',
    material: 'gold',
    quantity: 1,
    layer: 16,
    assembly: { position: [3.81, -3.9, -2.54] },
    explode: { position: [0, -20, 0] },
    dimensions: 'Ø1.5 mm，长 3.9 mm',
    description: '与动触片连通的轴脚。',
    functionText: '插入 PCB 焊盘或热插拔插座，传输开关信号。',
    assemblyText: '与下盖一体成型固定，焊接或插座夹持。',
  },
  {
    id: 'hero-pin-2',
    name: '金属引脚 2',
    nameEn: 'Contact pin 2',
    type: 'hero',
    vis: 'switches',
    material: 'gold',
    quantity: 1,
    layer: 17,
    assembly: { position: [-5.08, -3.9, 0] },
    explode: { position: [0, -20, 0] },
    dimensions: 'Ø1.5 mm，长 3.9 mm',
    description: '与静触片连通的轴脚。',
    functionText: '构成开关电路的另一端。',
    assemblyText: '与下盖一体成型固定。',
  },
  {
    id: 'hero-pole-center',
    name: '中心定位柱',
    nameEn: 'Centre locating pole',
    type: 'hero',
    vis: 'switches',
    material: 'nylon',
    quantity: 1,
    layer: 18,
    assembly: { position: [0, -2.2, 0] },
    explode: { position: [0, -16, 0] },
    dimensions: 'Ø3.9 × 4.4 mm',
    description: '下盖底部的中心定位柱，穿过 PCB 中心孔。',
    functionText: '分散横向受力并保证轴体居中。',
    assemblyText: '与 PCB 5 mm 定位孔配合，间隙约 0.2 mm。',
  },
  {
    id: 'hero-pole-left',
    name: '辅助定位柱 1',
    nameEn: 'Side locating pole 1',
    type: 'hero',
    vis: 'switches',
    material: 'nylon',
    quantity: 1,
    layer: 19,
    assembly: { position: [-5.08, -2.2, 0] },
    explode: { position: [0, -14, 0] },
    dimensions: 'Ø1.7 × 3.4 mm',
    description: '五脚轴的两个辅助定位柱之一，只用于机械防转。',
    functionText: '防止轴体在热插拔时旋转。',
    assemblyText: '穿过 PCB 与定位板的对应小孔，不参与电气连接。',
  },
  {
    id: 'hero-pole-right',
    name: '辅助定位柱 2',
    nameEn: 'Side locating pole 2',
    type: 'hero',
    vis: 'switches',
    material: 'nylon',
    quantity: 1,
    layer: 19,
    assembly: { position: [5.08, -2.2, 0] },
    explode: { position: [0, -14, 0] },
    dimensions: 'Ø1.7 × 3.4 mm',
    description: '另一个辅助定位柱。',
    functionText: '与中心柱共同构成稳定的五脚定位。',
    assemblyText: '插入 PCB 对应小孔。',
  },
];

export const HERO_PART_BY_ID: Record<string, PartDefinition> = Object.fromEntries(
  HERO_PARTS.map((part) => [part.id, part]),
);

export const ALL_PARTS: PartDefinition[] = [...PARTS, ...HERO_PARTS];

export const PART_BY_ID: Record<string, PartDefinition> = Object.fromEntries(
  ALL_PARTS.map((part) => [part.id, part]),
);

export const KEYCAP_PART_IDS = KEYS.map((key) => key.id);
export const SWITCH_PART_IDS = KEYS.map((key) => key.switchId);
export const STAB_PART_IDS = STAB_KEYS_LIST.map((key) => `stab-${key.code}`);

export const VISIBILITY_LABELS: Record<VisibilityCategory, string> = {
  keycaps: '键帽',
  switches: '轴体',
  stabilizers: '卫星轴',
  plates: '板件 / 声学',
  pcb: 'PCB / 元件',
  case: '外壳 / 脚垫',
  usb: 'USB / 线缆',
  fasteners: '螺丝',
};

export function partsByVisibility(vis: VisibilityCategory): PartDefinition[] {
  return PARTS.filter((part) => part.vis === vis);
}

export const BOM_GROUPS = [
  { vis: 'keycaps' as const, label: '键帽', material: 'PBT / 热升华' },
  { vis: 'switches' as const, label: '机械轴', material: 'PA66 + PC + POM' },
  { vis: 'stabilizers' as const, label: '卫星轴组', material: 'PA66 + 不锈钢' },
  { vis: 'plates' as const, label: '定位板 / 声学 / Gasket', material: 'FR4 + Poron + 硅胶' },
  { vis: 'pcb' as const, label: 'PCB / 电子元件', material: 'FR4 + 铜 + 镀金' },
  { vis: 'case' as const, label: '外壳 / 脚垫', material: '6063 铝合金 + 橡胶' },
  { vis: 'usb' as const, label: 'USB-C 子板 / 线缆', material: 'FR4 + PVC' },
  { vis: 'fasteners' as const, label: '紧固件', material: '不锈钢' },
];

export function bomFor(vis: VisibilityCategory): { label: string; quantity: number } {
  const grouped = new Map<string, number>();
  for (const part of PARTS) {
    if (part.vis !== vis || part.quantity === 0) continue;
    const key = part.name.replace(/ \d+$/, '').replace(/ × \d+$/, '');
    grouped.set(key, (grouped.get(key) ?? 0) + part.quantity);
  }
  return {
    label: BOM_GROUPS.find((group) => group.vis === vis)?.label ?? vis,
    quantity: [...grouped.values()].reduce((sum, value) => sum + value, 0),
  };
}

export function gasketOffset(index: number): { x: number; z: number; rot: number } {
  // Eight gasket pads: two on each long edge, two on each short edge.
  const halfW = 179.5;
  const halfD = 67.5;
  const layout = [
    { x: -halfW, z: -22, rot: 0 },
    { x: -halfW, z: 28, rot: 0 },
    { x: halfW, z: -22, rot: 0 },
    { x: halfW, z: 28, rot: 0 },
    { x: -95, z: -halfD, rot: 90 },
    { x: 95, z: -halfD, rot: 90 },
    { x: -95, z: halfD, rot: 90 },
    { x: 95, z: halfD, rot: 90 },
  ];
  return layout[index] ?? layout[0];
}

function keycapPart(key: KeyDefinition): PartDefinition {
  return {
    id: key.id,
    name: `键帽 ${key.label === ' ' ? 'Space' : key.label} (${key.widthU}U)`,
    nameEn: `PBT keycap ${key.code}`,
    type: 'keycap',
    vis: 'keycaps',
    material:
      key.accent === 'orange'
        ? 'pbtOrange'
        : key.accent === 'blue'
          ? 'pbtBlue'
          : key.widthU > 1
            ? 'pbtModifier'
            : 'pbtCream',
    quantity: 1,
    parentId: 'asm-keycaps',
    layer: 10,
    keyCode: key.code,
    assembly: {
      position: [key.x, CAP_BOTTOM, key.z],
      rotation: [key.tilt, 0, 0],
    },
    explode: { position: [0, 150, 0] },
    dimensions: `${key.widthMm.toFixed(1)} × ${(U - 0.78).toFixed(1)} × ${key.heightMm} mm`,
    description: `Cherry 风格分行高度的 PBT 键帽，${key.widthU}U 宽度，顶部字符为热升华工艺。`,
    functionText:
      key.stabSpacing !== undefined
        ? '输入面与轴心连接，同时通过两侧卫星轴连接柱保持长键平稳。'
        : '把手指按压传递给轴心，并通过底部十字柱与轴心配合。',
    assemblyText:
      key.stabSpacing !== undefined
        ? '垂直下压套入中心轴心与两侧卫星轴轴心，拔出时使用拔键器沿 +Y 方向取下。'
        : '底部十字槽压配到轴心，沿 +Y 方向即可拔下。',
  };
}


function switchPart(key: KeyDefinition): PartDefinition {
  return {
    id: key.switchId,
    name: `线性轴 · ${key.label === ' ' ? 'Space' : key.label}`,
    nameEn: `MX linear switch ${key.code}`,
    type: 'switch',
    vis: 'switches',
    material: 'nylon',
    quantity: 1,
    parentId: 'asm-switches',
    layer: 20,
    keyCode: key.code,
    assembly: { position: [key.x, SWITCH_BASE_Y, key.z] },
    explode: { position: [0, 110, 0] },
    dimensions: '15.6 × 15.6 × 16.0 mm，行程 4.0 mm',
    description: 'MX 风格五脚线性轴：尼龙下盖、PC 上盖、POM 轴心，无段落与click机构。',
    functionText: '提供 4.0 mm 行程的线性手感，在约 2.0 mm 处闭合触点。',
    assemblyText: '轴脚对准 PCB 与定位板孔后垂直压入，由热插拔插座夹紧；拔出需先取下键帽。',
  };
}

function stabilizerPart(key: KeyDefinition): PartDefinition {
  const spacing = key.stabSpacing ?? 0;
  return {
    id: `stab-${key.code}`,
    name: `卫星轴组 · ${key.label}`,
    nameEn: `Screw-in stabilizer set ${key.code}`,
    type: 'stabilizer',
    vis: 'stabilizers',
    material: 'nylon',
    quantity: 1,
    parentId: 'asm-stabs',
    layer: 25,
    keyCode: key.code,
    assembly: { position: [key.x, 0, key.z] },
    explode: { position: [0, 24, 0] },
    dimensions: `钢丝跨距 ${spacing} mm`,
    description: `PCB 螺丝固定式卫星轴，左右轴心跨距 ${spacing} mm，配 Ø1.3 mm 金属平衡钢丝。`,
    functionText: '让长键两端同步下行，抑制翘起、倾斜与空行程。',
    assemblyText: '外壳从 PCB 背面穿过定位板避让孔，用 4 颗 M2 螺丝锁在 PCB 上；钢丝卡入两侧轴心。',
    subparts: [
      { name: '左右外壳', quantity: 2, material: 'PA66 尼龙' },
      { name: '左右活动轴心', quantity: 2, material: 'POM' },
      { name: '平衡钢丝', quantity: 1, material: '不锈钢 Ø1.3 mm' },
      { name: 'PCB 固定螺丝', quantity: 4, material: 'M2 不锈钢' },
    ],
  };
}
