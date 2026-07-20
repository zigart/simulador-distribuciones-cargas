import { REGION_TYPES } from '../physics/constants.js';
import { chargeFmtWithUnit, profileName, sci } from '../physics/format.js';
import { coefficientUnit, measure, regionDensity, validateRegion } from '../physics/calculations.js';

export default function RegionEditor({
  geometry,
  labels,
  regions,
  selected,
  chargeMode,
  chargeUnit,
  densityUnit,
  onChargeMode,
  onChargeUnit,
  onDensityUnit,
  onChange,
  onMaterial,
  onDelete
}) {
  const disabled = !selected;
  const validation = selected ? validateRegion(selected, regions) : '';
  const isDensity = chargeMode === 'density';
  const isSurfaceOrVacuum = selected?.material === 'vacuum' || selected?.material === 'conductor';
  const physicalValue = selected ? (isDensity ? selected.coefficient : selected.charge) : 0;
  const chargeUnits = geometry === 'cylinder'
    ? [{ label: 'C/m', value: 1 }, { label: 'μC/m', value: 0.000001 }, { label: 'nC/m', value: 1e-9 }]
    : [{ label: 'C', value: 1 }, { label: 'μC', value: 0.000001 }, { label: 'nC', value: 1e-9 }];
  const densityUnits = selected ? [{ label: coefficientUnit(selected), value: 1 }, { label: `μ${coefficientUnit(selected)}`, value: 0.000001 }] : [];
  const units = isDensity ? densityUnits : chargeUnits;
  const displayUnit = isDensity ? densityUnit : chargeUnit;
  const polarity = selected ? 50 + Math.max(-1, Math.min(1, selected.charge / (geometry === 'cylinder' ? 10e-9 : 5e-6))) * 47 : 50;

  function updateCharge(raw, unit) {
    if (!selected || selected.material === 'vacuum') return;
    const value = Number(raw) * Number(unit);
    if (chargeMode === 'total') {
      onChange({ charge: value, coefficient: value / Math.max(measure(selected, geometry), 1e-9) });
    } else {
      const next = { ...selected, coefficient: value };
      onChange({ coefficient: value, charge: value * Math.max(measure(next, geometry), 1e-9) });
    }
  }

  return (
    <aside className="panel properties-panel">
      <div className="panel-heading compact">
        <div><span className="eyebrow">PROPIEDADES</span><h2>{selected ? selected.name : 'Configuración completa'}</h2></div>
        <button className="icon-button danger" title="Eliminar región" disabled={disabled} onClick={onDelete}>⌫</button>
      </div>

      <form autoComplete="off" onSubmit={e => e.preventDefault()}>
        <label className="field-label" htmlFor="regionName">Nombre</label>
        <input className="text-input" id="regionName" maxLength="28" disabled={disabled} value={selected?.name || ''} onChange={e => onChange({ name: e.target.value })} />

        <div className="field-group">
          <span className="field-label">Límites <em>metros</em></span>
          <div className="paired-inputs">
            <label><span>{labels.inner}</span><div><input type="number" min="0" step="0.1" disabled={disabled} value={selected?.inner ?? ''} onChange={e => onChange({ inner: Number(e.target.value) })} /><b>m</b></div></label>
            <label><span>{labels.outer}</span><div><input type="number" min="0.01" step="0.1" disabled={disabled} value={selected?.outer ?? ''} onChange={e => onChange({ outer: Number(e.target.value) })} /><b>m</b></div></label>
          </div>
        </div>

        <div className="field-group">
          <span className="field-label">Tipo de región</span>
          <div className="type-grid" style={{ gridTemplateColumns: `repeat(${REGION_TYPES.length}, 1fr)` }}>
            <button type="button" disabled={disabled} className={selected?.material === 'insulator' ? 'active' : ''} onClick={() => onMaterial('insulator')}><span>⊙</span>Aislante</button>
            <button type="button" disabled={disabled} className={selected?.material === 'conductor' ? 'active' : ''} onClick={() => onMaterial('conductor')}><span>●</span>Conductor</button>
            <button type="button" disabled={disabled} className={selected?.material === 'vacuum' ? 'active' : ''} onClick={() => onMaterial('vacuum')}><span>○</span>Vacío</button>
          </div>
        </div>

        <div className="charge-section">
          <div className="charge-tabs">
            <button type="button" disabled={disabled} className={chargeMode === 'total' ? 'active' : ''} onClick={() => onChargeMode('total')}>{labels.total}</button>
            <button type="button" disabled={disabled} className={chargeMode === 'density' ? 'active' : ''} onClick={() => onChargeMode('density')}>Densidad</button>
          </div>
          <label className="field-label profile-label" htmlFor="densityProfile">Perfil radial</label>
          <select className="profile-select" id="densityProfile" disabled={disabled || isSurfaceOrVacuum} value={selected?.profile || 'constant'} onChange={e => onChange({ profile: e.target.value })}>
            <option value="constant">Constante</option>
            <option value="linear">rho = A r</option>
            <option value="inverse">rho = B / r</option>
          </select>
          <label className="charge-input">
            <input type="number" step="any" disabled={disabled || selected?.material === 'vacuum'} value={selected?.material === 'vacuum' ? 0 : Number((physicalValue / displayUnit).toPrecision(7))} onChange={e => updateCharge(e.target.value, displayUnit)} />
            <select
              aria-label="Unidad de carga"
              disabled={disabled || selected?.material === 'vacuum'}
              value={displayUnit}
              onChange={e => isDensity ? onDensityUnit(Number(e.target.value)) : onChargeUnit(Number(e.target.value))}
            >
              {units.map(unit => <option key={unit.label} value={unit.value}>{unit.label}</option>)}
            </select>
          </label>
          <div className="calculated-row">
            <span>{isDensity ? labels.total : selected?.material === 'conductor' ? 'σ calculada' : `${profileName(selected?.profile)} · coeficiente`}</span>
            <strong>{selected ? (isDensity ? chargeFmtWithUnit(selected.charge, geometry, chargeUnit) : `${sci(regionDensity(selected))} ${coefficientUnit(selected)}`) : `${regions.length} regiones`}</strong>
          </div>
          <div className="polarity-bar"><span>−</span><div><i style={{ left: `${polarity}%` }}></i></div><span>＋</span></div>
        </div>

        <div className={`validation-message ${validation ? 'show' : ''}`}>{validation}</div>
      </form>
    </aside>
  );
}
