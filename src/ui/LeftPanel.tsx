import { useEffect, useMemo, useState } from 'react';
import { HERO_STEP_INDEX } from '../data/steps';
import { HERO_PARTS, PARTS, VISIBILITY_LABELS, type PartDefinition, type VisibilityCategory } from '../data/parts';
import { KEYS, ROW_LABELS } from '../data/layout';
import { useAppStore } from '../state/store';
import { focusPart } from '../utils/camera';

const GROUP_ORDER = ['asm-keycaps', 'asm-switches', 'asm-stabs', 'asm-plate', 'asm-foam', 'asm-pcb', 'asm-case'];
const CATEGORIES = Object.keys(VISIBILITY_LABELS) as VisibilityCategory[];
const KEY_CAP_BY_ID = Object.fromEntries(KEYS.map((key) => [key.id, key]));

function PartRow({
  part,
  depth = 0,
  onSelect,
  selected,
}: {
  part: PartDefinition;
  depth?: number;
  onSelect: (part: PartDefinition) => void;
  selected: boolean;
}) {
  const hover = useAppStore((state) => state.hover);
  const key = part.keyCode ? KEY_CAP_BY_ID[part.id] : undefined;
  const label = key ? `${key.label === ' ' ? 'Space' : key.label} · ${key.widthU}U` : part.name;
  return (
    <button
      type="button"
      className={`tree-row ${selected ? 'is-selected' : ''}`}
      style={{ paddingLeft: 12 + depth * 12 }}
      onClick={() => onSelect(part)}
      onDoubleClick={() => {
        onSelect(part);
        focusPart(part.id);
      }}
      onMouseEnter={() => hover(part.id)}
      onMouseLeave={() => hover(null)}
      title={`${part.name} · ${part.id}`}
    >
      <span className={`vis-dot vis-${part.vis}`} />
      <span className="tree-label">{label}</span>
      {part.quantity > 1 ? <span className="tree-qty">×{part.quantity}</span> : null}
    </button>
  );
}

