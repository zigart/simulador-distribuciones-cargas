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
    description: 'Q = ±mL'
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
  },
  {
    id: 'ideal-gas',
    title: 'Gas ideal',
    description: 'PV = nRT'
  },
  {
    id: 'first-law',
    title: 'Primer principio',
    description: 'ΔEᵢₙₜ = Q + W'
  },
  {
    id: 'isothermal-process',
    title: 'Proceso isotérmico',
    description: 'Q = −W'
  },
  {
    id: 'isobaric-process',
    title: 'Proceso isobárico',
    description: 'W = −PΔV'
  },
  {
    id: 'adiabatic-process',
    title: 'Proceso adiabático',
    description: 'Q = 0'
  },
  {
    id: 'mechanical-equivalent',
    title: 'Equivalente mecánico',
    description: '1 cal = 4.186 J'
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

function formatCompactEnergy(value) {
  if (!Number.isFinite(value)) return '—';
  const absValue = Math.abs(value);
  if (absValue >= 1000000) return `${(value / 1000000).toLocaleString('es-AR', { maximumFractionDigits: 2 })}M`;
  if (absValue >= 10000) return `${(value / 1000).toLocaleString('es-AR', { maximumFractionDigits: 0 })}k`;
  return value.toLocaleString('es-AR', {
    maximumFractionDigits: Math.abs(value) >= 100 ? 0 : 1
  });
}

function HeatingStageFormula({ formula }) {
  if (formula === 'Q = m c_s ΔT') return <>Q = m c<sub>s</sub> ΔT</>;
  if (formula === 'Q = m c_l ΔT') return <>Q = m c<sub>l</sub> ΔT</>;
  if (formula === 'Q = m c_v ΔT') return <>Q = m c<sub>v</sub> ΔT</>;
  if (formula === 'Q = m L_f') return <>Q = m L<sub>f</sub></>;
  if (formula === 'Q = m L_v') return <>Q = m L<sub>v</sub></>;
  if (formula === 'Q = −m L_f') return <>Q = −m L<sub>f</sub></>;
  if (formula === 'Q = −m L_v') return <>Q = −m L<sub>v</sub></>;
  return <>{formula}</>;
}

function VolumeRatioFormula() {
  return (
    <span className="inline-fraction">
      <span>V<sub>f</sub></span>
      <i></i>
      <span>V<sub>i</sub></span>
    </span>
  );
}

export default function Thermodynamics() {
  const [calculator, setCalculator] = useState('temperature');
  const [temperature, setTemperature] = useState(25);
  const [sourceScale, setSourceScale] = useState('celsius');
  const [mechanical, setMechanical] = useState({
    mode: 'velocity',
    mass: 1,
    velocity: 10,
    height: 5,
    specificHeat: 4186
  });
  const [mass, setMass] = useState(1);
  const [specificHeat, setSpecificHeat] = useState(4186);
  const [deltaTemperature, setDeltaTemperature] = useState(10);
  const [latentMass, setLatentMass] = useState(1);
  const [latentHeat, setLatentHeat] = useState(334000);
  const [firstLaw, setFirstLaw] = useState({
    heat: 500,
    work: 200
  });
  const [idealGas, setIdealGas] = useState({
    initialVolume: 2,
    finalVolume: 1.5,
    initialPressure: 1,
    initialTemperature: 30,
    finalTemperature: 60
  });
  const [isothermal, setIsothermal] = useState({
    moles: 1,
    temperature: 300,
    initialVolume: 2,
    finalVolume: 4
  });
  const [isobaric, setIsobaric] = useState({
    pressure: 1,
    initialVolume: 2,
    finalVolume: 4
  });
  const [adiabatic, setAdiabatic] = useState({
    initialPressure: 1,
    initialVolume: 2,
    finalVolume: 4,
    gamma: 1.4
  });
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
  const mechanicalResult = useMemo(() => calculateMechanicalEquivalent(mechanical), [mechanical]);
  const sensibleHeat = useMemo(() => Number(mass) * Number(specificHeat) * Number(deltaTemperature), [mass, specificHeat, deltaTemperature]);
  const latentHeatTotal = useMemo(() => Number(latentMass) * Number(latentHeat), [latentMass, latentHeat]);
  const firstLawResult = useMemo(() => calculateFirstLaw(firstLaw), [firstLaw]);
  const idealGasResult = useMemo(() => calculateIdealGas(idealGas), [idealGas]);
  const isothermalResult = useMemo(() => calculateIsothermalProcess(isothermal), [isothermal]);
  const isobaricResult = useMemo(() => calculateIsobaricProcess(isobaric), [isobaric]);
  const adiabaticResult = useMemo(() => calculateAdiabaticProcess(adiabatic), [adiabatic]);
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
          ) : calculator === 'mechanical-equivalent' ? (
            <MechanicalEquivalentCalculator
              values={mechanical}
              result={mechanicalResult}
              onValues={setMechanical}
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
          ) : calculator === 'first-law' ? (
            <FirstLawCalculator
              values={firstLaw}
              result={firstLawResult}
              onValues={setFirstLaw}
            />
          ) : calculator === 'ideal-gas' ? (
            <IdealGasCalculator
              values={idealGas}
              result={idealGasResult}
              onValues={setIdealGas}
            />
          ) : calculator === 'isothermal-process' ? (
            <IsothermalProcessCalculator
              values={isothermal}
              result={isothermalResult}
              onValues={setIsothermal}
            />
          ) : calculator === 'isobaric-process' ? (
            <IsobaricProcessCalculator
              values={isobaric}
              result={isobaricResult}
              onValues={setIsobaric}
            />
          ) : calculator === 'adiabatic-process' ? (
            <AdiabaticProcessCalculator
              values={adiabatic}
              result={adiabaticResult}
              onValues={setAdiabatic}
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
          : calculator === 'mechanical-equivalent'
            ? <MechanicalEquivalentFormulas />
            : calculator === 'sensible-heat'
              ? <SensibleHeatFormulas />
              : calculator === 'latent-heat'
                ? <LatentHeatFormulas />
                : calculator === 'first-law'
                  ? <FirstLawFormulas />
                  : calculator === 'ideal-gas'
                    ? <IdealGasFormulas />
                    : calculator === 'isothermal-process'
                      ? <IsothermalProcessFormulas />
                    : calculator === 'isobaric-process'
                      ? <IsobaricProcessFormulas />
                      : calculator === 'adiabatic-process'
                        ? <AdiabaticProcessFormulas />
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

function calculateFirstLaw(values) {
  const heat = Number(values.heat);
  const work = Number(values.work);

  if (![heat, work].every(Number.isFinite)) {
    return { internalEnergyChange: NaN, error: 'Completá todos los campos con valores numéricos.' };
  }

  return {
    internalEnergyChange: heat + work,
    error: null
  };
}

function FirstLawCalculator({ values, result, onValues }) {
  const update = (patch) => onValues(current => ({ ...current, ...patch }));
  const interpretation = Math.abs(result.internalEnergyChange) < 1e-12
    ? 'Energía interna constante'
    : result.internalEnergyChange > 0
      ? 'Aumenta la energía interna'
      : 'Disminuye la energía interna';

  return (
    <div className="thermo-content-with-theory">
      <div className="thermo-card">
        <span className="eyebrow">TERMODINÁMICA / PRIMER PRINCIPIO</span>
        <h2>Calcular ΔE<sub>int</sub></h2>
        <p>Relaciona el calor transferido al sistema, el trabajo consumido en el sistema y la variación de energía interna.</p>

        <div className="temperature-input-grid latent-heat-grid">
          <label>
            <span>Calor Q</span>
            <input type="number" step="any" value={values.heat} onChange={event => update({ heat: event.target.value })} />
            <small>J</small>
          </label>
          <label>
            <span>Trabajo W</span>
            <input type="number" step="any" value={values.work} onChange={event => update({ work: event.target.value })} />
            <small>J · consumido en el sistema</small>
          </label>
        </div>

        {result.error && <div className="heating-curve-error" role="alert">{result.error}</div>}

        <div className="temperature-results latent-heat-result">
          <article className="source">
            <span>ΔU = ΔE<sub>int</sub></span>
            <strong>{formatEnergy(result.internalEnergyChange)}</strong>
            <small>J</small>
          </article>
          <article>
            <span>Equivalente</span>
            <strong>{formatEnergy(result.internalEnergyChange / 1000)}</strong>
            <small>kJ</small>
          </article>
          <article>
            <span>Interpretación</span>
            <strong className="result-note">{interpretation}</strong>
            <small>según el signo de ΔE<sub>int</sub></small>
          </article>
        </div>
      </div>
      <FirstLawTheoryCard />
    </div>
  );
}

function FirstLawTheoryCard() {
  return (
    <aside className="theory-card" aria-label="Teoría de la primera ley de la termodinámica">
      <span className="eyebrow">TEORÍA</span>
      <h3>Primera ley de la termodinámica</h3>
      <p>La primera ley de la termodinámica establece que, cuando un sistema se somete a un cambio de un estado a otro, el cambio en su energía interna es</p>
      <div className="theory-main-formula"><span>ΔE<sub>int</sub> = Q + W</span></div>
      <p>donde <code>Q</code> es la energía transferida al sistema por calor y <code>W</code> es el trabajo consumido en el sistema.</p>

      <footer>
        <span>Referencia</span>
        <strong>Serway y Jewett, Física para ciencias e ingeniería, Volumen 1, 7.ª edición.</strong>
        <small>Capítulo 20, Sección 20.5: Primera ley de la termodinámica.</small>
      </footer>
    </aside>
  );
}

function calculateIdealGas(values) {
  const initialVolume = Number(values.initialVolume);
  const finalVolume = Number(values.finalVolume);
  const initialPressure = Number(values.initialPressure);
  const initialTemperatureCelsius = Number(values.initialTemperature);
  const finalTemperatureCelsius = Number(values.finalTemperature);
  const initialTemperatureKelvin = initialTemperatureCelsius + 273.15;
  const finalTemperatureKelvin = finalTemperatureCelsius + 273.15;
  const gasConstant = 8.314;
  const literToCubicMeter = 0.001;
  const atmosphereToPascal = 101325;

  if (![initialVolume, finalVolume, initialPressure, initialTemperatureCelsius, finalTemperatureCelsius].every(Number.isFinite)) {
    return { finalPressureAtm: NaN, finalPressurePa: NaN, moles: NaN, initialTemperatureKelvin, finalTemperatureKelvin, error: 'Completá todos los campos con valores numéricos.' };
  }
  if (initialVolume <= 0 || finalVolume <= 0 || initialPressure <= 0 || initialTemperatureKelvin <= 0 || finalTemperatureKelvin <= 0) {
    return { finalPressureAtm: NaN, finalPressurePa: NaN, moles: NaN, initialTemperatureKelvin, finalTemperatureKelvin, error: 'Los volúmenes, la presión y las temperaturas absolutas deben ser positivos.' };
  }

  const initialPressurePa = initialPressure * atmosphereToPascal;
  const initialVolumeCubicMeters = initialVolume * literToCubicMeter;
  const finalPressureAtm = (initialPressure * initialVolume * finalTemperatureKelvin) / (initialTemperatureKelvin * finalVolume);

  return {
    finalPressureAtm,
    finalPressurePa: finalPressureAtm * atmosphereToPascal,
    moles: (initialPressurePa * initialVolumeCubicMeters) / (gasConstant * initialTemperatureKelvin),
    initialTemperatureKelvin,
    finalTemperatureKelvin,
    error: null
  };
}

function IdealGasCalculator({ values, result, onValues }) {
  const update = (patch) => onValues(current => ({ ...current, ...patch }));

  return (
    <div className="thermo-content-with-theory">
      <div className="thermo-card equilibrium-card">
        <span className="eyebrow">GASES / ECUACIÓN DE ESTADO</span>
        <h2>Gas ideal</h2>
        <p>Calcula la presión final mediante la ley combinada de los gases y los moles con la ecuación de estado.</p>

        <div className="temperature-input-grid heating-curve-grid">
          <label>
            <span>Volumen inicial V<sub>i</sub></span>
            <input type="number" step="any" value={values.initialVolume} onChange={event => update({ initialVolume: event.target.value })} />
            <small>L</small>
          </label>
          <label>
            <span>Presión inicial P<sub>i</sub></span>
            <input type="number" step="any" value={values.initialPressure} onChange={event => update({ initialPressure: event.target.value })} />
            <small>atm</small>
          </label>
          <label>
            <span>Temperatura inicial T<sub>i</sub></span>
            <input type="number" step="any" value={values.initialTemperature} onChange={event => update({ initialTemperature: event.target.value })} />
            <small>°C</small>
          </label>
          <label>
            <span>Volumen final V<sub>f</sub></span>
            <input type="number" step="any" value={values.finalVolume} onChange={event => update({ finalVolume: event.target.value })} />
            <small>L</small>
          </label>
          <label>
            <span>Temperatura final T<sub>f</sub></span>
            <input type="number" step="any" value={values.finalTemperature} onChange={event => update({ finalTemperature: event.target.value })} />
            <small>°C</small>
          </label>
        </div>

        {result.error && <div className="heating-curve-error" role="alert">{result.error}</div>}

        <div className="temperature-results equilibrium-result">
          <article className="source">
            <span>Presión final P<sub>f</sub></span>
            <strong>{formatEnergy(result.finalPressureAtm)}</strong>
            <small>atm</small>
          </article>
          <article>
            <span>Moles n</span>
            <strong>{formatEnergy(result.moles)}</strong>
            <small>mol</small>
          </article>
          <article>
            <span>Temperaturas absolutas</span>
            <strong className="result-note">{formatEnergy(result.initialTemperatureKelvin)} K → {formatEnergy(result.finalTemperatureKelvin)} K</strong>
            <small>T = T<sub>C</sub> + 273.15</small>
          </article>
        </div>
      </div>
      <IdealGasTheoryCard />
    </div>
  );
}

function IdealGasTheoryCard() {
  return (
    <aside className="theory-card" aria-label="Teoría de gas ideal">
      <span className="eyebrow">TEORÍA</span>
      <h3>Descripción macroscópica de un gas ideal</h3>
      <p>Un gas ideal es aquel para el cual <code>PV/nT</code> es constante. Un gas ideal se describe mediante la ecuación de estado,</p>
      <code className="theory-main-formula">PV = nRT</code>
      <p>donde <code>n</code> es igual al número de moles del gas, <code>P</code> es su presión, <code>V</code> su volumen, <code>R</code> la constante universal de los gases (8.314 J/mol K) y <code>T</code> la temperatura absoluta del gas. Un gas real se comporta casi como un gas ideal si tiene una densidad baja.</p>

      <footer>
        <span>Referencia</span>
        <strong>Serway y Jewett, Física para ciencias e ingeniería, Volumen 1, 7.ª edición.</strong>
        <small>Capítulo 19, Sección 19.5: Descripción macroscópica de un gas ideal.</small>
      </footer>
    </aside>
  );
}

function calculateIsothermalProcess(values) {
  const moles = Number(values.moles);
  const temperature = Number(values.temperature);
  const initialVolume = Number(values.initialVolume);
  const finalVolume = Number(values.finalVolume);
  const gasConstant = 8.314;

  if (![moles, temperature, initialVolume, finalVolume].every(Number.isFinite)) {
    return { work: NaN, heat: NaN, internalEnergyChange: NaN, volumeRatio: NaN, error: 'Completá todos los campos con valores numéricos.' };
  }
  if (moles <= 0 || temperature <= 0 || initialVolume <= 0 || finalVolume <= 0) {
    return { work: NaN, heat: NaN, internalEnergyChange: NaN, volumeRatio: NaN, error: 'Los moles, la temperatura absoluta y los volúmenes deben ser positivos.' };
  }

  const volumeRatio = finalVolume / initialVolume;
  const work = moles * gasConstant * temperature * Math.log(volumeRatio);

  return {
    work,
    heat: -work,
    internalEnergyChange: 0,
    volumeRatio,
    error: null
  };
}

function IsothermalProcessCalculator({ values, result, onValues }) {
  const update = (patch) => onValues(current => ({ ...current, ...patch }));
  const processType = Number(values.finalVolume) > Number(values.initialVolume)
    ? 'Expansión isotérmica'
    : Number(values.finalVolume) < Number(values.initialVolume)
      ? 'Compresión isotérmica'
      : 'Volumen constante';

  return (
    <div className="thermo-content-with-theory">
      <div className="thermo-card equilibrium-card">
        <span className="eyebrow">TERMODINÁMICA / GAS IDEAL</span>
        <h2>Proceso isotérmico</h2>
        <p>Calcula trabajo y calor para un gas ideal que cambia de volumen a temperatura constante.</p>

        <div className="temperature-input-grid sensible-heat-grid">
          <label>
            <span>Moles n</span>
            <input type="number" step="any" value={values.moles} onChange={event => update({ moles: event.target.value })} />
            <small>mol</small>
          </label>
          <label>
            <span>Temperatura T</span>
            <input type="number" step="any" value={values.temperature} onChange={event => update({ temperature: event.target.value })} />
            <small>K</small>
          </label>
          <label>
            <span>Volumen inicial V<sub>i</sub></span>
            <input type="number" step="any" value={values.initialVolume} onChange={event => update({ initialVolume: event.target.value })} />
            <small>L</small>
          </label>
          <label>
            <span>Volumen final V<sub>f</sub></span>
            <input type="number" step="any" value={values.finalVolume} onChange={event => update({ finalVolume: event.target.value })} />
            <small>L</small>
          </label>
        </div>

        {result.error && <div className="heating-curve-error" role="alert">{result.error}</div>}

        <div className="temperature-results equilibrium-result">
          <article className="source">
            <span>Trabajo W</span>
            <strong>{formatEnergy(result.work)}</strong>
            <small>J</small>
          </article>
          <article>
            <span>Calor Q</span>
            <strong>{formatEnergy(result.heat)}</strong>
            <small>J</small>
          </article>
          <article>
            <span>ΔE<sub>int</sub></span>
            <strong>{formatEnergy(result.internalEnergyChange)}</strong>
            <small>J · {processType}</small>
          </article>
        </div>
      </div>
      <IsothermalProcessTheoryCard />
    </div>
  );
}

function IsothermalProcessTheoryCard() {
  return (
    <aside className="theory-card" aria-label="Teoría de proceso isotérmico">
      <span className="eyebrow">TEORÍA</span>
      <h3>Proceso isotérmico</h3>
      <p>Un proceso que se presenta a temperatura constante se llama proceso isotérmico.</p>
      <p>En un proceso isotérmico que involucra un gas ideal, ΔE<sub>int</sub> =0.</p>
      <p>Para un proceso isotérmico, se concluye de la primera ley que la transferencia de energía <code>Q</code> debe ser igual al negativo del trabajo consumido en el gas; es decir, <code>Q=−W</code>.</p>
      <p>El trabajo consumido en un gas ideal durante un proceso isotérmico es</p>
      <div className="theory-main-formula"><span>W = nRT ln(<VolumeRatioFormula />)</span></div>

      <footer>
        <span>Referencia</span>
        <strong>Serway y Jewett, Física para ciencias e ingeniería, Volumen 1, 7.ª edición.</strong>
        <small>Capítulo 20, Sección 20.6: Algunas aplicaciones de la primera ley de la termodinámica. Ecuación (20.14).</small>
      </footer>
    </aside>
  );
}

function calculateIsobaricProcess(values) {
  const pressure = Number(values.pressure);
  const initialVolume = Number(values.initialVolume);
  const finalVolume = Number(values.finalVolume);
  const atmosphereToPascal = 101325;
  const literToCubicMeter = 0.001;

  if (![pressure, initialVolume, finalVolume].every(Number.isFinite)) {
    return { work: NaN, deltaVolume: NaN, error: 'Completá todos los campos con valores numéricos.' };
  }
  if (pressure <= 0 || initialVolume <= 0 || finalVolume <= 0) {
    return { work: NaN, deltaVolume: NaN, error: 'La presión y los volúmenes deben ser positivos.' };
  }

  const deltaVolume = finalVolume - initialVolume;
  const work = -(pressure * atmosphereToPascal) * (deltaVolume * literToCubicMeter);

  return {
    work,
    deltaVolume,
    error: null
  };
}

function IsobaricProcessCalculator({ values, result, onValues }) {
  const update = (patch) => onValues(current => ({ ...current, ...patch }));
  const processType = Number(values.finalVolume) > Number(values.initialVolume)
    ? 'Expansión isobárica'
    : Number(values.finalVolume) < Number(values.initialVolume)
      ? 'Compresión isobárica'
      : 'Volumen constante';

  return (
    <div className="thermo-content-with-theory">
      <div className="thermo-card">
        <span className="eyebrow">TERMODINÁMICA / PRESIÓN CONSTANTE</span>
        <h2>Proceso isobárico</h2>
        <p>Calcula el trabajo consumido en el gas cuando cambia su volumen a presión constante.</p>

        <div className="temperature-input-grid sensible-heat-grid">
          <label>
            <span>Presión P</span>
            <input type="number" step="any" value={values.pressure} onChange={event => update({ pressure: event.target.value })} />
            <small>atm</small>
          </label>
          <label>
            <span>Volumen inicial V<sub>i</sub></span>
            <input type="number" step="any" value={values.initialVolume} onChange={event => update({ initialVolume: event.target.value })} />
            <small>L</small>
          </label>
          <label>
            <span>Volumen final V<sub>f</sub></span>
            <input type="number" step="any" value={values.finalVolume} onChange={event => update({ finalVolume: event.target.value })} />
            <small>L</small>
          </label>
        </div>

        {result.error && <div className="heating-curve-error" role="alert">{result.error}</div>}

        <div className="temperature-results sensible-heat-result">
          <article className="source">
            <span>Trabajo W</span>
            <strong>{formatEnergy(result.work)}</strong>
            <small>J</small>
          </article>
          <article>
            <span>ΔV</span>
            <strong>{formatEnergy(result.deltaVolume)}</strong>
            <small>L</small>
          </article>
          <article>
            <span>Proceso</span>
            <strong className="result-note">{processType}</strong>
            <small>presión constante</small>
          </article>
        </div>
      </div>
      <IsobaricProcessTheoryCard />
    </div>
  );
}

function IsobaricProcessTheoryCard() {
  return (
    <aside className="theory-card" aria-label="Teoría de proceso isobárico">
      <span className="eyebrow">TEORÍA</span>
      <h3>Proceso isobárico</h3>
      <p>Un proceso que se presenta a presión constante se llama proceso isobárico.</p>
      <p>El trabajo consumido en el gas en un proceso isobárico es simplemente</p>
      <div className="theory-main-formula"><span>W = −P(V<sub>f</sub> − V<sub>i</sub>)</span></div>
      <p>donde <code>P</code> es la presión constante del gas durante el proceso.</p>

      <footer>
        <span>Referencia</span>
        <strong>Serway y Jewett, Física para ciencias e ingeniería, Volumen 1, 7.ª edición.</strong>
        <small>Capítulo 20, Sección 20.6: Algunas aplicaciones de la primera ley de la termodinámica. Ecuación (20.12).</small>
      </footer>
    </aside>
  );
}

function calculateAdiabaticProcess(values) {
  const initialPressure = Number(values.initialPressure);
  const initialVolume = Number(values.initialVolume);
  const finalVolume = Number(values.finalVolume);
  const gamma = Number(values.gamma);
  const atmosphereToPascal = 101325;
  const literToCubicMeter = 0.001;

  if (![initialPressure, initialVolume, finalVolume, gamma].every(Number.isFinite)) {
    return { finalPressureAtm: NaN, finalPressurePa: NaN, work: NaN, internalEnergyChange: NaN, heat: 0, error: 'Completá todos los campos con valores numéricos.' };
  }
  if (initialPressure <= 0 || initialVolume <= 0 || finalVolume <= 0 || gamma <= 1) {
    return { finalPressureAtm: NaN, finalPressurePa: NaN, work: NaN, internalEnergyChange: NaN, heat: 0, error: 'La presión, los volúmenes y γ deben ser positivos; γ debe ser mayor que 1.' };
  }

  const finalPressureAtm = initialPressure * (initialVolume / finalVolume) ** gamma;
  const initialPressurePa = initialPressure * atmosphereToPascal;
  const finalPressurePa = finalPressureAtm * atmosphereToPascal;
  const initialVolumeCubicMeters = initialVolume * literToCubicMeter;
  const finalVolumeCubicMeters = finalVolume * literToCubicMeter;
  const work = (finalPressurePa * finalVolumeCubicMeters - initialPressurePa * initialVolumeCubicMeters) / (gamma - 1);

  return {
    finalPressureAtm,
    finalPressurePa,
    work,
    internalEnergyChange: work,
    heat: 0,
    error: null
  };
}

function AdiabaticProcessCalculator({ values, result, onValues }) {
  const update = (patch) => onValues(current => ({ ...current, ...patch }));
  const processType = Number(values.finalVolume) > Number(values.initialVolume)
    ? 'Expansión adiabática'
    : Number(values.finalVolume) < Number(values.initialVolume)
      ? 'Compresión adiabática'
      : 'Volumen constante';

  return (
    <div className="thermo-content-with-theory">
      <div className="thermo-card equilibrium-card">
        <span className="eyebrow">TERMODINÁMICA / GAS IDEAL</span>
        <h2>Proceso adiabático</h2>
        <p>Calcula la presión final, el trabajo y la variación de energía interna cuando no hay intercambio de calor.</p>

        <div className="temperature-input-grid sensible-heat-grid">
          <label>
            <span>Presión inicial P<sub>i</sub></span>
            <input type="number" step="any" value={values.initialPressure} onChange={event => update({ initialPressure: event.target.value })} />
            <small>atm</small>
          </label>
          <label>
            <span>Volumen inicial V<sub>i</sub></span>
            <input type="number" step="any" value={values.initialVolume} onChange={event => update({ initialVolume: event.target.value })} />
            <small>L</small>
          </label>
          <label>
            <span>Volumen final V<sub>f</sub></span>
            <input type="number" step="any" value={values.finalVolume} onChange={event => update({ finalVolume: event.target.value })} />
            <small>L</small>
          </label>
          <label>
            <span>Coeficiente γ</span>
            <input type="number" step="any" value={values.gamma} onChange={event => update({ gamma: event.target.value })} />
            <small>sin unidad</small>
          </label>
        </div>

        {result.error && <div className="heating-curve-error" role="alert">{result.error}</div>}

        <div className="temperature-results equilibrium-result">
          <article className="source">
            <span>Presión final P<sub>f</sub></span>
            <strong>{formatEnergy(result.finalPressureAtm)}</strong>
            <small>atm</small>
          </article>
          <article>
            <span>W = ΔE<sub>int</sub></span>
            <strong>{formatEnergy(result.work)}</strong>
            <small>J</small>
          </article>
          <article>
            <span>Proceso</span>
            <strong className="result-note">{processType}</strong>
            <small>Q = 0 · ΔE<sub>int</sub> = W</small>
          </article>
        </div>
      </div>
      <AdiabaticProcessTheoryCard />
    </div>
  );
}

function AdiabaticProcessTheoryCard() {
  return (
    <aside className="theory-card" aria-label="Teoría de proceso adiabático">
      <span className="eyebrow">TEORÍA</span>
      <h3>Proceso adiabático</h3>
      <p>Un proceso adiabático es aquel durante el cual no entra ni sale energía del sistema por calor; <code>Q=0</code>.</p>
      <p>Al aplicar la primera ley de la termodinámica a un proceso adiabático se obtiene</p>
      <div className="theory-main-formula"><span>ΔE<sub>int</sub> = W</span></div>
      <p>proceso adiabático.</p>
      <p>Si un gas ideal se somete a una expansión o compresión adiabáticos, la primera ley de la termodinámica, junto con la ecuación de estado, muestra que</p>
      <div className="theory-main-formula"><span>PV<sup>γ</sup> = constante</span></div>
      <p>Aplicado a dos estados, esto es</p>
      <div className="theory-main-formula"><span>P<sub>i</sub>V<sub>i</sub><sup>γ</sup> = P<sub>f</sub>V<sub>f</sub><sup>γ</sup></span></div>

      <footer>
        <span>Referencia</span>
        <strong>Serway y Jewett, Física para ciencias e ingeniería, Volumen 1, 7.ª edición.</strong>
        <small>Capítulo 20, Sección 20.6: Algunas aplicaciones de la primera ley de la termodinámica, ecuación (20.11). Capítulo 21, Sección 21.3: Procesos adiabáticos para un gas ideal, ecuaciones (21.18) y (21.19).</small>
      </footer>
    </aside>
  );
}

function calculateMechanicalEquivalent(values) {
  const mass = Number(values.mass);
  const velocity = Number(values.velocity);
  const height = Number(values.height);
  const specificHeat = Number(values.specificHeat);
  const gravity = 9.81;
  const sourceValue = values.mode === 'height' ? height : velocity;

  if (![mass, sourceValue, specificHeat].every(Number.isFinite)) {
    return { energy: NaN, calories: NaN, deltaTemperature: NaN, error: 'Completá todos los campos con valores numéricos.' };
  }
  if (mass <= 0 || specificHeat <= 0 || sourceValue < 0) {
    return { energy: NaN, calories: NaN, deltaTemperature: NaN, error: 'La masa y el calor específico deben ser positivos; la velocidad o altura no puede ser negativa.' };
  }

  const energy = values.mode === 'height'
    ? mass * gravity * height
    : 0.5 * mass * velocity ** 2;

  return {
    energy,
    calories: energy / 4.186,
    deltaTemperature: energy / (mass * specificHeat),
    error: null
  };
}

function MechanicalEquivalentCalculator({ values, result, onValues }) {
  const update = (patch) => onValues(current => ({ ...current, ...patch }));
  const sourceLabel = values.mode === 'height' ? 'Energía potencial' : 'Energía cinética';
  const sourceFormula = values.mode === 'height' ? 'E = mgh' : 'E = 1/2 mv²';

  return (
    <div className="thermo-content-with-theory">
      <div className="thermo-card">
        <span className="eyebrow">CALOR Y ENERGÍA INTERNA</span>
        <h2>Equivalente mecánico del calor</h2>
        <p>Calcula el aumento de temperatura cuando una energía mecánica se transforma íntegramente en calor.</p>

        <div className="mode-toggle" role="group" aria-label="Origen de energía mecánica">
          <button type="button" className={values.mode === 'velocity' ? 'active' : ''} onClick={() => update({ mode: 'velocity' })}>Velocidad</button>
          <button type="button" className={values.mode === 'height' ? 'active' : ''} onClick={() => update({ mode: 'height' })}>Altura</button>
        </div>

        <div className="temperature-input-grid sensible-heat-grid">
          <label>
            <span>Masa m</span>
            <input type="number" step="any" value={values.mass} onChange={event => update({ mass: event.target.value })} />
            <small>kg</small>
          </label>
          {values.mode === 'height' ? (
            <label>
              <span>Altura h</span>
              <input type="number" step="any" value={values.height} onChange={event => update({ height: event.target.value })} />
              <small>m</small>
            </label>
          ) : (
            <label>
              <span>Velocidad v</span>
              <input type="number" step="any" value={values.velocity} onChange={event => update({ velocity: event.target.value })} />
              <small>m/s</small>
            </label>
          )}
          <label>
            <span>Calor específico c</span>
            <input type="number" step="any" value={values.specificHeat} onChange={event => update({ specificHeat: event.target.value })} />
            <small>J/(kg·°C)</small>
          </label>
        </div>

        {result.error && <div className="heating-curve-error" role="alert">{result.error}</div>}

        <div className="temperature-results sensible-heat-result">
          <article className="source">
            <span>Aumento ΔT</span>
            <strong>{formatEnergy(result.deltaTemperature)}</strong>
            <small>°C</small>
          </article>
          <article>
            <span>{sourceLabel}</span>
            <strong>{formatEnergy(result.energy)}</strong>
            <small>J · {sourceFormula}</small>
          </article>
          <article>
            <span>Equivalente</span>
            <strong>{formatEnergy(result.calories)}</strong>
            <small>cal</small>
          </article>
        </div>
      </div>
      <MechanicalEquivalentTheoryCard />
    </div>
  );
}

function MechanicalEquivalentTheoryCard() {
  return (
    <aside className="theory-card" aria-label="Teoría del equivalente mecánico del calor">
      <span className="eyebrow">TEORÍA</span>
      <h3>Equivalente mecánico del calor</h3>
      <p>Joule encontró que la pérdida en energía mecánica es proporcional al producto de la masa del agua y el aumento en la temperatura del agua.</p>
      <p>La constante de proporcionalidad que encontró era de aproximadamente 4.18 J/g °C. Por lo tanto, 4.18 J de energía mecánica elevan la temperatura de 1 g de agua en 1°C.</p>
      <p>Mediciones más precisas tomadas más tarde demostraron que la proporcionalidad era de 4.186 J/g °C cuando la temperatura del agua se elevaba de 14.5°C a 15.5°C. Aquí se adopta este valor de “caloría de 15 grados”:</p>
      <code className="theory-main-formula">1 cal = 4.186 J</code>
      <p>Esta igualdad se conoce, por razones meramente históricas, como el equivalente mecánico del calor.</p>
      <code className="theory-main-formula">E mecánica = Q = m c ΔT</code>

      <footer>
        <span>Referencia</span>
        <strong>Serway y Jewett, Física para ciencias e ingeniería, Volumen 1, 7.ª edición.</strong>
        <small>Capítulo 20, Sección 20.1: Calor y energía interna.</small>
      </footer>
    </aside>
  );
}

function SensibleHeatCalculator({ mass, specificHeat, deltaTemperature, sensibleHeat, onMass, onSpecificHeat, onDeltaTemperature }) {
  const heatSense = Math.abs(sensibleHeat) < 1e-12
    ? 'Sin cambio térmico neto'
    : sensibleHeat > 0
      ? 'La sustancia absorbe calor'
      : 'La sustancia cede calor';

  return (
    <div className="thermo-content-with-theory">
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
      <SensibleHeatTheoryCard />
    </div>
  );
}

function SensibleHeatTheoryCard() {
  return (
    <aside className="theory-card" aria-label="Teoría de calor sensible">
      <span className="eyebrow">TEORÍA</span>
      <h3>Calor específico y calorimetría</h3>
      <p>El calor específico <code>c</code> de una sustancia es la capacidad térmica por unidad de masa. Por lo tanto, si a una muestra de una sustancia con masa <code>m</code> se le transfiere energía <code>Q</code> y la temperatura de la muestra cambia en <code>ΔT</code>, el calor específico de la sustancia es</p>

      <div className="theory-equation" aria-label="c igual Q sobre m por delta T">
        <span>c =</span>
        <div>
          <strong>Q</strong>
          <i></i>
          <strong>m ΔT</strong>
        </div>
      </div>

      <p>A partir de esta definición, es factible relacionar la energía <code>Q</code> transferida entre una muestra de masa <code>m</code> de un material y sus alrededores con un cambio de temperatura <code>ΔT</code> como</p>
      <code className="theory-main-formula">Q = m c ΔT</code>

      <footer>
        <span>Referencia</span>
        <strong>Serway y Jewett, Física para ciencias e ingeniería, Volumen 1, 7.ª edición.</strong>
        <small>Capítulo 20, Sección 20.2: Calor específico y calorimetría.</small>
      </footer>
    </aside>
  );
}

function LatentHeatCalculator({ mass, latentHeat, totalHeat, onMass, onLatentHeat }) {
  return (
    <div className="thermo-content-with-theory">
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
      <LatentHeatTheoryCard />
    </div>
  );
}

function LatentHeatTheoryCard() {
  return (
    <aside className="theory-card" aria-label="Teoría de calor latente">
      <span className="eyebrow">TEORÍA</span>
      <h3>Calor latente</h3>
      <p>Si se requiere transferir una cantidad <code>Q</code> de energía para cambiar la fase de una masa <code>m</code> de una sustancia, el calor latente de la sustancia se define como</p>

      <div className="theory-equation" aria-label="L igual Q sobre m">
        <span>L =</span>
        <div>
          <strong>Q</strong>
          <i></i>
          <strong>m</strong>
        </div>
      </div>

      <p>A partir de la definición de calor latente, y de nuevo al elegir el calor como el mecanismo de transferencia de energía, la energía requerida para cambiar la fase de una masa dada <code>m</code> de una sustancia pura es</p>
      <code className="theory-main-formula">Q = ±mL</code>

      <footer>
        <span>Referencia</span>
        <strong>Serway y Jewett, Física para ciencias e ingeniería, Volumen 1, 7.ª edición.</strong>
        <small>Capítulo 20, Sección 20.3: Calor latente.</small>
      </footer>
    </aside>
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
    <div className="thermo-content-with-theory">
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
            <span>Q<sub>i</sub> J</span>
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
      <ThermalEquilibriumTheoryCard />
    </div>
  );
}

function ThermalEquilibriumTheoryCard() {
  return (
    <aside className="theory-card" aria-label="Teoría de calorimetría">
      <span className="eyebrow">TEORÍA</span>
      <h3>Calorimetría</h3>
      <p>Una técnica para medir calor específico involucra el calentamiento de una muestra en alguna temperatura conocida <code>Tx</code>, al colocarla en un recipiente que contenga agua de masa conocida y temperatura <code>Tw &lt; Tx</code>, y medir la temperatura del agua después de que se logra el equilibrio.</p>
      <p>Esta técnica se llama calorimetría, y los dispositivos donde se presenta esta transferencia de energía se llaman calorímetros.</p>
      <p>Si el sistema de la muestra y el agua está aislado, el principio de conservación de energía requiere que la cantidad de energía que sale de la muestra (de calor específico desconocido) sea igual a la cantidad de energía que entra al agua.</p>
      <p>La conservación de energía permite escribir la representación matemática de este enunciado energético como</p>
      <code className="theory-main-formula">Q frío = -Q caliente</code>

      <footer>
        <span>Referencia</span>
        <strong>Serway y Jewett, Física para ciencias e ingeniería, Volumen 1, 7.ª edición.</strong>
        <small>Capítulo 20, Sección 20.2: Calor específico y calorimetría.</small>
      </footer>
    </aside>
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
    <div className="thermo-content-with-theory">
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

        <HeatingCurveGraph values={values} result={result} />

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
            <code><HeatingStageFormula formula={stage.formula} /></code>
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
      <HeatingCurveTheoryCard />
    </div>
  );
}

function HeatingCurveGraph({ values, result }) {
  const ti = Number(values.initialTemperature);
  const tm = Number(values.meltingPoint);
  const tb = Number(values.boilingPoint);
  const tf = Number(values.finalTemperature);
  const temperatures = [ti, tm, tb, tf, ...result.stages.flatMap(stage => [stage.from, stage.to])].filter(Number.isFinite);
  const minTemperature = Math.min(...temperatures);
  const maxTemperature = Math.max(...temperatures);
  const temperatureRange = Math.max(maxTemperature - minTemperature, 1);
  const points = [{ q: 0, temperature: ti }];

  result.stages.forEach(stage => {
    const previousQ = points[points.length - 1].q;
    points.push({ q: previousQ + stage.heat, temperature: stage.to });
  });

  const qValues = points.map(point => point.q);
  const minQ = Math.min(...qValues, 0);
  const maxQ = Math.max(...qValues, 1);
  const qRange = Math.max(maxQ - minQ, 1);
  const width = 760;
  const height = 300;
  const padding = { left: 58, right: 22, top: 22, bottom: 46 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const x = (q) => padding.left + ((q - minQ) / qRange) * plotWidth;
  const y = (temperature) => padding.top + ((maxTemperature - temperature) / temperatureRange) * plotHeight;
  const linePoints = points.map(point => `${x(point.q)},${y(point.temperature)}`).join(' ');
  const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
  const visiblePointIndexes = points
    .map((_, index) => index)
    .filter((index) => index === 0 || index === points.length - 1 || result.stages[index - 1]?.from === result.stages[index - 1]?.to);
  const xTickIndexes = points
    .map((_, index) => index)
    .filter((index) => index === 0 || index === points.length - 1);
  const yTickValues = [minTemperature, tm, tb, maxTemperature]
    .filter((value, index, list) => Number.isFinite(value) && list.indexOf(value) === index);

  const stageRegions = result.stages.map((stage, index) => {
    const startQ = points[index].q;
    const endQ = points[index + 1].q;
    const left = Math.min(x(startQ), x(endQ));
    const regionWidth = Math.max(Math.abs(x(endQ) - x(startQ)), 2);
    const isLatent = stage.from === stage.to;

    return (
      <rect
        key={`${stage.name}-${index}`}
        className={isLatent ? 'latent-region' : 'sensible-region'}
        x={left}
        y={padding.top}
        width={regionWidth}
        height={plotHeight}
      />
    );
  });

  return (
    <div className="heating-graph-card" aria-label="Gráfico de curva de calentamiento">
      <div className="heating-graph-head">
        <span>Curva de calentamiento</span>
        <small>Energía acumulada vs temperatura</small>
      </div>
      {result.stages.length ? (
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Temperatura en función de la energía agregada">
          <g className="curve-regions">{stageRegions}</g>
          <line className="graph-axis" x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + plotHeight} />
          <line className="graph-axis" x1={padding.left} y1={padding.top + plotHeight} x2={padding.left + plotWidth} y2={padding.top + plotHeight} />
          {yTickValues.map(value => (
            <g key={value}>
              <line className="graph-guide" x1={padding.left} x2={padding.left + plotWidth} y1={y(value)} y2={y(value)} />
              <text className="graph-tick" x={padding.left - 8} y={y(value) + 3} textAnchor="end">{formatCompactEnergy(value)}</text>
            </g>
          ))}
          {xTickIndexes.map((index) => {
            const point = points[index];
            const labelX = x(point.q);
            const isFirst = index === 0;
            const isLast = index === points.length - 1;

            return (
              <g key={`${point.q}-${index}-tick`}>
                <line className="graph-tick-line" x1={labelX} x2={labelX} y1={padding.top + plotHeight} y2={padding.top + plotHeight + 7} />
                <text className="graph-tick" x={labelX} y={padding.top + plotHeight + 22} textAnchor={isFirst ? 'start' : isLast ? 'end' : 'middle'}>{formatCompactEnergy(point.q)}</text>
              </g>
            );
          })}
          {visiblePointIndexes.map((index) => {
            const point = points[index];
            const pointX = x(point.q);
            const pointY = y(point.temperature);
            const isLeftEdge = pointX < padding.left + 24;
            const isRightEdge = pointX > padding.left + plotWidth - 24;

            return (
              <text
                key={`${point.q}-${index}-label`}
                className="graph-point-label"
                x={isLeftEdge ? pointX + 8 : isRightEdge ? pointX - 8 : pointX}
                y={Math.max(pointY - 10, padding.top + 10)}
                textAnchor={isLeftEdge ? 'start' : isRightEdge ? 'end' : 'middle'}
              >
                {labels[index] ?? index + 1}
              </text>
            );
          })}
          {points.map((point, index) => (
            <g key={`${point.q}-${index}`}>
              <circle className="curve-dot" cx={x(point.q)} cy={y(point.temperature)} r="3.5" />
            </g>
          ))}
          <polyline className="heating-curve-line" points={linePoints} />
          <text className="graph-axis-label" x={padding.left + 4} y={13}>T (°C)</text>
          <text className="graph-axis-label" x={padding.left + plotWidth - 112} y={height - 8}>Energía agregada (J)</text>
        </svg>
      ) : (
        <div className="heating-graph-empty">El gráfico aparece cuando las entradas definen una transición válida.</div>
      )}
    </div>
  );
}

function HeatingCurveTheoryCard() {
  return (
    <aside className="theory-card" aria-label="Teoría de curva de calentamiento">
      <span className="eyebrow">TEORÍA</span>
      <h3>Curva de calentamiento</h3>
      <p>Para entender el papel del calor latente en los cambios de fase, considere la energía requerida para convertir un cubo de hielo de 1.00 g de −30.0 °C a vapor a 120.0 °C. La figura 20.2 indica los resultados experimentales obtenidos cuando al cubo se le agrega gradualmente energía.</p>
      <p>La cantidad total de energía que se debe agregar... es la suma de los resultados de las cinco partes de la curva.</p>

      <footer>
        <span>Referencia</span>
        <strong>Serway y Jewett, Física para ciencias e ingeniería, Volumen 1, 7.ª edición.</strong>
        <small>Capítulo 20, Sección 20.3: Calor latente. Figura 20.2.</small>
      </footer>
    </aside>
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

function MechanicalEquivalentFormulas() {
  return (
    <section className="formula-panel" aria-label="Fórmulas utilizadas">
      <div className="formula-title"><span className="eyebrow">FÓRMULAS UTILIZADAS</span><small>Conservación de energía y equivalente mecánico del calor</small></div>
      <div className="formula-grid">
        <article>
          <h3>Equivalente mecánico</h3>
          <p><code>1 cal = 4.186 J</code></p>
          <p>Relación histórica entre caloría y joule.</p>
        </article>
        <article>
          <h3>Energía mecánica</h3>
          <p><code>E<sub>c</sub> = 1/2 m v²</code></p>
          <p><code>E<sub>p</sub> = m g h</code></p>
        </article>
        <article>
          <h3>Aumento de temperatura</h3>
          <p><code>E mecánica = Q = m c ΔT</code></p>
          <p><code>ΔT = Q / m c</code></p>
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
          <h3>Calor específico</h3>
          <p><code>c = Q / m ΔT</code></p>
          <p>Capacidad térmica por unidad de masa.</p>
        </article>
        <article>
          <h3>Energía transferida</h3>
          <p><code>Q = m c ΔT</code></p>
          <p>Relación entre la energía transferida y el cambio de temperatura.</p>
        </article>
        <article>
          <h3>Cambio de temperatura</h3>
          <p><code>ΔT = T<sub>final</sub> − T<sub>inicial</sub></code></p>
          <p><code>m</code>: masa en <code>kg</code></p>
          <p><code>c</code>: calor específico en <code>J/(kg·°C)</code> o <code>J/(kg·K)</code></p>
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
          <p><code>L = Q / m</code></p>
          <p>Energía transferida por unidad de masa durante el cambio de fase.</p>
        </article>
        <article>
          <h3>Energía requerida</h3>
          <p><code>Q = ±mL</code></p>
          <p>Se usa cuando la temperatura permanece constante y cambia el estado físico.</p>
        </article>
        <article>
          <h3>Variables</h3>
          <p><code>m</code>: masa en <code>kg</code></p>
          <p><code>L</code>: calor latente en <code>J/kg</code></p>
          <p><code>Q</code>: energía térmica en <code>J</code></p>
        </article>
      </div>
    </section>
  );
}

function FirstLawFormulas() {
  return (
    <section className="formula-panel" aria-label="Fórmulas utilizadas">
      <div className="formula-title"><span className="eyebrow">FÓRMULAS UTILIZADAS</span><small>Primera ley de la termodinámica</small></div>
      <div className="formula-grid">
        <article>
          <h3>Energía interna</h3>
          <p><code>ΔE<sub>int</sub> = Q + W</code></p>
          <p>Cambio de energía interna del sistema.</p>
        </article>
        <article>
          <h3>Calor</h3>
          <p><code>Q</code>: energía transferida al sistema por calor.</p>
          <p>Entra positiva si se transfiere al sistema.</p>
        </article>
        <article>
          <h3>Trabajo</h3>
          <p><code>W</code>: trabajo consumido en el sistema.</p>
          <p>Usa la convención de signos del libro.</p>
        </article>
      </div>
    </section>
  );
}

function IdealGasFormulas() {
  return (
    <section className="formula-panel" aria-label="Fórmulas utilizadas">
      <div className="formula-title"><span className="eyebrow">FÓRMULAS UTILIZADAS</span><small>Descripción macroscópica de un gas ideal</small></div>
      <div className="formula-grid">
        <article>
          <h3>Temperatura absoluta</h3>
          <p><code>T = T<sub>C</sub> + 273.15</code></p>
          <p>Las ecuaciones de gases usan siempre Kelvin.</p>
        </article>
        <article>
          <h3>Presión final</h3>
          <p><code>P<sub>f</sub> = P<sub>i</sub> V<sub>i</sub> T<sub>f</sub> / T<sub>i</sub> V<sub>f</sub></code></p>
          <p>Despejada de la ley combinada de los gases.</p>
        </article>
        <article>
          <h3>Moles</h3>
          <p><code>PV = nRT</code></p>
          <p><code>n = P<sub>i</sub> V<sub>i</sub> / R T<sub>i</sub></code></p>
        </article>
      </div>
    </section>
  );
}

function IsothermalProcessFormulas() {
  return (
    <section className="formula-panel" aria-label="Fórmulas utilizadas">
      <div className="formula-title"><span className="eyebrow">FÓRMULAS UTILIZADAS</span><small>Proceso isotérmico de un gas ideal</small></div>
      <div className="formula-grid">
        <article>
          <h3>Temperatura constante</h3>
          <p><code>ΔE<sub>int</sub> = 0</code></p>
          <p>Para un gas ideal en un proceso isotérmico.</p>
        </article>
        <article>
          <h3>Primera ley</h3>
          <p><code>Q = −W</code></p>
          <p>La transferencia de energía compensa el trabajo.</p>
        </article>
        <article>
          <h3>Trabajo isotérmico</h3>
          <p><code>W = n R T ln(<VolumeRatioFormula />)</code></p>
          <p><code>R = 8.314 J/(mol·K)</code></p>
        </article>
      </div>
    </section>
  );
}

function IsobaricProcessFormulas() {
  return (
    <section className="formula-panel" aria-label="Fórmulas utilizadas">
      <div className="formula-title"><span className="eyebrow">FÓRMULAS UTILIZADAS</span><small>Proceso isobárico a presión constante</small></div>
      <div className="formula-grid">
        <article>
          <h3>Presión constante</h3>
          <p><code>P = constante</code></p>
          <p>El volumen puede cambiar mientras la presión se mantiene fija.</p>
        </article>
        <article>
          <h3>Cambio de volumen</h3>
          <p><code>ΔV = V<sub>f</sub> − V<sub>i</sub></code></p>
          <p>Usa la misma unidad de volumen en ambos estados.</p>
        </article>
        <article>
          <h3>Trabajo</h3>
          <p><code>W = −P(V<sub>f</sub> − V<sub>i</sub>)</code></p>
          <p>Trabajo consumido en el gas.</p>
        </article>
      </div>
    </section>
  );
}

function AdiabaticProcessFormulas() {
  return (
    <section className="formula-panel" aria-label="Fórmulas utilizadas">
      <div className="formula-title"><span className="eyebrow">FÓRMULAS UTILIZADAS</span><small>Proceso adiabático de un gas ideal</small></div>
      <div className="formula-grid">
        <article>
          <h3>Sin intercambio de calor</h3>
          <p><code>Q = 0</code></p>
          <p><code>ΔE<sub>int</sub> = W</code></p>
        </article>
        <article>
          <h3>Relación adiabática</h3>
          <p><code>PV<sup>γ</sup> = constante</code></p>
          <p><code>P<sub>i</sub>V<sub>i</sub><sup>γ</sup> = P<sub>f</sub>V<sub>f</sub><sup>γ</sup></code></p>
        </article>
        <article>
          <h3>Presión final</h3>
          <p><code>P<sub>f</sub> = P<sub>i</sub>(V<sub>i</sub> / V<sub>f</sub>)<sup>γ</sup></code></p>
          <p>Usa la misma unidad de volumen en ambos estados.</p>
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
          <h3>Conservación de energía</h3>
          <p><code>Q frío = -Q caliente</code></p>
          <p>La energía que sale de la muestra es igual a la energía que entra al agua.</p>
        </article>
        <article>
          <h3>Calor sensible</h3>
          <p><code>Q = m c ΔT</code></p>
          <p>Se aplica a cada cuerpo mientras no cambia de fase.</p>
        </article>
        <article>
          <h3>Sistema aislado</h3>
          <p>El sistema está aislado.</p>
          <p>La transferencia de energía ocurre entre la muestra y el agua.</p>
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
          <p><code>Q = m L<sub>f</sub></code> para fusión.</p>
          <p><code>Q = m L<sub>v</sub></code> para vaporización.</p>
          <p>La temperatura permanece constante durante el cambio de fase.</p>
        </article>
        <article>
          <h3>Calor total</h3>
          <p><code>Q<sub>total</sub> = Σ Q<sub>etapas</sub></code></p>
          <p>Ejemplo: calentar sólido + fundir + calentar líquido + evaporar + calentar vapor si corresponde.</p>
        </article>
      </div>
    </section>
  );
}
