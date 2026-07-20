import { useMemo, useState } from 'react';
import { convertTemperature, formatTemperature, TEMPERATURE_SCALES } from '../thermodynamics/temperature.js';

const CALCULATORS = [
  {
    id: 'temperature',
    title: 'Conversor de escalas',
    description: 'Kelvin, Celsius y Fahrenheit'
  },
  {
    id: 'sensible-heat',
    title: 'Calor sensible',
    description: 'Q = m c ΔT'
  },
  {
    id: 'latent-heat',
    title: 'Calor latente',
    description: 'Q = m L'
  },
  {
    id: 'thermal-equilibrium',
    title: 'Equilibrio térmico',
    description: 'ΣQ = 0'
  }
];

function formatEnergy(value) {
  if (!Number.isFinite(value)) return '—';
  return value.toLocaleString('es-AR', {
    maximumFractionDigits: 6,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2
  });
}

export default function Thermodynamics() {
  const [calculator, setCalculator] = useState('temperature');
  const [temperature, setTemperature] = useState(25);
  const [sourceScale, setSourceScale] = useState('celsius');
  const [mass, setMass] = useState(1);
  const [specificHeat, setSpecificHeat] = useState(4186);
  const [deltaTemperature, setDeltaTemperature] = useState(10);
  const [latentMass, setLatentMass] = useState(1);
  const [latentHeat, setLatentHeat] = useState(334000);
  const [mixture, setMixture] = useState([
    { id: 'substance-1', name: 'Sustancia 1', mass: 1, specificHeat: 4186, temperature: 80 },
    { id: 'substance-2', name: 'Sustancia 2', mass: 1, specificHeat: 4186, temperature: 20 }
  ]);
  const results = useMemo(() => convertTemperature(temperature, sourceScale), [temperature, sourceScale]);
  const sensibleHeat = useMemo(() => Number(mass) * Number(specificHeat) * Number(deltaTemperature), [mass, specificHeat, deltaTemperature]);
  const latentHeatTotal = useMemo(() => Number(latentMass) * Number(latentHeat), [latentMass, latentHeat]);
  const equilibrium = useMemo(() => calculateThermalEquilibrium(mixture), [mixture]);

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
          {calculator === 'temperature' ? (
            <TemperatureConverter
              temperature={temperature}
              sourceScale={sourceScale}
              results={results}
              onTemperature={setTemperature}
              onSourceScale={setSourceScale}
            />
          ) : calculator === 'sensible-heat' ? (
            <SensibleHeatCalculator
              mass={mass}
              specificHeat={specificHeat}
              deltaTemperature={deltaTemperature}
              sensibleHeat={sensibleHeat}
              onMass={setMass}
              onSpecificHeat={setSpecificHeat}
              onDeltaTemperature={setDeltaTemperature}
            />
          ) : calculator === 'latent-heat' ? (
            <LatentHeatCalculator
              mass={latentMass}
              latentHeat={latentHeat}
              totalHeat={latentHeatTotal}
              onMass={setLatentMass}
              onLatentHeat={setLatentHeat}
            />
          ) : (
            <ThermalEquilibriumCalculator
              substances={mixture}
              equilibrium={equilibrium}
              onSubstances={setMixture}
            />
          )}
        </section>
      </main>

      <section className="results-drawer thermo-formulas">
        {calculator === 'temperature'
          ? <TemperatureFormulas />
          : calculator === 'sensible-heat'
            ? <SensibleHeatFormulas />
            : calculator === 'latent-heat'
              ? <LatentHeatFormulas />
              : <ThermalEquilibriumFormulas />}
      </section>
    </>
  );
}

function TemperatureConverter({ temperature, sourceScale, results, onTemperature, onSourceScale }) {
  return (
    <div className="thermo-card">
      <span className="eyebrow">CONVERSOR DE ESCALAS DE TEMPERATURA</span>
      <h2>Convertir temperatura</h2>
      <p>Ingresá un valor y su escala de origen. El simulador devuelve el equivalente en las otras escalas.</p>

      <div className="temperature-input-grid">
        <label>
          <span>Valor</span>
          <input type="number" step="any" value={temperature} onChange={event => onTemperature(event.target.value)} />
        </label>
        <label>
          <span>Escala de origen</span>
          <select value={sourceScale} onChange={event => onSourceScale(event.target.value)}>
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
  );
}

