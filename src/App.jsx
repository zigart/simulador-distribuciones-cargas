import { useMemo, useState } from 'react';
import Header from './components/Header.jsx';
import RegionPanel from './components/RegionPanel.jsx';
import RegionEditor from './components/RegionEditor.jsx';
import Visualization2D from './components/Visualization2D.jsx';
import Visualization3D from './components/Visualization3D.jsx';
import ResultsPanel from './components/ResultsPanel.jsx';
import Thermodynamics from './components/Thermodynamics.jsx';
import Modal from './components/Modal.jsx';
import Toast from './components/Toast.jsx';
import { COLORS } from './physics/constants.js';
import { defaultRegionsFor, defaultSphereRegions } from './physics/defaults.js';
import { labels as labelsFor } from './physics/format.js';
import { measure, refreshRegionCharge, sortedRegions, validateRegion } from './physics/calculations.js';

const favicon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='white'/%3E%3Ctext x='32' y='42' text-anchor='middle' font-family='Arial, sans-serif' font-size='34' font-weight='800' fill='%23000000'%3EU%3C/text%3E%3C/svg%3E";

function normalizeRegions(regions, geometry) {
  return sortedRegions(regions.map(region => refreshRegionCharge(region, geometry)));
}

export default function App() {
  const [module, setModule] = useState('distributions');
  const [geometry, setGeometry] = useState('sphere');
  const [regions, setRegions] = useState(() => defaultSphereRegions());
  const [selectedId, setSelectedId] = useState(null);
  const [chargeMode, setChargeMode] = useState('total');
  const [chargeUnit, setChargeUnit] = useState(1e-9);
  const [densityUnit, setDensityUnit] = useState(1);
  const [view, setView] = useState('field');
  const [showLabels, setShowLabels] = useState(true);
  const [showMotion, setShowMotion] = useState(true);
  const [graphZoom, setGraphZoom] = useState(1);
  const [radius, setRadiusState] = useState(4);
  const [contributionsCollapsed, setContributionsCollapsed] = useState(false);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');
  const labels = useMemo(() => labelsFor(geometry), [geometry]);
  const normalizedRegions = useMemo(() => normalizeRegions(regions, geometry), [regions, geometry]);
  const selected = normalizedRegions.find(region => region.id === selectedId) || null;
  const point = useMemo(() => ({ x: radius, y: 0, z: 0 }), [radius]);
  const state = { geometry, regions: normalizedRegions, selectedId, chargeMode, chargeUnit, view, showLabels, showMotion, graphZoom, radius, point };

  function showToast(message) {
    setToast(message);
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => setToast(''), 2200);
  }

  function updateSelected(patch) {
    if (!selected) return;
    const proposal = { ...selected, ...patch };
    const error = validateRegion(proposal, normalizedRegions);
    if (error) {
      setRegions(current => current.map(region => region.id === selected.id ? proposal : region));
      return;
    }
    setRegions(current => current.map(region => {
      if (region.id !== selected.id) return region;
      const next = { ...region, ...patch };
      if (patch.material && patch.material !== 'vacuum') next.profile = 'constant';
      if (patch.material === 'vacuum') {
        next.coefficient = 0;
        next.charge = 0;
      }
      return next;
    }));
  }

  function changeMaterial(material) {
    if (!selected) return;
    const previousCharge = selected.charge;
    const proposal = { ...selected, material, profile: 'constant' };
    if (material === 'vacuum') proposal.coefficient = 0;
    const error = validateRegion(proposal, normalizedRegions);
    if (error) {
      showToast(error);
      return;
    }
    setRegions(current => current.map(region => {
      if (region.id !== selected.id) return region;
      const next = { ...region, material, profile: 'constant' };
      if (material === 'vacuum') {
        next.coefficient = 0;
        next.charge = 0;
      } else if (chargeMode === 'total') {
        next.charge = previousCharge;
        next.coefficient = previousCharge / Math.max(measure(next, geometry), 1e-9);
      }
      return next;
    }));
  }

  function requestGeometry(nextGeometry) {
    if (nextGeometry === geometry) return;
    setModal({
      title: 'Cambiar geometría',
      text: 'Al cambiar la geometría se reiniciarán todas las regiones de la configuración.',
      confirmLabel: 'Cambiar',
      action: () => {
        setGeometry(nextGeometry);
        setRegions(defaultRegionsFor(nextGeometry));
        setSelectedId(null);
        setRadiusState(4);
        setView(nextGeometry === 'sphere' ? view : 'model');
        setModal(null);
      }
    });
  }

  function addRegion() {
    if (normalizedRegions.length >= 10) {
      showToast('El simulador admite hasta 10 regiones.');
      return;
    }
    const inner = Math.max(0, ...normalizedRegions.map(region => region.outer));
    const id = `region-${Date.now()}`;
    const next = { id, name: `Región ${normalizedRegions.length + 1}`, inner, outer: inner + 1, material: 'insulator', profile: 'constant', coefficient: 1e-6, charge: 1e-6, color: COLORS[normalizedRegions.length % COLORS.length] };
    setRegions(current => [...current, next]);
    setSelectedId(id);
    showToast('Región agregada.');
  }

  function deleteSelected() {
    if (!selected) {
      showToast('Seleccioná una región para eliminarla.');
      return;
    }
    if (normalizedRegions.length === 1) {
      showToast('Debe existir al menos una región.');
      return;
    }
    setModal({
      title: 'Eliminar región',
      text: `¿Querés eliminar “${selected.name}”? Las demás regiones conservarán sus propiedades.`,
      confirmLabel: 'Eliminar',
      action: () => {
        setRegions(current => current.filter(region => region.id !== selected.id));
        setSelectedId(null);
        setModal(null);
      }
    });
  }

  function resetView() {
    setRadiusState(4);
    setGraphZoom(1);
  }

  return (
    <>
      <link rel="icon" href={favicon} />
      <div className="app-shell">
        <Header
          title={module === 'distributions' ? `CONFIGURACIÓN ${labels.shape} CONCÉNTRICA` : 'CONVERSOR DE TEMPERATURA'}
          module={module}
          onModuleChange={setModule}
        />
        {module === 'distributions' ? (
          <>
            <main className="workspace">
              <RegionPanel
                geometry={geometry}
                labels={labels}
                regions={normalizedRegions}
                selectedId={selectedId}
                chargeUnit={chargeUnit}
                onSelect={setSelectedId}
                onClear={() => setSelectedId(null)}
                onAdd={addRegion}
                onGeometryRequest={requestGeometry}
              />
              <section className="canvas-panel">
                <div className="canvas-toolbar">
                  <div className="segmented">
                    <button className={view === 'field' ? 'active' : ''} onClick={() => setView('field')}>Campo</button>
                    <button className={view === 'model' ? 'active' : ''} onClick={() => setView('model')}>3D</button>
                  </div>
                  <div className="canvas-actions">
                    <label className="zoom-control" htmlFor="graphZoom">
                      <span>Zoom</span>
                      <input id="graphZoom" type="range" min="0.35" max="30" step="0.05" value={graphZoom} onChange={e => setGraphZoom(Number(e.target.value) || 1)} />
                      <b>{graphZoom.toLocaleString('es-AR', { maximumFractionDigits: 1, minimumFractionDigits: 1 })}×</b>
                    </label>
                    <button className={`tool-button ${showMotion ? 'active' : ''}`} onClick={() => setShowMotion(value => !value)}>Movimiento</button>
                    <button className={`tool-button ${showLabels ? 'active' : ''}`} onClick={() => setShowLabels(value => !value)}>Dimensiones</button>
                    <button className="tool-button" title="Restablecer vista" onClick={resetView}>↺</button>
                  </div>
                </div>
                <div className={`visualization-wrap ${view === 'model' ? 'model-active' : ''}`} onClick={(event) => {
                  if (event.target === event.currentTarget) setSelectedId(null);
                }}>
                  <Visualization2D state={state} labels={labels} onSelect={setSelectedId} onClear={() => setSelectedId(null)} />
                  <Visualization3D state={state} labels={labels} />
                </div>
              </section>
              <RegionEditor
                geometry={geometry}
                labels={labels}
                regions={normalizedRegions}
                selected={selected}
                chargeMode={chargeMode}
                chargeUnit={chargeUnit}
                densityUnit={densityUnit}
                onChargeMode={setChargeMode}
                onChargeUnit={setChargeUnit}
                onDensityUnit={setDensityUnit}
                onChange={updateSelected}
                onMaterial={changeMaterial}
                onDelete={deleteSelected}
              />
            </main>
            <ResultsPanel
              state={state}
              onRadius={value => setRadiusState(Math.max(0, Number(value) || 0))}
              contributionsCollapsed={contributionsCollapsed}
              onToggleContributions={() => setContributionsCollapsed(value => !value)}
            />
          </>
        ) : (
          <Thermodynamics />
        )}
      </div>
      <Modal modal={modal} onCancel={() => setModal(null)} />
      <Toast text={toast} />
    </>
  );
}
