import { EPS } from '../physics/constants.js';
import { calculateField, sortedRegions } from '../physics/calculations.js';
import { chargeFmtWithUnit, fmt } from '../physics/format.js';

export default function Visualization2D({ state, labels, onSelect, onClear }) {
  const { geometry, regions, selectedId, point, radius, graphZoom, showLabels, chargeUnit } = state;
  const maxRegion = Math.max(1, ...regions.map(r => r.outer));
  const pointRadius = Math.hypot(point.x, point.y);
  const extent = Math.max(maxRegion * 1.24, pointRadius * 1.12, 1);
  const scale = 245 / extent * graphZoom;
  const cx = 360, cy = 320;
  const { total } = calculateField(geometry, regions, point);
  const mag = Math.hypot(total.x, total.y, total.z);
  const px = cx + point.x * scale;
  const py = cy - point.y * scale;

  return (
    <>
      <svg id="visualization" viewBox="0 0 720 650" role="img" aria-label="Vista de corte de las regiones" onClick={onClear}>
        <defs>
          <filter id="shadow"><feDropShadow dx="0" dy="3" stdDeviation="5" floodOpacity=".12" /></filter>
          <marker id="arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z" fill="#17201f" /></marker>
        </defs>
        <line x1="22" y1={cy} x2="698" y2={cy} stroke="#bdc7c3" strokeWidth="1" />
        <line x1={cx} y1="18" x2={cx} y2="622" stroke="#bdc7c3" strokeWidth="1" />
        {sortedRegions(regions).sort((a, b) => b.outer - a.outer).map(region => {
          const stroke = region.id === selectedId ? '#17201f' : region.color;
          const opacity = region.material === 'vacuum' ? .07 : region.material === 'conductor' ? .34 : .25;
          return (
            <g key={region.id} data-region-id={region.id} onClick={(event) => { event.stopPropagation(); onSelect(region.id); }}>
              <circle cx={cx} cy={cy} r={region.outer * scale} fill={region.color} fillOpacity={opacity} stroke={stroke} strokeWidth={region.id === selectedId ? 3 : 1.4} strokeDasharray={region.material === 'vacuum' ? '5 4' : undefined} />
              {region.inner > 0 && <circle cx={cx} cy={cy} r={region.inner * scale} fill="#f4f6f3" fillOpacity=".62" stroke={region.color} strokeWidth="1" strokeDasharray="3 4" />}
            </g>
          );
        })}
        {showLabels && sortedRegions(regions).map((region, i) => {
          const visualOuter = region.outer * scale;
          const y = cy - visualOuter;
          const x2 = cx + visualOuter;
          return <g key={`${region.id}-label`}><line x1={cx} y1={y} x2={x2} y2={y} stroke="#65716e" strokeWidth=".8" strokeDasharray="2 3" /><text x={(cx + x2) / 2} y={y - 6} textAnchor="middle" fill="#65716e" fontFamily="DM Mono" fontSize="9">{labels.dim}{i + 1} · {fmt(region.outer, 2)} m</text></g>;
        })}
        {mag > EPS && <line x1={px} y1={py} x2={px + Math.min(90, 28 + Math.log10(mag + 1) * 12) * total.x / mag} y2={py - Math.min(90, 28 + Math.log10(mag + 1) * 12) * total.y / mag} stroke="#17201f" strokeWidth="2" markerEnd="url(#arrow)" />}
        <circle cx={px} cy={py} r="9" fill="#17201f" opacity=".12" />
        <circle cx={px} cy={py} r="4" fill="#c9f31d" stroke="#17201f" strokeWidth="2" />
      </svg>
      <div className="axis-label axis-x">x</div>
      <div className="axis-label axis-y">y</div>
      <div className="scale-note">escala · {fmt(extent / 3 / graphZoom, 3)} m · zoom {fmt(graphZoom, 1)}×</div>
      <div className="point-card" style={{ left: `${Math.max(8, Math.min(82, px / 720 * 100 + 2))}%`, top: `${Math.max(3, Math.min(88, py / 650 * 100 + 2))}%` }}>
        <span className="point-dot"></span>
        <div><small>PUNTO P</small><strong>r = {fmt(radius, 3)} m</strong></div>
      </div>
      <div className="legend">
        {sortedRegions(regions).map(region => <span key={region.id} className="legend-item"><i style={{ background: region.color }}></i><b>{region.name}</b> {chargeFmtWithUnit(region.charge, geometry, chargeUnit)}</span>)}
      </div>
    </>
  );
}