function SensibleHeatCalculator({ mass, specificHeat, deltaTemperature, sensibleHeat, onMass, onSpecificHeat, onDeltaTemperature }) {
  const heatSense = Math.abs(sensibleHeat) < 1e-12
    ? 'Sin cambio térmico neto'
    : sensibleHeat > 0
      ? 'La sustancia absorbe calor'
      : 'La sustancia cede calor';

  return (
    <div className="thermo-card">
      <span className="eyebrow">CALORIMETRÍA / CALOR SENSIBLE</span>
      <h2>Calcular Q = mcΔT</h2>
      <p>Calcula la energía térmica necesaria para elevar o disminuir la temperatura de una sustancia sin cambiar su estado físico.</p>

      <div className="temperature-input-grid sensible-heat-grid">
        <label>
          <span>Masa m</span>
          <input type="number" step="any" value={mass} onChange={event => onMass(event.target.value)} />
          <small>kg</small>
        </label>
        <label>
          <span>Calor específico c</span>
          <input type="number" step="any" value={specificHeat} onChange={event => onSpecificHeat(event.target.value)} />
          <small>J/(kg·°C)</small>
        </label>
        <label>
          <span>Variación ΔT</span>
          <input type="number" step="any" value={deltaTemperature} onChange={event => onDeltaTemperature(event.target.value)} />
          <small>°C o K</small>
        </label>
      </div>

      <div className="temperature-results sensible-heat-result">
        <article className="source">
          <span>Calor Q</span>
          <strong>{formatEnergy(sensibleHeat)}</strong>
          <small>J</small>
        </article>
        <article>
          <span>Equivalente</span>
          <strong>{formatEnergy(sensibleHeat / 1000)}</strong>
          <small>kJ</small>
        </article>
        <article>
          <span>Interpretación</span>
          <strong className="result-note">{heatSense}</strong>
          <small>{Number(deltaTemperature) >= 0 ? 'ΔT positivo' : 'ΔT negativo'}</small>
        </article>
      </div>
    </div>
  );
}

function LatentHeatCalculator({ mass, latentHeat, totalHeat, onMass, onLatentHeat }) {
  return (
    <div className="thermo-card">
      <span className="eyebrow">CALORIMETRÍA / CALOR LATENTE</span>
      <h2>Calcular Q = mL</h2>
      <p>Calcula la energía necesaria para que una sustancia cambie de estado físico a temperatura constante.</p>

      <div className="temperature-input-grid latent-heat-grid">
        <label>
          <span>Masa m</span>
          <input type="number" step="any" value={mass} onChange={event => onMass(event.target.value)} />
          <small>kg</small>
        </label>
        <label>
          <span>Calor latente L</span>
          <input type="number" step="any" value={latentHeat} onChange={event => onLatentHeat(event.target.value)} />
          <small>J/kg</small>
        </label>
      </div>

      <div className="temperature-results latent-heat-result">
        <article className="source">
          <span>Calor Q</span>
          <strong>{formatEnergy(totalHeat)}</strong>
          <small>J</small>
        </article>
        <article>
          <span>Equivalente</span>
          <strong>{formatEnergy(totalHeat / 1000)}</strong>
          <small>kJ</small>
        </article>
        <article>
          <span>Proceso</span>
          <strong className="result-note">Cambio de fase a temperatura constante</strong>
          <small>fusión, solidificación, vaporización o condensación</small>
        </article>
      </div>
    </div>
  );
}

function calculateThermalEquilibrium(substances) {
  const numerator = substances.reduce((sum, item) => sum + Number(item.mass) * Number(item.specificHeat) * Number(item.temperature), 0);
  const denominator = substances.reduce((sum, item) => sum + Number(item.mass) * Number(item.specificHeat), 0);
  const finalTemperature = denominator === 0 ? NaN : numerator / denominator;
  const heats = substances.map(item => ({
    id: item.id,
    heat: Number(item.mass) * Number(item.specificHeat) * (finalTemperature - Number(item.temperature))
  }));
  return { finalTemperature, numerator, denominator, heats };
}

