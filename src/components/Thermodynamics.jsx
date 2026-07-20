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
  },
  {
    id: 'heating-curve',
    title: 'Curva de calentamiento',
    description: 'ΣQ por etapas'
  }
];

const PHASES = {
  solid: { label: 'Sólido', specificHeat: 'solidSpecificHeat' },
  liquid: { label: 'Líquido', specificHeat: 'liquidSpecificHeat' },
  gas: { label: 'Gaseoso', specificHeat: 'gasSpecificHeat' }
};

const PHASE_ORDER = ['solid', 'liquid', 'gas'];

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
  const [heatingCurve, setHeatingCurve] = useState({
    mass: 1,
    initialPhase: 'solid',
    finalPhase: 'gas',
    initialTemperature: -10,
    finalTemperature: 110,
    meltingPoint: 0,
    boilingPoint: 100,
    solidSpecificHeat: 2100,
    liquidSpecificHeat: 4186,
    gasSpecificHeat: 2010,
    fusionLatentHeat: 334000,
    vaporizationLatentHeat: 2256000
  });
  const results = useMemo(() => convertTemperature(temperature, sourceScale), [temperature, sourceScale]);
  const sensibleHeat = useMemo(() => Number(mass) * Number(specificHeat) * Number(deltaTemperature), [mass, specificHeat, deltaTemperature]);
  const latentHeatTotal = useMemo(() => Number(latentMass) * Number(latentHeat), [latentMass, latentHeat]);
  const equilibrium = useMemo(() => calculateThermalEquilibrium(mixture), [mixture]);
  const heatingCurveResult = useMemo(() => calculateHeatingCurve(heatingCurve), [heatingCurve]);

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
          ) : calculator === 'thermal-equilibrium' ? (
            <ThermalEquilibriumCalculator
              substances={mixture}
              equilibrium={equilibrium}
              onSubstances={setMixture}
            />
          ) : (
            <HeatingCurveCalculator
              values={heatingCurve}
              result={heatingCurveResult}
              onValues={setHeatingCurve}
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
              : calculator === 'thermal-equilibrium'
                ? <ThermalEquilibriumFormulas />
                : <HeatingCurveFormulas />}
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

export function calculateHeatingCurve(values) {
  const m = Number(values.mass);
  const ti = Number(values.initialTemperature);
  const tf = Number(values.finalTemperature);
  const tm = Number(values.meltingPoint);
  const tb = Number(values.boilingPoint);
  const cs = Number(values.solidSpecificHeat);
  const cl = Number(values.liquidSpecificHeat);
  const cg = Number(values.gasSpecificHeat);
  const lf = Number(values.fusionLatentHeat);
  const lv = Number(values.vaporizationLatentHeat);
  const initialPhaseIndex = PHASE_ORDER.indexOf(values.initialPhase);
  const finalPhaseIndex = PHASE_ORDER.indexOf(values.finalPhase);
  const stages = [];

  if (![m, ti, tf, tm, tb, cs, cl, cg, lf, lv].every(Number.isFinite)) {
    return { stages: [], total: NaN, error: 'Completá todos los campos con valores numéricos.' };
  }
  if (initialPhaseIndex < 0 || finalPhaseIndex < 0) {
    return { stages: [], total: NaN, error: 'Seleccioná estados inicial y final válidos.' };
  }
  if (m <= 0 || [cs, cl, cg, lf, lv].some(value => value < 0)) {
    return { stages: [], total: NaN, error: 'La masa debe ser positiva y las propiedades térmicas no pueden ser negativas.' };
  }
  if (tb <= tm) {
    return { stages: [], total: NaN, error: 'El punto de ebullición debe ser mayor que el punto de fusión.' };
  }

  const phaseTemperatureIsValid = (phase, temperature) => (
    phase === 'solid' ? temperature <= tm : phase === 'liquid' ? temperature >= tm && temperature <= tb : temperature >= tb
  );
  if (!phaseTemperatureIsValid(values.initialPhase, ti)) {
    return { stages: [], total: NaN, error: `La temperatura inicial no corresponde al estado ${PHASES[values.initialPhase].label.toLowerCase()}.` };
  }
  if (!phaseTemperatureIsValid(values.finalPhase, tf)) {
    return { stages: [], total: NaN, error: `La temperatura final no corresponde al estado ${PHASES[values.finalPhase].label.toLowerCase()}.` };
  }
  if (initialPhaseIndex === finalPhaseIndex && ti === tf) {
    return { stages: [], total: 0, error: null };
  }

  const addStage = (name, formula, heat, from = null, to = null) => {
    if (Math.abs(heat) > 1e-12) stages.push({ name, formula, heat, from, to });
  };

  const specificHeats = [cs, cl, cg];
  const phaseLabels = ['sólido', 'líquido', 'vapor'];
  const addSensibleStage = (phaseIndex, from, to) => {
    const verb = to >= from ? 'Calentar' : 'Enfriar';
    addStage(`${verb} ${phaseLabels[phaseIndex]}`, `Q = m c_${['s', 'l', 'v'][phaseIndex]} ΔT`, m * specificHeats[phaseIndex] * (to - from), from, to);
  };

  if (initialPhaseIndex === finalPhaseIndex) {
    addSensibleStage(initialPhaseIndex, ti, tf);
  } else if (initialPhaseIndex < finalPhaseIndex) {
    let currentTemperature = ti;
    for (let phaseIndex = initialPhaseIndex; phaseIndex < finalPhaseIndex; phaseIndex += 1) {
      const boundary = phaseIndex === 0 ? tm : tb;
      addSensibleStage(phaseIndex, currentTemperature, boundary);
      addStage(phaseIndex === 0 ? 'Fundir' : 'Evaporar', phaseIndex === 0 ? 'Q = m L_f' : 'Q = m L_v', m * (phaseIndex === 0 ? lf : lv), boundary, boundary);
      currentTemperature = boundary;
    }
    addSensibleStage(finalPhaseIndex, currentTemperature, tf);
  } else {
    let currentTemperature = ti;
    for (let phaseIndex = initialPhaseIndex; phaseIndex > finalPhaseIndex; phaseIndex -= 1) {
      const boundary = phaseIndex === 2 ? tb : tm;
      addSensibleStage(phaseIndex, currentTemperature, boundary);
      addStage(phaseIndex === 2 ? 'Condensar' : 'Solidificar', phaseIndex === 2 ? 'Q = −m L_v' : 'Q = −m L_f', -m * (phaseIndex === 2 ? lv : lf), boundary, boundary);
      currentTemperature = boundary;
    }
    addSensibleStage(finalPhaseIndex, currentTemperature, tf);
  }

  return {
    stages,
    total: stages.reduce((sum, stage) => sum + stage.heat, 0),
    error: null
  };
}

