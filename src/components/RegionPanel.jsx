import { GEOMETRIES } from '../physics/constants.js';
import { chargeFmtWithUnit, fmt, materialName } from '../physics/format.js';
import { sortedRegions } from '../physics/calculations.js';

export default function RegionPanel({ geometry, labels, regions, selectedId, chargeUnit, onSelect, onClear, onAdd, onGeometryRequest }) {
  const max = Math.max(0, ...regions.map(r => r.outer));
  return (
    <aside className="panel regions-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">ESTRUCTURA</span>
          <h1>Regiones</h1>
        </div>
        <button className="icon-button" title="Agregar región" onClick={onAdd}>＋</button>
      </div>

      <div className="geometry-toggle" role="group" aria-label="Geometría" style={{ gridTemplateColumns: `repeat(${GEOMETRIES.length}, 1fr)` }}>
        <button className={geometry === 'sphere' ? 'active' : ''} onClick={() => onGeometryRequest('sphere')}><span className="shape-icon sphere"></span> Esfera</button>
        <button className={geometry === 'cylinder' ? 'active' : ''} onClick={() => onGeometryRequest('cylinder')}><span className="shape-icon cylinder"></span> Cilindro</button>
      </div>

      <div className="structure-summary">
        <span>{regions.length} {regions.length === 1 ? 'región' : 'regiones'}</span>
        <span>{labels.dim} = {fmt(max, 2)} m</span>
      </div>

      <div className="region-list" onClick={onClear}>
        {sortedRegions(regions).map((region, index) => (
          <article
            key={region.id}
            className={`region-card ${region.id === selectedId ? 'selected' : ''}`}
            onClick={(event) => {
              event.stopPropagation();
              onSelect(region.id);
            }}
          >
            <i className="region-swatch" style={{ background: region.color }}></i>
            <div className="region-copy">
              <strong>{index + 1}. {region.name}</strong>
              <span>{fmt(region.inner, 2)} — {fmt(region.outer, 2)} m · {region.material === 'insulator' ? 'aislante uniforme' : materialName(region.material)}</span>
            </div>
            <span className="region-charge">{chargeFmtWithUnit(region.charge, geometry, chargeUnit)}</span>
          </article>
        ))}
      </div>

      <button className="add-region-wide" onClick={onAdd}>
        <span>＋</span>
        <span><strong>Nueva región</strong><small>Máximo 10 regiones</small></span>
      </button>
    </aside>
  );
}