function GroupNode({
  group,
  open,
  onToggle,
  selectedId,
  onSelect,
}: {
  group: PartDefinition;
  open: boolean;
  onToggle: () => void;
  selectedId: string | null;
  onSelect: (part: PartDefinition) => void;
}) {
  const children = PARTS.filter((part) => part.parentId === group.id);
  const sorted = useMemo(() => {
    if (group.id === 'asm-keycaps') {
      return [...children].sort((a, b) => {
        const ka = a.keyCode ? KEYS.find((key) => key.code === a.keyCode) : undefined;
        const kb = b.keyCode ? KEYS.find((key) => key.code === b.keyCode) : undefined;
        return (ka?.row ?? 0) - (kb?.row ?? 0) || (ka?.col ?? 0) - (kb?.col ?? 0);
      });
    }
    return children;
  }, [children, group.id]);

  let lastRow = -1;

  return (
    <div className="tree-group">
      <button type="button" className="tree-group-head" onClick={onToggle}>
        <span className={`chevron ${open ? 'is-open' : ''}`}>›</span>
        <span>{group.name}</span>
        <span className="tree-count">{children.length}</span>
      </button>
      {open ? (
        <div className="tree-children">
          {sorted.map((part) => {
            const key = part.keyCode ? KEYS.find((entry) => entry.code === part.keyCode) : undefined;
            const showRowHeader = group.id === 'asm-keycaps' && key && key.row !== lastRow;
            if (showRowHeader) lastRow = key.row;
            return (
              <div key={part.id}>
                {showRowHeader ? <div className="tree-row-header">{ROW_LABELS[key.row]}</div> : null}
                <PartRow part={part} depth={1} onSelect={onSelect} selected={selectedId === part.id} />
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function LeftPanel() {
  const selectedId = useAppStore((state) => state.selectedId);
  const select = useAppStore((state) => state.select);
  const mode = useAppStore((state) => state.mode);
  const stepIndex = useAppStore((state) => state.teaching.stepIndex);
  const categoryVisibility = useAppStore((state) => state.categoryVisibility);
  const toggleCategory = useAppStore((state) => state.toggleCategory);
  const setAllCategories = useAppStore((state) => state.setAllCategories);
  const isolateId = useAppStore((state) => state.isolateId);
  const isolateSelected = useAppStore((state) => state.isolateSelected);
  const clearIsolate = useAppStore((state) => state.clearIsolate);
  const leftOpen = useAppStore((state) => state.leftOpen);
  const setDrawer = useAppStore((state) => state.setDrawer);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'asm-keycaps': false,
    'asm-switches': false,
    'asm-stabs': false,
    'asm-plate': true,
    'asm-foam': true,
    'asm-pcb': true,
    'asm-case': true,
  });
  const [query, setQuery] = useState('');
  const heroMode = mode === 'axis' || (mode === 'teach' && stepIndex >= HERO_STEP_INDEX);

  useEffect(() => {
    setQuery('');
  }, [mode, heroMode]);

  useEffect(() => {
    if (!selectedId) return;
    const part = PARTS.find((entry) => entry.id === selectedId);
    if (part?.parentId) {
      setOpenGroups((groups) => ({ ...groups, [part.parentId!]: true }));
    }
  }, [selectedId]);

  const groups = GROUP_ORDER.map((id) => PARTS.find((part) => part.id === id)).filter(
    (part): part is PartDefinition => Boolean(part),
  );

  const matches = useMemo(() => {
    if (!query.trim()) return null;
    const needle = query.trim().toLowerCase();
    const pool = heroMode ? HERO_PARTS : PARTS.filter((part) => part.type !== 'group');
    return pool
      .filter(
        (part) =>
          part.name.toLowerCase().includes(needle) ||
          part.nameEn.toLowerCase().includes(needle) ||
          part.id.toLowerCase().includes(needle) ||
          (part.keyCode ?? '').toLowerCase().includes(needle),
      )
      .slice(0, 80);
  }, [query, heroMode]);

  const onSelect = (part: PartDefinition) => {
    select(part.id);
    useAppStore.getState().setPanelTab('detail');
  };

  return (
    <aside className={`side-panel left-panel ${leftOpen ? 'is-open' : ''}`}>
      <div className="panel-head">
        <div>
          <span className="eyebrow">ASSEMBLY</span>
          <h2>装配树</h2>
        </div>
        <button className="icon-btn drawer-close" onClick={() => setDrawer('left', false)} aria-label="关闭装配树">
          ×
        </button>
      </div>

      <div className="search-box">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索键位 / 零件 / ID"
          aria-label="搜索零件"
        />
        {query ? (
          <button className="search-clear" onClick={() => setQuery('')}>
            ×
          </button>
        ) : null}
      </div>

      <div className="filter-block">
        <div className="filter-head">
          <span>结构分类</span>
          <div className="filter-actions">
            <button onClick={() => setAllCategories(true)}>全显</button>
            <button onClick={() => setAllCategories(false)}>全隐</button>
          </div>
        </div>
        <div className="chips">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              className={`chip ${categoryVisibility[category] ? 'is-on' : ''}`}
              onClick={() => toggleCategory(category)}
            >
              <span className={`vis-dot vis-${category}`} />
              {VISIBILITY_LABELS[category]}
            </button>
          ))}
        </div>
      </div>

      {isolateId ? (
        <div className="isolate-banner">
          <span>单独显示：{PARTS.find((part) => part.id === isolateId)?.name ?? isolateId}</span>
          <button onClick={clearIsolate}>恢复全部</button>
        </div>
      ) : null}

      <div className="tree-scroll">
        {matches ? (
          <div className="tree-group">
            <div className="tree-group-head static">搜索结果 · {matches.length}</div>
            <div className="tree-children">
              {matches.map((part) => (
                <PartRow key={part.id} part={part} onSelect={onSelect} selected={selectedId === part.id} />
              ))}
              {matches.length === 0 ? <p className="empty-note">没有匹配的零件</p> : null}
            </div>
          </div>
        ) : heroMode ? (
          <div className="tree-group">
            <div className="tree-group-head static">示范轴 · {HERO_PARTS.length} 个零件</div>
            <div className="tree-children">
              {HERO_PARTS.map((part) => (
                <PartRow key={part.id} part={part} onSelect={onSelect} selected={selectedId === part.id} />
              ))}
            </div>
          </div>
        ) : (
          groups.map((group) => (
            <GroupNode
              key={group.id}
              group={group}
              open={Boolean(openGroups[group.id])}
              onToggle={() => setOpenGroups((current) => ({ ...current, [group.id]: !current[group.id] }))}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))
        )}
      </div>

      <div className="panel-foot">
        <button
          className="btn btn-ghost"
          disabled={!selectedId}
          onClick={() => (isolateId ? clearIsolate() : isolateSelected())}
        >
          {isolateId ? '恢复全部' : '单独显示所选'}
        </button>
        {selectedId ? (
          <button className="btn btn-ghost" onClick={() => focusPart(selectedId)}>
            聚焦
          </button>
        ) : null}
      </div>
    </aside>
  );
}
