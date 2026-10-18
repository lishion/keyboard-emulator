import { useEffect, useRef, useState } from 'react';
import { PART_BY_ID } from '../data/parts';
import { useAppStore } from '../state/store';
import { useResolvedAppearance } from '../customization/hooks';
import { materialPatch } from '../customization/materialPresets';
import {
  globalIdsForField,
  idsForScope,
  schemaForPart,
  scopesForPart,
  variantForPart,
} from '../customization/schema';
import type {
  AppearanceField,
  AppearanceValues,
  ScopeKey,
} from '../customization/types';

const HEX = /^#[0-9a-fA-F]{6}$/;

function ColorControl({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const safe = HEX.test(value) ? value : '#888888';
  return (
    <div className="custom-color">
      <input
        type="color"
        value={safe}
        onChange={(event) => onChange(event.target.value)}
        aria-label="选择颜色"
      />
      <code>{safe.toUpperCase()}</code>
    </div>
  );
}

function FieldControl({
  field,
  value,
  onChange,
  onReset,
}: {
  field: AppearanceField;
  value: string | number | boolean | undefined;
  onChange: (value: string | number | boolean) => void;
  onReset: () => void;
}) {
  const rangeValue = typeof value === 'number' ? value : Number(field.min ?? 0);
  const selectValue = String(value ?? field.options?.[0]?.value ?? '');
  return (
    <div className="custom-field" data-kind={field.kind}>
      <div className="custom-field-head">
        <label htmlFor={`appearance-${field.key}`}>{field.label}</label>
        <div className="custom-field-tools">
          {field.global ? <span className="custom-tag">全部</span> : null}
          {field.perPartOnly ? <span className="custom-tag">单键</span> : null}
          <button type="button" className="custom-reset" onClick={onReset} title="恢复主题默认">
            ↺
          </button>
        </div>
      </div>
      {field.kind === 'color' ? (
        <ColorControl
          value={typeof value === 'string' ? value : '#888888'}
          onChange={onChange}
        />
      ) : null}
      {field.kind === 'range' ? (
        <div className="custom-range">
          <input
            id={`appearance-${field.key}`}
            type="range"
            min={field.min}
            max={field.max}
            step={field.step ?? 0.01}
            value={rangeValue}
            onChange={(event) => onChange(Number(event.target.value))}
          />
          <span>{rangeValue.toFixed(2)}</span>
        </div>
      ) : null}
      {field.kind === 'select' ? (
        <select
          id={`appearance-${field.key}`}
          value={selectValue}
          onChange={(event) => onChange(event.target.value)}
        >
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : null}
      {field.kind === 'toggle' ? (
        <button
          type="button"
          className={`custom-toggle ${value !== false ? 'is-on' : ''}`}
          onClick={() => onChange(value === false)}
          aria-pressed={value !== false}
        >
          <span />
          {value !== false ? '开启' : '关闭'}
        </button>
      ) : null}
      {field.kind === 'text' ? (
        <input
          id={`appearance-${field.key}`}
          type="text"
          value={typeof value === 'string' ? value : ''}
          maxLength={24}
          onChange={(event) => onChange(event.target.value)}
          placeholder="留空则不显示"
        />
      ) : null}
      {field.hint ? <p className="custom-hint">{field.hint}</p> : null}
    </div>
  );
}

const PBR_PRESETS = [
  { label: '哑光', patch: { roughness: 0.78, metalness: 0.02, clearcoat: 0.02 } },
  { label: '细砂', patch: { roughness: 0.52, metalness: 0.06, clearcoat: 0.08 } },
  { label: '亮面', patch: { roughness: 0.16, metalness: 0.02, clearcoat: 0.7 } },
  { label: '金属', patch: { roughness: 0.32, metalness: 0.84, clearcoat: 0.18 } },
] as const;

export function CustomPanel() {
  const selectedId = useAppStore((state) => state.selectedId);
  const appearance = useAppStore((state) => state.appearance);
  const applyAppearance = useAppStore((state) => state.applyAppearance);
  const resetAppearance = useAppStore((state) => state.resetAppearance);
  const resetAllAppearance = useAppStore((state) => state.resetAllAppearance);
  const replaceAppearance = useAppStore((state) => state.replaceAppearance);
  const part = selectedId ? PART_BY_ID[selectedId] : undefined;
  const resolved = useResolvedAppearance(selectedId ?? '__none__');
  const [scope, setScope] = useState<ScopeKey>('part');
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setScope('part');
    setMessage('');
  }, [part?.type]);

  if (!part) {
    return (
      <div className="custom-empty">
        <h3>选择一个零件</h3>
        <p>点击三维模型或左侧装配树，然后在这里单独调整它的可见外观。</p>
        <ul className="fact-list">
          <li>
            <span>键帽</span>
            <strong>颜色、圆角、字符</strong>
          </li>
          <li>
            <span>轴体</span>
            <strong>上下盖、轴心颜色</strong>
          </li>
          <li>
            <span>外壳 / PCB</span>
            <strong>阳极色、阻焊与走线</strong>
          </li>
        </ul>
        <p className="custom-note">外观覆盖保存在本机浏览器，不改变 BOM、结构和装配步骤。</p>
      </div>
    );
  }

  const totalCustomised = Object.keys(appearance).length;
  const partCustomised = Boolean(appearance[part.id]);
  const schema = schemaForPart(part);
  const scopes = scopesForPart(part);
  const sections = schema.sections.map((section) => ({
    ...section,
    fields: section.fields.filter(
      (field) => !(field.key === 'hideInternals' && part.id === 'case-upper'),
    ),
  }));
  const fields = sections.flatMap((section) => section.fields);
  const supportsPbr = fields.some((field) => field.key === 'roughness' || field.key === 'metalness');
  const supportsOpacity = fields.some((field) => field.key === 'opacity');

  const idsForField = (field: AppearanceField): string[] => {
    if (field.perPartOnly) return [part.id];
    if (field.global) return globalIdsForField(part, field);
    return idsForScope(part, scope);
  };

  const setField = (field: AppearanceField, value: string | number | boolean) => {
    const ids = idsForField(field);
    if (field.key === 'material' && typeof value === 'string') {
      const allowed = new Set(fields.map((entry) => entry.key as string));
      const patch = materialPatch(variantForPart(part), value);
      const filtered: AppearanceValues = {};
      for (const [key, entry] of Object.entries(patch)) {
        if (allowed.has(key)) (filtered as Record<string, unknown>)[key] = entry;
      }
      applyAppearance(ids, filtered);
      setMessage(`已切换材质：${value}`);
      return;
    }
    let parsed: string | number | boolean = value;
    if (field.key === 'legendWeight') parsed = Number(value);
    applyAppearance(ids, { [field.key]: parsed } as AppearanceValues);
  };

  const resetField = (field: AppearanceField) => {
    applyAppearance(idsForField(field), { [field.key]: undefined } as AppearanceValues);
  };

  const applyPreset = (patch: AppearanceValues) => {
    const allowed = new Set(fields.map((field) => field.key as string));
    const filtered: AppearanceValues = {};
    for (const [key, value] of Object.entries(patch)) {
      if (allowed.has(key)) (filtered as Record<string, unknown>)[key] = value;
    }
    applyAppearance(idsForScope(part, scope), filtered);
    setMessage('已应用质感预设');
  };

  const exportFile = () => {
    const blob = new Blob([JSON.stringify({ version: 1, appearance }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mx87-appearance.json';
    link.click();
    URL.revokeObjectURL(url);
    setMessage('已导出 JSON');
  };

  const importFile = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as { appearance?: unknown } | unknown;
      const source =
        parsed && typeof parsed === 'object' && 'appearance' in parsed
          ? (parsed as { appearance: unknown }).appearance
          : parsed;
      replaceAppearance((source ?? {}) as Record<string, AppearanceValues>);
      setMessage('已导入外观方案');
    } catch {
      setMessage('导入失败：不是有效的 JSON 方案');
    }
  };

  return (
    <div className="custom-panel">
      <div className="custom-hero">
        <div>
          <span className={`type-badge vis-${part.vis}`}>{schema.title} · 外观</span>
          <h3>{part.name}</h3>
          <p>{variantForPart(part)} / {part.id}</p>
        </div>
        {partCustomised ? <span className="custom-badge">已自定义</span> : null}
      </div>

      <div className="custom-scope-row">
        <div>
          <span className="custom-scope-label">作用范围</span>
          <div className="custom-scope">
            {scopes.map((option) => (
              <button
                key={option.key}
                type="button"
                className={scope === option.key ? 'is-active' : ''}
                onClick={() => setScope(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="custom-count">
          <strong>{totalCustomised}</strong>
          <span>个零件已自定义</span>
        </div>
      </div>

      <p className="custom-note">
        只修改可见外观与键帽字符；布局、BOM 数量、零件 ID、装配步骤和声音逻辑保持不变。
        材质参数会与当前主题叠加，切换主题时未覆盖的字段跟随新主题。
      </p>

      {supportsPbr ? (
        <div className="custom-preset-row">
          <span>快速质感</span>
          {PBR_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset.patch as AppearanceValues)}
            >
              {preset.label}
            </button>
          ))}
          {supportsOpacity ? (
            <button type="button" onClick={() => applyPreset({ opacity: 0.45 })}>
              半透明
            </button>
          ) : null}
        </div>
      ) : null}

      {sections.map((section) => (
        <section className="custom-section" key={section.title}>
          <h4>{section.title}</h4>
          {section.fields.map((field) => (
            <FieldControl
              key={field.key}
              field={field}
              value={resolved[field.key]}
              onChange={(value) => setField(field, value)}
              onReset={() => resetField(field)}
            />
          ))}
        </section>
      ))}

      <div className="custom-actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            resetAppearance([part.id]);
            setMessage('已恢复当前零件');
          }}
        >
          恢复当前零件
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            resetAllAppearance();
            setMessage('已恢复全部外观');
          }}
        >
          全部恢复
        </button>
        <button type="button" className="btn btn-ghost" onClick={exportFile}>
          导出 JSON
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
          导入 JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="custom-file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void importFile(file);
            event.target.value = '';
          }}
        />
      </div>
      {message ? <p className="custom-message">{message}</p> : null}
    </div>
  );
}