function HeatingCurveCalculator({ values, result, onValues }) {
  const update = (patch) => onValues(current => ({ ...current, ...patch }));
  const transitionLabel = getHeatingTransitionLabel(values.initialPhase, values.finalPhase);
  const updatePhase = (field, phase) => {
    const temperatureField = field === 'initialPhase' ? 'initialTemperature' : 'finalTemperature';
    const suggestedTemperature = phase === 'solid'
      ? Number(values.meltingPoint) - 10
      : phase === 'liquid'
        ? (Number(values.meltingPoint) + Number(values.boilingPoint)) / 2
        : Number(values.boilingPoint) + 10;
    update({ [field]: phase, [temperatureField]: suggestedTemperature });
  };
  const totalSense = Math.abs(result.total) < 1e-12
    ? 'Sin energía neta'
    : result.total > 0
      ? 'Proceso de calentamiento'
      : 'Proceso de enfriamiento';

  return (
    <div className="thermo-card equilibrium-card">
      <span className="eyebrow">CALORIMETRÍA / CURVA DE CALENTAMIENTO</span>
      <h2>Calor total por etapas</h2>
      <p>Elegí los estados inicial y final. El simulador arma el recorrido completo y suma sólo las etapas de calor sensible y latente necesarias.</p>

      <div className="phase-selector" aria-label="Tipo de transición">
        <label>
          <span>Estado inicial</span>
          <select value={values.initialPhase} onChange={event => updatePhase('initialPhase', event.target.value)}>
            {Object.entries(PHASES).map(([id, phase]) => <option key={id} value={id}>{phase.label}</option>)}
          </select>
        </label>
        <span className="phase-arrow" aria-hidden="true">→</span>
        <label>
          <span>Estado final</span>
          <select value={values.finalPhase} onChange={event => updatePhase('finalPhase', event.target.value)}>
            {Object.entries(PHASES).map(([id, phase]) => <option key={id} value={id}>{phase.label}</option>)}
          </select>
        </label>
        <div className="phase-process">
          <span>Proceso</span>
          <strong>{transitionLabel}</strong>
        </div>
      </div>

      <div className="temperature-input-grid heating-curve-grid">
        <label>
          <span>Masa m</span>
          <input type="number" step="any" value={values.mass} onChange={event => update({ mass: event.target.value })} />
          <small>kg</small>
        </label>
        <label>
          <span>T inicial</span>
          <input type="number" step="any" value={values.initialTemperature} onChange={event => update({ initialTemperature: event.target.value })} />
          <small>°C</small>
        </label>
        <label>
          <span>T final</span>
          <input type="number" step="any" value={values.finalTemperature} onChange={event => update({ finalTemperature: event.target.value })} />
          <small>°C</small>
        </label>
        <label>
          <span>Punto de fusión</span>
          <input type="number" step="any" value={values.meltingPoint} onChange={event => update({ meltingPoint: event.target.value })} />
          <small>°C</small>
        </label>
        <label>
          <span>Punto de ebullición</span>
          <input type="number" step="any" value={values.boilingPoint} onChange={event => update({ boilingPoint: event.target.value })} />
          <small>°C</small>
        </label>
      </div>

      <div className="temperature-input-grid heating-curve-grid material-constants-grid">
        <label>
          <span>c sólido</span>
          <input type="number" step="any" value={values.solidSpecificHeat} onChange={event => update({ solidSpecificHeat: event.target.value })} />
          <small>J/(kg·°C)</small>
        </label>
        <label>
          <span>L fusión</span>
          <input type="number" step="any" value={values.fusionLatentHeat} onChange={event => update({ fusionLatentHeat: event.target.value })} />
          <small>J/kg</small>
        </label>
        <label>
          <span>c líquido</span>
          <input type="number" step="any" value={values.liquidSpecificHeat} onChange={event => update({ liquidSpecificHeat: event.target.value })} />
          <small>J/(kg·°C)</small>
        </label>
        <label>
          <span>L vaporización</span>
          <input type="number" step="any" value={values.vaporizationLatentHeat} onChange={event => update({ vaporizationLatentHeat: event.target.value })} />
          <small>J/kg</small>
        </label>
        <label>
          <span>c vapor</span>
          <input type="number" step="any" value={values.gasSpecificHeat} onChange={event => update({ gasSpecificHeat: event.target.value })} />
          <small>J/(kg·°C)</small>
        </label>
      </div>

      {result.error && <div className="heating-curve-error" role="alert">{result.error}</div>}

      <div className="stage-table">
        <div className="stage-head">
          <span>Etapa</span>
          <span>Intervalo</span>
          <span>Fórmula</span>
          <span>Q J</span>
        </div>
        {result.stages.length ? result.stages.map((stage, index) => (
          <div className="stage-row" key={`${stage.name}-${index}`}>
            <strong>{stage.name}</strong>
            <span>{stage.from === stage.to ? `${formatEnergy(stage.from)} °C` : `${formatEnergy(stage.from)} → ${formatEnergy(stage.to)} °C`}</span>
            <code>{stage.formula}</code>
            <b>{formatEnergy(stage.heat)}</b>
          </div>
        )) : (
          <div className="stage-row empty-stage"><strong>Sin etapas</strong><span>{result.error ? 'Revisá las entradas' : 'No hay cambio térmico'}</span><code>—</code><b>—</b></div>
        )}
      </div>

      <div className="temperature-results equilibrium-result">
        <article className="source">
          <span>Calor total</span>
          <strong>{formatEnergy(result.total)}</strong>
          <small>J</small>
        </article>
        <article>
          <span>Equivalente</span>
          <strong>{formatEnergy(result.total / 1000)}</strong>
          <small>kJ</small>
        </article>
        <article>
          <span>Interpretación</span>
          <strong className="result-note">{totalSense}</strong>
          <small>Σ de todas las etapas</small>
        </article>
      </div>
    </div>
  );
}