function ThermalEquilibriumCalculator({ substances, equilibrium, onSubstances }) {
  function updateSubstance(id, patch) {
    onSubstances(current => current.map(item => item.id === id ? { ...item, ...patch } : item));
  }

  function addSubstance() {
    onSubstances(current => [
      ...current,
      {
        id: `substance-${Date.now()}`,
        name: `Sustancia ${current.length + 1}`,
        mass: 1,
        specificHeat: 4186,
        temperature: 25
      }
    ]);
  }

  function removeSubstance(id) {
    onSubstances(current => current.length <= 2 ? current : current.filter(item => item.id !== id));
  }

  return (
    <div className="thermo-card equilibrium-card">
      <span className="eyebrow">CALORIMETRÍA / EQUILIBRIO TÉRMICO</span>
      <h2>Temperatura final de mezcla</h2>
      <p>Resuelve mezclas térmicas en un calorímetro ideal: sistema aislado, sin pérdidas, donde la suma del calor cedido y absorbido es cero.</p>

      <div className="equilibrium-table">
        <div className="equilibrium-head">
          <span>Sustancia</span>
          <span>m kg</span>
          <span>c J/(kg·°C)</span>
          <span>T inicial °C</span>
          <span>Qᵢ J</span>
          <span></span>
        </div>
        {substances.map((item, index) => (
          <div className="equilibrium-row" key={item.id}>
            <input value={item.name} onChange={event => updateSubstance(item.id, { name: event.target.value })} />
            <input type="number" step="any" value={item.mass} onChange={event => updateSubstance(item.id, { mass: event.target.value })} />
            <input type="number" step="any" value={item.specificHeat} onChange={event => updateSubstance(item.id, { specificHeat: event.target.value })} />
            <input type="number" step="any" value={item.temperature} onChange={event => updateSubstance(item.id, { temperature: event.target.value })} />
            <strong>{formatEnergy(equilibrium.heats[index]?.heat)}</strong>
            <button type="button" disabled={substances.length <= 2} onClick={() => removeSubstance(item.id)}>×</button>
          </div>
        ))}
      </div>

      <button className="add-substance-button" type="button" onClick={addSubstance}>＋ Agregar sustancia</button>

      <div className="temperature-results equilibrium-result">
        <article className="source">
          <span>Temperatura final</span>
          <strong>{formatEnergy(equilibrium.finalTemperature)}</strong>
          <small>°C</small>
        </article>
        <article>
          <span>Balance</span>
          <strong>{formatEnergy(equilibrium.heats.reduce((sum, item) => sum + item.heat, 0))}</strong>
          <small>J ≈ 0</small>
        </article>
        <article>
          <span>Modelo</span>
          <strong className="result-note">Calorímetro ideal</strong>
          <small>sin pérdidas al entorno</small>
        </article>
      </div>
    </div>
  );
}

function TemperatureFormulas() {
  return (
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
  );
}

function SensibleHeatFormulas() {
  return (
    <section className="formula-panel" aria-label="Fórmulas utilizadas">
      <div className="formula-title"><span className="eyebrow">FÓRMULAS UTILIZADAS</span><small>Calor sensible sin cambio de estado físico</small></div>
      <div className="formula-grid">
        <article>
          <h3>Calor sensible</h3>
          <p><code>Q = m c ΔT</code></p>
          <p><code>ΔT = T_final − T_inicial</code></p>
        </article>
        <article>
          <h3>Unidades</h3>
          <p><code>m</code>: masa en <code>kg</code></p>
          <p><code>c</code>: calor específico en <code>J/(kg·°C)</code> o <code>J/(kg·K)</code></p>
          <p><code>ΔT</code>: variación de temperatura en <code>°C</code> o <code>K</code></p>
        </article>
        <article>
          <h3>Interpretación del signo</h3>
          <p><code>Q &gt; 0</code>: el cuerpo absorbe calor.</p>
          <p><code>Q &lt; 0</code>: el cuerpo cede calor.</p>
          <p><code>Q = 0</code>: no hay cambio térmico neto.</p>
        </article>
      </div>
    </section>
  );
}

function LatentHeatFormulas() {
  return (
    <section className="formula-panel" aria-label="Fórmulas utilizadas">
      <div className="formula-title"><span className="eyebrow">FÓRMULAS UTILIZADAS</span><small>Calor latente durante un cambio de fase</small></div>
      <div className="formula-grid">
        <article>
          <h3>Calor latente</h3>
          <p><code>Q = m L</code></p>
          <p>Se usa cuando la temperatura permanece constante y cambia el estado físico.</p>
        </article>
        <article>
          <h3>Unidades</h3>
          <p><code>m</code>: masa en <code>kg</code></p>
          <p><code>L</code>: calor latente en <code>J/kg</code></p>
          <p><code>Q</code>: energía térmica en <code>J</code></p>
        </article>
        <article>
          <h3>Tipos comunes</h3>
          <p><code>L_f</code>: calor latente de fusión.</p>
          <p><code>L_v</code>: calor latente de vaporización.</p>
          <p>El valor de <code>L</code> depende de la sustancia y del cambio de fase.</p>
        </article>
      </div>
    </section>
  );
}

function ThermalEquilibriumFormulas() {
  return (
    <section className="formula-panel" aria-label="Fórmulas utilizadas">
      <div className="formula-title"><span className="eyebrow">FÓRMULAS UTILIZADAS</span><small>Mezcla térmica en calorímetro ideal</small></div>
      <div className="formula-grid">
        <article>
          <h3>Balance térmico</h3>
          <p><code>Σ Qᵢ = 0</code></p>
          <p><code>Q = m c ΔT</code></p>
        </article>
        <article>
          <h3>Temperatura final</h3>
          <p><code>Σ mᵢ cᵢ (T_f − Tᵢ) = 0</code></p>
          <p><code>T_f = (Σ mᵢ cᵢ Tᵢ) / (Σ mᵢ cᵢ)</code></p>
        </article>
        <article>
          <h3>Supuestos</h3>
          <p>El sistema está aislado.</p>
          <p>No hay cambio de fase.</p>
          <p>El calorímetro no absorbe calor o su capacidad térmica se desprecia.</p>
        </article>
      </div>
    </section>
  );
}
