import { useMemo, useState } from 'react';
import { convertTemperature, formatTemperature, TEMPERATURE_SCALES } from '../thermodynamics/temperature.js';

const CALCULATORS = [
  {
    id: 'temperature',
    title: 'Conversor de escalas',
    description: 'Kelvin, Celsius y Fahrenheit'
  }
];

export default function Thermodynamics() {
  const [calculator, setCalculator] = useState('temperature');
  const [temperature, setTemperature] = useState(25);
  const [sourceScale, setSourceScale] = useState('celsius');
  const results = useMemo(() => convertTemperature(temperature, sourceScale), [temperature, sourceScale]);

  return (
    <>
      <main className="workspace thermo-workspace">
        <aside className="panel thermo-menu">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">TERMODINÁMICA</span>
              <h1>Cálculos</h1>
            </div>
          </div>
          <div className="calc-menu-list">
            {CALCULATORS.map(item => (
              <button key={item.id} className={calculator === item.id ? 'active' : ''} onClick={() => setCalculator(item.id)}>
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </button>
            ))}
          </div>
        </aside>

        <section className="thermo-panel">
          <div className="thermo-card">
            <span className="eyebrow">CONVERSOR DE ESCALAS DE TEMPERATURA</span>
            <h2>Convertir temperatura</h2>
            <p>Ingresá un valor y su escala de origen. El simulador devuelve el equivalente en las otras escalas.</p>

            <div className="temperature-input-grid">
              <label>
                <span>Valor</span>
                <input type="number" step="any" value={temperature} onChange={event => setTemperature(event.target.value)} />
              </label>
              <label>
                <span>Escala de origen</span>
                <select value={sourceScale} onChange={event => setSourceScale(event.target.value)}>
                  {Object.entries(TEMPERATURE_SCALES).map(([id, scale]) => <option key={id} value={id}>{scale.label} ({scale.symbol})</option>)}
                </select>
              </label>
            </div>

            <div className="temperature-results">
              {Object.entries(TEMPERATURE_SCALES).map(([id, scale]) => (
                <article key={id} className={id === sourceScale ? 'source' : ''}>
                  <span>{scale.label}</span>
                  <strong>{formatTemperature(results[id])}</strong>
                  <small>{scale.symbol}</small>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <section className="results-drawer thermo-formulas">
        <section className="formula-panel" aria-label="Fórmulas utilizadas">
          <div className="formula-title"><span className="eyebrow">FÓRMULAS UTILIZADAS</span><small>Conversión exacta entre escalas de temperatura</small></div>
          <div className="formula-grid">
            <article>
              <h3>Desde Celsius</h3>
              <p><code>K = °C + 273.15</code></p>
              <p><code>°F = (°C × 9/5) + 32</code></p>
            </article>
            <article>
              <h3>Desde Kelvin</h3>
              <p><code>°C = K − 273.15</code></p>
              <p><code>°F = ((K − 273.15) × 9/5) + 32</code></p>
            </article>
            <article>
              <h3>Desde Fahrenheit</h3>
              <p><code>°C = (°F − 32) × 5/9</code></p>
              <p><code>K = ((°F − 32) × 5/9) + 273.15</code></p>
            </article>
          </div>
        </section>
      </section>
    </>
  );
}