function getHeatingTransitionLabel(initialPhase, finalPhase) {
  const transitionKey = `${initialPhase}-${finalPhase}`;
  const labels = {
    'solid-solid': 'Sin cambio de fase',
    'liquid-liquid': 'Sin cambio de fase',
    'gas-gas': 'Sin cambio de fase',
    'solid-liquid': 'Fusión',
    'liquid-solid': 'Solidificación',
    'liquid-gas': 'Vaporización',
    'gas-liquid': 'Condensación',
    'solid-gas': 'Fusión + vaporización',
    'gas-solid': 'Condensación + solidificación'
  };

  return labels[transitionKey] ?? 'Transición';
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

function HeatingCurveFormulas() {
  return (
    <section className="formula-panel" aria-label="Fórmulas utilizadas">
      <div className="formula-title"><span className="eyebrow">FÓRMULAS UTILIZADAS</span><small>Curva de calentamiento con cambios de fase</small></div>
      <div className="formula-grid">
        <article>
          <h3>Tramos sensibles</h3>
          <p><code>Q = m c ΔT</code></p>
          <p>Se usa para calentar o enfriar sólido, líquido o vapor sin cambio de fase.</p>
        </article>
        <article>
          <h3>Tramos latentes</h3>
          <p><code>Q = m L_f</code> para fusión.</p>
          <p><code>Q = m L_v</code> para vaporización.</p>
          <p>La temperatura permanece constante durante el cambio de fase.</p>
        </article>
        <article>
          <h3>Calor total</h3>
          <p><code>Q_total = Σ Q_etapas</code></p>
          <p>Ejemplo: calentar sólido + fundir + calentar líquido + evaporar + calentar vapor si corresponde.</p>
        </article>
      </div>
    </section>
  );
}
