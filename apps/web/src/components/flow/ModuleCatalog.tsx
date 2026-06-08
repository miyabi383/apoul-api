"use client";

import type { SystemModule } from "@/lib/flow/types";
import { ja } from "@/lib/i18n/ja";

type Props = {
  systems: SystemModule[];
  query: string;
  onQueryChange: (q: string) => void;
  onAddFlow: (system: SystemModule) => void;
  onPickTarget: (system: SystemModule) => void;
};

export function ModuleCatalog({ systems, query, onQueryChange, onAddFlow, onPickTarget }: Props) {
  const filtered = systems.filter(
    (s) =>
      s.code.includes(query.toLowerCase()) ||
      s.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <aside className="flow-catalog">
      <div className="flow-catalog-head">
        <h2>{ja.flow.catalog}</h2>
        <p>{ja.flow.catalogDesc}</p>
      </div>
      <input
        className="flow-search"
        placeholder={ja.flow.searchPlaceholder}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />
      <div className="flow-catalog-section">
        <div className="flow-catalog-label">{ja.flow.registeredSystems}</div>
        <div className="flow-module-grid">
          {filtered.map((s) => (
            <button
              key={s.code}
              type="button"
              className="flow-module-card"
              onClick={() => onPickTarget(s)}
              onDoubleClick={() => onAddFlow(s)}
              title={ja.flow.clickToConnect}
            >
              <div className="flow-module-icon">{s.code.slice(0, 2).toUpperCase()}</div>
              <div className="flow-module-name">{s.name}</div>
              <div className="flow-module-code">{s.code}</div>
            </button>
          ))}
        </div>
        {filtered.length === 0 && <p className="note">{ja.flow.noSystems}</p>}
      </div>
      <div className="flow-catalog-hint">
        <strong>{ja.flow.hintTitle}</strong>
        <ul>
          <li>{ja.flow.hintClick}</li>
          <li>{ja.flow.hintDouble}</li>
          <li>{ja.flow.hintDrag}</li>
        </ul>
      </div>
    </aside>
  );
}
