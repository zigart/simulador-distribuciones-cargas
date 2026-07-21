import { calculateField, locatePoint } from '../physics/calculations.js';
import { sci } from '../physics/format.js';

export default function ResultsPanel({ state, onRadius, contributionsCollapsed, onToggleContributions }) {
  const { rows, total } = calculateField(state.geometry, state.regions, state.point);
  const radial = total.x;
  const mag = Math.abs(radial);
  return (
    <section className="results-drawer">
      <div className="results-summary">
        <div className="result-heading"><span className="eyebrow">RESULTADO EN RADIO</span><span>{locatePoint(state.geometry, state.regions, state.point)}</span></div>
        <div className="magnitude"><span>|E(r)|</span><strong>{sci(mag)}</strong><small>N/C</small></div>
        <div className="vector-value"><span>CAMPO RADIAL</span><code>{sci(radial)} N/C</code></div>
        <div className="direction-value"><span>SENTIDO</span><strong>{mag < 1e-9 ? '—' : radial > 0 ? 'hacia afuera' : 'hacia el centro'}</strong></div>
      </div>
      <div className="test-point">
        <div><span className="eyebrow">RADIO DE CÁLCULO</span><small>Distancia al centro o eje en metros</small></div>
        <label>r <input type="number" value={state.radius} min="0" step="0.01" onChange={e => onRadius(e.target.value)} /></label>
      </div>
      <div className={`contributions ${contributionsCollapsed ? 'collapsed' : ''}`}>
        <button onClick={onToggleContributions}><span>APORTES POR REGIÓN</span><b>⌃</b></button>
        <div id="contributionTableWrap">
          <table>
            <thead><tr><th>Región</th><th>E_r N/C</th><th>|E| N/C</th><th>Aporte</th></tr></thead>
            <tbody>
              {rows.map(({ region, field }) => {
                const er = field.x;
                const abs = Math.abs(er);
                return <tr key={region.id}><td><i style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 2, background: region.color, marginRight: 6 }}></i>{region.name}</td><td>{sci(er)}</td><td>{sci(abs)}</td><td>{abs < 1e-9 ? '—' : er > 0 ? 'sale' : 'entra'}</td></tr>;
              })}
              <tr><td>Total</td><td>{sci(radial)}</td><td>{sci(mag)}</td><td>{mag < 1e-9 ? '—' : radial > 0 ? 'sale' : 'entra'}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <FormulaPanel />
    </section>
  );
}

function FormulaPanel() {
  return (
    <section className="formula-panel" aria-label="Fórmulas utilizadas">
      <div className="formula-title"><span className="eyebrow">FÓRMULAS UTILIZADAS</span><small>Referencia del apéndice y modelo uniforme del simulador</small></div>
      <div className="formula-grid">
        <article><h3>Base</h3><p><code>k = 1 / (4π ε₀) = 8.9875517923 × 10⁹ N·m²/C²</code></p><p><code>E⃗ total(P) = Σ E⃗ᵢ(P)</code></p></article>
        <article><h3>Esfera sólida</h3><p><code>E_r = kQ/r²</code> para <code>r ≥ R</code></p><p><code>E_r = kQr/R³</code> para <code>r ≤ R</code></p></article>
        <article><h3>Corteza esférica</h3><p><code>E_r = kQ/r²</code> para <code>r &gt; R</code></p><p><code>E_r = 0</code> para <code>r &lt; R</code></p></article>
        <article><h3>Cilindro sólido</h3><p><code>E_r = ρR²/(2ε₀r) = λ/(2π ε₀ r)</code> para <code>r ≥ R</code></p><p><code>E_r = ρr/(2ε₀) = λr/(2π ε₀R²)</code> para <code>r ≤ R</code></p></article>
        <article><h3>Corteza cilíndrica</h3><p><code>E_r = 0</code> para <code>r &lt; R</code></p><p><code>E_r = σR/(ε₀r) = λ/(2π ε₀ r)</code> para <code>r &gt; R</code></p></article>
        <article><h3>Aislante uniforme</h3><p><code>ρ(r) = ρ₀</code></p><p><code>Q = ρ₀V</code> o <code>λ = ρ₀(V/L)</code></p></article>
      </div>
    </section>
  );
}
