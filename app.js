import * as THREE from 'three';

const K = 8.9875517923e9;
const EPS = 1e-9;
const COLORS = ['#2a9d8f', '#f2a65a', '#6d8ee8', '#d8749c', '#8ab65a', '#b68558', '#5aa7bb', '#9b79c6', '#d4b642', '#6b8f71'];
const GEOMETRIES = ['sphere', 'cylinder'];
const REGION_TYPES = ['insulator', 'conductor', 'vacuum'];

function defaultSphereRegions() {
  return [
    { id: 'core', name: 'Esfera central conductora', inner: 0, outer: 1, material: 'conductor', profile: 'constant', coefficient: 5e-9 / (4 * Math.PI * 1 ** 2), charge: 5e-9, color: COLORS[0] },
    { id: 'gap', name: 'Zona de vacío', inner: 1, outer: 2, material: 'vacuum', profile: 'constant', coefficient: 0, charge: 0, color: COLORS[1] },
    { id: 'shell', name: 'Cascarón exterior conductor', inner: 2, outer: 3, material: 'conductor', profile: 'constant', coefficient: -2e-9 / (4 * Math.PI * 3 ** 2), charge: -2e-9, color: COLORS[2] }
  ];
}

function defaultCylinderRegions() {
  return [
    { id: 'core', name: 'Cilindro central conductor', inner: 0, outer: 1, material: 'conductor', profile: 'constant', coefficient: 5e-9 / (2 * Math.PI * 1), charge: 5e-9, color: COLORS[0] },
    { id: 'gap', name: 'Zona de vacío', inner: 1, outer: 2, material: 'vacuum', profile: 'constant', coefficient: 0, charge: 0, color: COLORS[1] },
    { id: 'shell', name: 'Coraza cilíndrica externa', inner: 2, outer: 3, material: 'conductor', profile: 'constant', coefficient: -2e-9 / (2 * Math.PI * 3), charge: -2e-9, color: COLORS[2] }
  ];
}

const state = {
  geometry: 'sphere',
  selectedId: null,
  chargeMode: 'total',
  view: 'field',
  showLabels: true,
  showMotion: true,
  graphZoom: 1,
  radius: 4,
  point: { x: 4, y: 0, z: 0 },
  regions: defaultSphereRegions()
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const selected = () => state.regions.find(r => r.id === state.selectedId);
const sortedRegions = () => [...state.regions].sort((a, b) => a.inner - b.inner || a.outer - b.outer);
const geometryEnabled = (geometry) => GEOMETRIES.includes(geometry);
const regionTypeEnabled = (type) => REGION_TYPES.includes(type);
const fmt = (n, digits = 3) => Number.isFinite(n) ? n.toLocaleString('es-AR', { maximumFractionDigits: digits, minimumFractionDigits: digits }) : '—';
const sci = (n) => {
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) < 1e-12) return '0';
  if (Math.abs(n) >= 1e5 || Math.abs(n) < .01) return n.toExponential(3).replace('e+', '×10^').replace('e-', '×10^-');
  return fmt(n, 3);
};
const chargeFmt = (q) => `${q >= 0 ? '+' : '−'}${fmt(Math.abs(q) * 1e6, 2)} μC`;
const lambdaFmt = (l) => `${l >= 0 ? '+' : '−'}${fmt(Math.abs(l) * 1e9, 2)} nC/m`;

function setRadius(radius) {
  state.radius = Math.max(0, Number(radius) || 0);
  state.point = { x: state.radius, y: 0, z: 0 };
}

const three = {
  ready: false,
  scene: null,
  camera: null,
  renderer: null,
  root: null,
  particles: [],
  lastSignature: ''
};

function init3d() {
  if (three.ready) return;
  const canvas = $('#visualization3d');
  three.scene = new THREE.Scene();
  three.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1000);
  three.camera.position.set(4.2, 3.2, 5.2);
  three.camera.lookAt(0, 0, 0);
  three.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  three.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  three.root = new THREE.Group();
  three.scene.add(three.root);
  three.scene.add(new THREE.HemisphereLight(0xffffff, 0xb7c4be, 1.9));
  const light = new THREE.DirectionalLight(0xffffff, 1.2);
  light.position.set(4, 6, 5);
  three.scene.add(light);
  three.scene.add(new THREE.AmbientLight(0xffffff, .55));
  three.ready = true;
  requestAnimationFrame(animate3d);
}

function disposeObject(object) {
  object.traverse(child => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach(m => {
        if (m.map) m.map.dispose();
        m.dispose();
      });
    }
  });
}

function resize3d() {
  if (!three.ready) return;
  const canvas = $('#visualization3d');
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  three.renderer.setSize(width, height, false);
  three.camera.aspect = width / height;
  three.camera.updateProjectionMatrix();
}

function makeMaterial(region, alpha = .34) {
  const isSelected = region.id === state.selectedId;
  const opacity = region.material === 'vacuum' ? .06 : region.material === 'insulator' ? Math.min(alpha, .18) : region.material === 'conductor' ? .42 : alpha;
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(region.color),
    emissive: isSelected ? new THREE.Color(0xc9f31d) : new THREE.Color(0x000000),
    emissiveIntensity: isSelected ? .22 : 0,
    transparent: true,
    opacity,
    roughness: .56,
    metalness: region.material === 'conductor' ? .22 : .02,
    transmission: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
    depthTest: true
  });
}

function lineMaterial(color = 0x17201f, opacity = .28) {
  return new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
}

function makeTextSprite(text, color = '#17201f') {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = 180 * ratio;
  canvas.height = 54 * ratio;
  context.scale(ratio, ratio);
  context.font = '700 18px DM Mono, monospace';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = 'rgba(244, 246, 243, .88)';
  context.strokeStyle = 'rgba(23, 32, 31, .18)';
  context.lineWidth = 2;
  roundRect(context, 8, 8, 164, 38, 10);
  context.fill();
  context.stroke();
  context.fillStyle = color;
  context.fillText(text, 90, 28);
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(.72, .22, 1);
  sprite.renderOrder = 20;
  return sprite;
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function add3dDimensionGuides(maxOuter) {
  const scale = 2.6 * state.graphZoom / Math.max(maxOuter, EPS);
  sortedRegions().forEach((region, index) => {
    const radius = Math.max(.02, region.outer * scale);
    const color = new THREE.Color(region.color);
    const guideMaterial = lineMaterial(color.getHex(), region.id === state.selectedId ? .95 : .46);
    const guide = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(radius, 0, 0)]),
      guideMaterial
    );
    guide.renderOrder = 14;
    three.root.add(guide);

    const marker = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.TorusGeometry(radius, .006, 8, 96)),
      lineMaterial(color.getHex(), region.id === state.selectedId ? .9 : .28)
    );
    marker.renderOrder = 13;
    three.root.add(marker);

    const label = makeTextSprite(`${labels().dim}${index + 1} = ${fmt(region.outer, 2)} m`, region.color);
    label.position.set(radius + .42, .18 + index * .18, 0);
    three.root.add(label);
  });
}

function add3dRegion(region, maxOuter) {
  const isSelected = region.id === state.selectedId;
  const sizeScale = 2.6 * state.graphZoom / Math.max(maxOuter, EPS);
  const outer = Math.max(.02, region.outer * sizeScale);
  const inner = Math.max(0, region.inner * sizeScale);
  const material = makeMaterial(region, isSelected ? .6 : .28);
  let mesh;
  let outerEdges = null;

  if (state.geometry === 'cylinder') {
    const length = Math.max(3.2, outer * 2.7);
    const geometry = new THREE.CylinderGeometry(outer, outer, length, 72, 1, false);
    mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = Math.PI / 2;
    three.root.add(mesh);
    outerEdges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), lineMaterial(isSelected ? 0xc9f31d : 0x17201f, isSelected ? .95 : region.material === 'insulator' ? .34 : .22));
    if (inner > EPS) {
      const innerRing = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.CylinderGeometry(inner, inner, length * 1.01, 72, 1, true)),
        lineMaterial(0x17201f, .3)
      );
      innerRing.rotation.x = Math.PI / 2;
      three.root.add(innerRing);
    }
  } else {
    const geometry = new THREE.SphereGeometry(outer, 72, 36);
    mesh = new THREE.Mesh(geometry, material);
    three.root.add(mesh);
    outerEdges = new THREE.LineSegments(new THREE.WireframeGeometry(mesh.geometry), lineMaterial(isSelected ? 0xc9f31d : 0x17201f, isSelected ? .75 : region.material === 'insulator' ? .16 : .1));
    if (inner > EPS) {
      const innerSphere = new THREE.LineSegments(
        new THREE.WireframeGeometry(new THREE.SphereGeometry(inner, 48, 24)),
        lineMaterial(0x17201f, .16)
      );
      three.root.add(innerSphere);
    }
  }

  mesh.renderOrder = isSelected ? 3 : region.material === 'insulator' ? 1 : region.material === 'vacuum' ? 0 : 2;
  if (outerEdges) {
    outerEdges.rotation.copy(mesh.rotation);
    outerEdges.renderOrder = isSelected ? 8 : 4;
    three.root.add(outerEdges);
  }
}

function addFieldParticle(direction, radius, maxOuter, index) {
  const color = direction >= 0 ? 0xf2a65a : 0x6d8ee8;
  const particle = new THREE.Mesh(
    new THREE.SphereGeometry(.025, 12, 8),
    new THREE.MeshBasicMaterial({ color })
  );
  const angle = index / 20 * Math.PI * 2;
  const lane = .72 + (index % 5) * .11;
  particle.userData = { angle, lane, direction, radius, maxOuter, phase: index * .13 };
  three.particles.push(particle);
  three.root.add(particle);
}

function addPointMarker(maxOuter) {
  const scale = 2.6 * state.graphZoom / Math.max(maxOuter, EPS);
  const point = new THREE.Vector3(state.point.x * scale, state.point.y * scale, state.point.z * scale);
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(.07, 18, 12),
    new THREE.MeshBasicMaterial({ color: 0xc9f31d })
  );
  marker.position.copy(point);
  marker.renderOrder = 10;
  three.root.add(marker);

  const { total } = calculateField();
  const field = new THREE.Vector3(total.x, total.y, total.z);
  if (field.length() > EPS) {
    field.normalize();
    const arrow = new THREE.ArrowHelper(field, point, .72, 0x17201f, .18, .09);
    arrow.renderOrder = 10;
    three.root.add(arrow);
  }
}

function rebuild3d() {
  init3d();
  while (three.root.children.length) {
    const child = three.root.children.pop();
    disposeObject(child);
  }
  three.particles = [];
  const active = sortedRegions();
  const maxOuter = Math.max(.01, ...state.regions.map(r => r.outer));
  active.slice().reverse().forEach(region => add3dRegion(region, maxOuter));

  const totalCharge = active.reduce((sum, r) => sum + (r.material === 'vacuum' ? 0 : r.charge), 0);
  const direction = totalCharge >= 0 ? 1 : -1;
  const particleCount = 26;
  for (let i = 0; i < particleCount; i++) addFieldParticle(direction, 2.6, maxOuter, i);
  addPointMarker(maxOuter);

  if (state.showLabels) {
    add3dDimensionGuides(maxOuter);
    const axes = new THREE.AxesHelper(2.9);
    axes.material.depthTest = false;
    axes.renderOrder = 10;
    three.root.add(axes);
  }
  resize3d();
}

function render3d() {
  const wrap = $('.visualization-wrap');
  wrap.classList.toggle('model-active', state.view === 'model');
  if (state.view !== 'model') return;
  const signature = JSON.stringify({
    geometry: state.geometry,
    zoom: state.graphZoom,
    labels: state.showLabels,
    selected: state.selectedId,
    point: [state.point.x, state.point.y, state.point.z],
    regions: state.regions.map(r => [r.id, r.inner, r.outer, r.material, r.charge, r.color])
  });
  if (signature !== three.lastSignature) {
    three.lastSignature = signature;
    rebuild3d();
  }
  resize3d();
}

function animate3d(time) {
  if (!three.ready) return;
  requestAnimationFrame(animate3d);
  if (state.view !== 'model') return;
  if (state.showMotion) {
    three.root.rotation.y += .004;
    three.root.rotation.x = Math.sin(time * .00045) * .08;
  }
  three.particles.forEach((p, i) => {
    const t = ((time * .00018 + p.userData.phase) % 1);
    const flow = p.userData.direction > 0 ? t : 1 - t;
    const radius = .35 + flow * p.userData.radius;
    const a = p.userData.angle + (state.showMotion ? time * .00025 : 0);
    if (state.geometry === 'cylinder') {
      p.position.set(Math.cos(a) * radius, Math.sin(a) * radius, Math.sin(i * 1.7) * 1.7);
    } else {
      p.position.set(Math.cos(a) * radius, Math.sin(a) * Math.cos(a * .7) * radius, Math.sin(a) * radius);
    }
  });
  resize3d();
  three.renderer.render(three.scene, three.camera);
}

function labels() {
  if (state.geometry === 'sphere') return { shape: 'ESFÉRICA', dim: 'R', inner: 'Radio interior', outer: 'Radio exterior', total: 'Carga total', totalUnit: 'C' };
  return { shape: 'CILÍNDRICA', dim: 'r', inner: 'Radio interior', outer: 'Radio exterior', total: 'Carga por metro λ', totalUnit: 'C/m' };
}

function profileName(profile) {
  return ({ constant: 'ρ constante', linear: 'ρ = A r', inverse: 'ρ = B / r' })[profile] || 'ρ constante';
}

function materialName(material) {
  return ({ insulator: 'aislante', conductor: 'conductor', vacuum: 'vacío' })[material] || material;
}

function coefficientUnit(region) {
  if (region.material === 'conductor') return 'C/m²';
  if (region.profile === 'linear') return 'C/m⁴';
  if (region.profile === 'inverse') return 'C/m²';
  return 'C/m³';
}

function measure(region, upper = region.outer) {
  const a = Math.max(0, region.inner);
  const b = Math.max(a, upper);
  if (region.material === 'conductor') {
    if (state.geometry === 'sphere') return 4 * Math.PI * region.outer ** 2;
    if (state.geometry === 'cylinder') return 2 * Math.PI * region.outer;
  }
  if (state.geometry === 'sphere') {
    if (region.profile === 'linear') return Math.PI * (b ** 4 - a ** 4);
    if (region.profile === 'inverse') return 2 * Math.PI * (b ** 2 - a ** 2);
    return 4 / 3 * Math.PI * (b ** 3 - a ** 3);
  }
  if (state.geometry === 'cylinder') {
    if (region.profile === 'linear') return 2 * Math.PI / 3 * (b ** 3 - a ** 3);
    if (region.profile === 'inverse') return 2 * Math.PI * (b - a);
    return Math.PI * (b ** 2 - a ** 2);
  }
}

function refreshCharge(region) {
  if (region.material === 'vacuum') {
    region.charge = 0;
    region.coefficient = 0;
    return;
  }
  if (region.material === 'conductor') region.profile = 'constant';
  region.charge = region.coefficient * Math.max(measure(region), EPS);
}

function densityAt(region, radius) {
  if (region.material !== 'insulator' || region.material === 'vacuum') return 0;
  if (region.profile === 'linear') return region.coefficient * radius;
  if (region.profile === 'inverse') return radius < EPS ? 0 : region.coefficient / radius;
  return region.coefficient;
}

function enclosedCharge(region, distance) {
  if (region.material === 'vacuum' || distance <= region.inner + EPS) return 0;
  if (region.material === 'conductor') return distance >= region.outer - EPS ? region.charge : 0;
  if (distance >= region.outer) return region.charge;
  return region.coefficient * measure(region, distance);
}

function regionDensity(region) {
  return region.material === 'vacuum' ? 0 : region.coefficient;
}

function overlaps(candidate, ignoreId = null) {
  return state.regions.some(r => r.id !== ignoreId && candidate.inner < r.outer - EPS && r.inner < candidate.outer - EPS);
}

function validate(region) {
  if (!region.name.trim()) return 'Ingresá un nombre para la región.';
  if (region.inner < 0 || region.outer <= 0) return 'Las dimensiones deben ser positivas.';
  if (region.outer <= region.inner) return 'El límite exterior debe ser mayor que el interior.';
  if (overlaps(region, region.id)) return 'Esta región se superpone con otra. Las fronteras sí pueden tocarse.';
  return '';
}

function renderAll() {
  state.regions.forEach(refreshCharge);
  state.regions.sort((a, b) => a.inner - b.inner || a.outer - b.outer);
  syncViewControls();
  renderRegionList();
  renderEditor();
  renderVisualization();
  calculate();
}

function syncViewControls() {
  syncGeometryControls();
  syncRegionTypeControls();
  $$('.segmented button').forEach(b => b.classList.toggle('active', b.dataset.view === state.view));
  $('#toggleMotion').classList.toggle('active', state.showMotion);
  ['graphZoom', 'toggleMotion', 'toggleLabels', 'resetView'].forEach(id => {
    const el = $('#' + id);
    if (el) el.disabled = false;
  });
}

function syncGeometryControls() {
  $('.geometry-toggle').style.gridTemplateColumns = `repeat(${GEOMETRIES.length}, 1fr)`;
  $$('.geometry-toggle button').forEach(button => {
    button.classList.toggle('active', button.dataset.geometry === state.geometry);
  });
}

function syncRegionTypeControls() {
  $('.type-grid').style.gridTemplateColumns = `repeat(${REGION_TYPES.length}, 1fr)`;
  $$('.type-grid button').forEach(button => {
    button.disabled = !selected();
    button.classList.toggle('active', selected()?.material === button.dataset.material);
  });
}

function renderRegionList() {
  const l = labels();
  const max = Math.max(0, ...state.regions.map(r => r.outer));
  $('#regionList').innerHTML = sortedRegions().map((r, i) => `
    <article class="region-card ${r.id === state.selectedId ? 'selected' : ''}" data-id="${r.id}">
      <i class="region-swatch" style="background:${r.color}"></i>
      <div class="region-copy"><strong>${i + 1}. ${escapeHtml(r.name)}</strong><span>${fmt(r.inner, 2)} — ${fmt(r.outer, 2)} m · ${r.material === 'insulator' ? profileName(r.profile) : materialName(r.material)}</span></div>
      <span class="region-charge">${r.material === 'vacuum' ? '0' : state.geometry === 'cylinder' ? lambdaFmt(r.charge) : chargeFmt(r.charge)}</span>
    </article>`).join('');
  $$('.region-card').forEach(el => el.onclick = (event) => {
    event.stopPropagation();
    state.selectedId = el.dataset.id;
    renderAll();
  });
  $('#regionCount').textContent = `${state.regions.length} ${state.regions.length === 1 ? 'región' : 'regiones'}`;
  $('#outerSize').textContent = `${l.dim} = ${fmt(max, 2)} m`;
  $('#experimentTitle').textContent = `CONFIGURACIÓN ${l.shape} CONCÉNTRICA`;
}

function renderEditor() {
  const r = selected();
  if (!r) {
    $('#editorTitle').textContent = 'Configuración completa';
    $('#regionName').value = '';
    $('#innerSize').value = '';
    $('#outerSizeInput').value = '';
    $('#calculatedLabel').textContent = 'Vista general';
    $('#calculatedValue').textContent = `${state.regions.length} regiones`;
    $('#validationMessage').textContent = '';
    $('#validationMessage').classList.remove('show');
    $('#polarityIndicator').style.left = '50%';
    setEditorDisabled(true);
    return;
  }
  setEditorDisabled(false);
  const l = labels();
  const isDensity = state.chargeMode === 'density';
  const isSurfaceOrVacuum = r.material === 'vacuum' || r.material === 'conductor';
  const totalUnits = state.geometry === 'cylinder'
    ? '<option value="1">C/m</option><option value="0.000001">μC/m</option><option value="1e-9" selected>nC/m</option>'
    : '<option value="1">C</option><option value="0.000001" selected>μC</option><option value="1e-9">nC</option>';

  $('#editorTitle').textContent = r.name;
  $('#regionName').value = r.name;
  $('#innerSize').value = r.inner;
  $('#outerSizeInput').value = r.outer;
  $('#innerLabel').textContent = l.inner;
  $('#outerLabel').textContent = l.outer;
  $('#innerSize').disabled = false;
  $$('.type-grid button').forEach(b => {
    b.classList.toggle('active', b.dataset.material === r.material);
    b.disabled = false;
  });
  $$('.charge-tabs button').forEach(b => {
    b.classList.toggle('active', b.dataset.chargeMode === state.chargeMode);
    if (b.dataset.chargeMode === 'total') b.textContent = l.total;
  });
  $('#densityProfile').value = r.profile;
  $('#densityProfile').disabled = isSurfaceOrVacuum;
  $('#densityProfile').title = '';
  $('#chargeValue').disabled = r.material === 'vacuum';
  $('#chargeUnit').disabled = r.material === 'vacuum';

  const physicalValue = isDensity ? r.coefficient : r.charge;
  $('#chargeUnit').innerHTML = isDensity
    ? `<option value="1">${coefficientUnit(r)}</option><option value="0.000001">μ${coefficientUnit(r)}</option>`
    : totalUnits;
  const displayUnit = Math.abs(physicalValue) > 0 && Math.abs(physicalValue) < 1 ? Number($('#chargeUnit option:last-child').value) : 1;
  $('#chargeUnit').value = String(displayUnit);
  $('#chargeValue').value = r.material === 'vacuum' ? 0 : Number((physicalValue / displayUnit).toPrecision(7));
  $('#calculatedLabel').textContent = isDensity ? l.total : (r.material === 'conductor' ? 'σ calculada' : `${profileName(r.profile)} · coeficiente`);
  $('#calculatedValue').textContent = isDensity
    ? (state.geometry === 'cylinder' ? lambdaFmt(r.charge) : chargeFmt(r.charge))
    : `${sci(regionDensity(r))} ${coefficientUnit(r)}`;
  $('#polarityIndicator').style.left = `${50 + Math.max(-1, Math.min(1, r.charge / (state.geometry === 'cylinder' ? 10e-9 : 5e-6))) * 47}%`;
  const error = validate(r);
  $('#validationMessage').textContent = error;
  $('#validationMessage').classList.toggle('show', !!error);
}

function setEditorDisabled(disabled) {
  ['regionName', 'innerSize', 'outerSizeInput', 'densityProfile', 'chargeValue', 'chargeUnit'].forEach(id => {
    const el = $('#' + id);
    if (el) el.disabled = disabled;
  });
  $$('.type-grid button').forEach(button => button.disabled = disabled || !regionTypeEnabled(button.dataset.material));
  $$('.charge-tabs button').forEach(button => button.disabled = disabled);
  $('#deleteRegion').disabled = disabled;
}

function clearSelection() {
  if (state.selectedId === null) return;
  state.selectedId = null;
  three.lastSignature = '';
  renderAll();
}

function renderVisualization() {
  const svg = $('#visualization');
  const l = labels();
  const maxRegion = Math.max(1, ...state.regions.map(r => r.outer));
  const pointRadius = Math.hypot(state.point.x, state.point.y);
  const extent = Math.max(maxRegion * 1.24, pointRadius * 1.12, 1);
  const scale = 245 / extent * state.graphZoom;
  const cx = 360, cy = 320;
  let content = `<defs><filter id="shadow"><feDropShadow dx="0" dy="3" stdDeviation="5" flood-opacity=".12"/></filter><marker id="arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z" fill="#17201f"/></marker></defs>`;
  content += `<line x1="22" y1="${cy}" x2="698" y2="${cy}" stroke="#bdc7c3" stroke-width="1"/><line x1="${cx}" y1="18" x2="${cx}" y2="622" stroke="#bdc7c3" stroke-width="1"/>`;

  sortedRegions().sort((a, b) => b.outer - a.outer).forEach(r => {
    const stroke = r.id === state.selectedId ? '#17201f' : r.color;
    const opacity = r.material === 'vacuum' ? .07 : r.material === 'conductor' ? .34 : .25;
    content += `<circle data-region-id="${r.id}" cx="${cx}" cy="${cy}" r="${r.outer * scale}" fill="${r.color}" fill-opacity="${opacity}" stroke="${stroke}" stroke-width="${r.id === state.selectedId ? 3 : 1.4}" ${r.material === 'vacuum' ? 'stroke-dasharray="5 4"' : ''}/>`;
    if (r.inner > 0) content += `<circle data-region-id="${r.id}" cx="${cx}" cy="${cy}" r="${r.inner * scale}" fill="#f4f6f3" fill-opacity=".62" stroke="${r.color}" stroke-width="1" stroke-dasharray="3 4"/>`;
  });

  if (state.showLabels) sortedRegions().forEach((r, i) => {
    const visualOuter = r.outer * scale;
    const y = cy - visualOuter;
    const x2 = cx + visualOuter;
    content += `<line x1="${cx}" y1="${y}" x2="${x2}" y2="${y}" stroke="#65716e" stroke-width=".8" stroke-dasharray="2 3"/><text x="${(cx + x2) / 2}" y="${y - 6}" text-anchor="middle" fill="#65716e" font-family="DM Mono" font-size="9">${l.dim}${i + 1} · ${fmt(r.outer, 2)} m</text>`;
  });

  const { total } = calculateField();
  const mag = Math.hypot(total.x, total.y, total.z);
  if (mag > EPS) {
    const len = Math.min(90, 28 + Math.log10(mag + 1) * 12);
    const arrowPx = cx + state.point.x * scale, arrowPy = cy - state.point.y * scale;
    content += `<line x1="${arrowPx}" y1="${arrowPy}" x2="${arrowPx + len * total.x / mag}" y2="${arrowPy - len * total.y / mag}" stroke="#17201f" stroke-width="2" marker-end="url(#arrow)"/>`;
  }

  const px = cx + state.point.x * scale, py = cy - state.point.y * scale;
  content += `<circle cx="${px}" cy="${py}" r="9" fill="#17201f" opacity=".12"/><circle cx="${px}" cy="${py}" r="4" fill="#c9f31d" stroke="#17201f" stroke-width="2"/>`;
  svg.innerHTML = content;
  $('#scaleNote').textContent = `escala · ${fmt(extent / 3 / state.graphZoom, 3)} m · zoom ${fmt(state.graphZoom, 1)}×`;
  $('#graphZoom').value = state.graphZoom;
  $('#graphZoomValue').textContent = `${fmt(state.graphZoom, 1)}×`;
  $('#pointCard').style.left = `${Math.max(8, Math.min(82, px / 720 * 100 + 2))}%`;
  $('#pointCard').style.top = `${Math.max(3, Math.min(88, py / 650 * 100 + 2))}%`;
  $('#pointCardCoords').textContent = `r = ${fmt(state.radius, 3)} m`;
  $('#legend').innerHTML = sortedRegions().map(r => `<span class="legend-item"><i style="background:${r.color}"></i><b>${escapeHtml(r.name)}</b> ${r.material === 'vacuum' ? 'vacío' : state.geometry === 'cylinder' ? lambdaFmt(r.charge) : chargeFmt(r.charge)}</span>`).join('');
  render3d();
}

function sphericalContribution(region, p) {
  const d = Math.hypot(p.x, p.y, p.z);
  if (d < EPS) return { x: 0, y: 0, z: 0 };
  if (region.material === 'vacuum') return { x: 0, y: 0, z: 0 };
  if (region.material === 'conductor') {
    if (d < region.outer) return { x: 0, y: 0, z: 0 };
    const factor = K * region.charge / d ** 3;
    return { x: factor * p.x, y: factor * p.y, z: factor * p.z };
  }
  if (region.profile === 'constant' && region.inner <= EPS && d <= region.outer) {
    const factor = K * region.charge / Math.max(region.outer ** 3, EPS);
    return { x: factor * p.x, y: factor * p.y, z: factor * p.z };
  }
  const enclosed = enclosedCharge(region, d);
  const factor = K * enclosed / d ** 3;
  return { x: factor * p.x, y: factor * p.y, z: factor * p.z };
}

function cylindricalContribution(region, p) {
  const r = Math.hypot(p.x, p.y);
  if (r < EPS) return { x: 0, y: 0, z: 0 };
  if (region.material === 'vacuum') return { x: 0, y: 0, z: 0 };
  if (region.material === 'conductor') {
    if (r < region.outer) return { x: 0, y: 0, z: 0 };
    const factor = 2 * K * region.charge / r ** 2;
    return { x: factor * p.x, y: factor * p.y, z: 0 };
  }
  if (region.profile === 'constant' && region.inner <= EPS && r <= region.outer) {
    const factor = 2 * K * region.charge / Math.max(region.outer ** 2, EPS);
    return { x: factor * p.x, y: factor * p.y, z: 0 };
  }
  const enclosedLambda = enclosedCharge(region, r);
  const factor = 2 * K * enclosedLambda / r ** 2;
  return { x: factor * p.x, y: factor * p.y, z: 0 };
}

function calculateField() {
  if (pointInsideConductor()) {
    const rows = sortedRegions().map(region => ({ region, field: { x: 0, y: 0, z: 0 } }));
    return { rows, total: { x: 0, y: 0, z: 0 } };
  }
  const rows = sortedRegions().map(region => {
    const field = state.geometry === 'sphere'
      ? sphericalContribution(region, state.point)
      : cylindricalContribution(region, state.point);
    return { region, field };
  });
  const total = rows.reduce((a, r) => ({ x: a.x + r.field.x, y: a.y + r.field.y, z: a.z + r.field.z }), { x: 0, y: 0, z: 0 });
  return { rows, total };
}

function pointInsideConductor() {
  const d = state.geometry === 'sphere'
    ? Math.hypot(state.point.x, state.point.y, state.point.z)
    : Math.hypot(state.point.x, state.point.y);
  return state.regions.some(region => region.material === 'conductor' && d > region.inner + EPS && d < region.outer - EPS);
}

function calculate() {
  const { rows, total } = calculateField();
  const radial = total.x;
  const mag = Math.abs(radial);
  $('#magnitude').textContent = sci(mag);
  $('#radialField').textContent = `${sci(radial)} N/C`;
  $('#fieldSense').textContent = mag < EPS ? '—' : radial > 0 ? 'hacia afuera' : 'hacia el centro';
  $('#pointLocation').textContent = locatePoint();
  $('#contributionBody').innerHTML = rows.map(({ region, field }) => {
    const er = field.x;
    const abs = Math.abs(er);
    const sense = abs < EPS ? '—' : er > 0 ? 'sale' : 'entra';
    return `<tr><td><i style="display:inline-block;width:6px;height:6px;border-radius:2px;background:${region.color};margin-right:6px"></i>${escapeHtml(region.name)}</td><td>${sci(er)}</td><td>${sci(abs)}</td><td>${sense}</td></tr>`;
  }).join('') + `<tr><td>Total</td><td>${sci(radial)}</td><td>${sci(mag)}</td><td>${mag < EPS ? '—' : radial > 0 ? 'sale' : 'entra'}</td></tr>`;
}

function locatePoint() {
  const d = state.geometry === 'sphere' ? Math.hypot(state.point.x, state.point.y, state.point.z) : Math.hypot(state.point.x, state.point.y);
  const r = sortedRegions().find(item => d >= item.inner - EPS && d < item.outer - EPS);
  if (!r) return 'Fuera de la configuración';
  return r.material === 'vacuum' ? `En ${r.name} · vacío` : r.material === 'conductor' ? `En ${r.name} · conductor, E = 0` : `En ${r.name}`;
}

function commitEditor() {
  const r = selected();
  if (!r) return;
  const previousCharge = r.charge;
  const proposal = { ...r, name: $('#regionName').value, inner: Number($('#innerSize').value), outer: Number($('#outerSizeInput').value), profile: $('#densityProfile').value };
  const error = validate(proposal);
  if (error) {
    $('#validationMessage').textContent = error;
    $('#validationMessage').classList.add('show');
    return;
  }
  Object.assign(r, proposal);
  if (state.chargeMode === 'total' && r.material !== 'vacuum') {
    r.charge = previousCharge;
    r.coefficient = r.charge / Math.max(measure(r), EPS);
  } else {
    refreshCharge(r);
  }
  renderAll();
}

function addRegion() {
  if (state.regions.length >= 10) {
    toast('El simulador admite hasta 10 regiones.');
    return;
  }
  let inner = 0;
  for (const r of sortedRegions()) if (r.outer > inner) inner = r.outer;
  const id = `region-${Date.now()}`;
  const material = 'insulator';
  state.regions.push({ id, name: `Región ${state.regions.length + 1}`, inner, outer: inner + 1, material, profile: 'constant', coefficient: material === 'vacuum' ? 0 : 1e-6, charge: material === 'vacuum' ? 0 : 1e-6, color: COLORS[state.regions.length % COLORS.length] });
  state.selectedId = id;
  renderAll();
  toast('Región agregada.');
}

function resetGeometry(geometry, options = {}) {
  if (!geometryEnabled(geometry)) return;
  state.geometry = geometry;
  state.view = geometry === 'sphere' ? state.view : 'model';
  three.lastSignature = '';
  setRadius(4);
  $('#radiusInput').value = state.radius;
  state.regions = geometry === 'sphere'
    ? defaultSphereRegions()
    : defaultCylinderRegions();
  state.selectedId = null;
  syncGeometryControls();
  if (!options.skipRender) renderAll();
}

function setMaterial(material) {
  const r = selected();
  if (!r) return;
  if (!regionTypeEnabled(material)) {
    toast('Ese tipo de región no está disponible.');
    return;
  }
  const previousCharge = r.charge;
  const proposal = { ...r, material };
  if (material === 'conductor') {
    proposal.profile = 'constant';
  }
  if (material === 'vacuum') proposal.coefficient = 0;
  const error = validate(proposal);
  if (error) {
    toast(error);
    return;
  }
  Object.assign(r, proposal);
  if (state.chargeMode === 'total' && r.material !== 'vacuum') {
    r.charge = previousCharge;
    r.coefficient = r.charge / Math.max(measure(r), EPS);
  } else {
    refreshCharge(r);
  }
  renderAll();
}

function modal(title, text, confirmLabel, action) {
  $('#modalTitle').textContent = title;
  $('#modalText').textContent = text;
  $('#modalConfirm').textContent = confirmLabel;
  $('#modalBackdrop').hidden = false;
  $('#modalConfirm').onclick = () => {
    $('#modalBackdrop').hidden = true;
    action();
  };
}

function toast(text) {
  const t = $('#toast');
  t.textContent = text;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 2200);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c]);
}

$('#addRegionButton').onclick = $('#addRegionWide').onclick = addRegion;
$('#deleteRegion').onclick = () => {
  const r = selected();
  if (!r) {
    toast('Seleccioná una región para eliminarla.');
    return;
  }
  if (state.regions.length === 1) {
    toast('Debe existir al menos una región.');
    return;
  }
  modal('Eliminar región', `¿Querés eliminar “${r.name}”? Las demás regiones conservarán sus propiedades.`, 'Eliminar', () => {
    state.regions = state.regions.filter(x => x.id !== r.id);
    state.selectedId = null;
    renderAll();
  });
};
$('#modalCancel').onclick = () => $('#modalBackdrop').hidden = true;
$('#modalBackdrop').onclick = e => { if (e.target === $('#modalBackdrop')) $('#modalBackdrop').hidden = true; };

$$('.geometry-toggle button').forEach(b => b.onclick = () => {
  if (!geometryEnabled(b.dataset.geometry)) return;
  if (b.dataset.geometry === state.geometry) return;
  modal('Cambiar geometría', 'Al cambiar la geometría se reiniciarán todas las regiones de la configuración.', 'Cambiar', () => resetGeometry(b.dataset.geometry));
});
$$('.type-grid button').forEach(b => b.onclick = () => {
  if (!regionTypeEnabled(b.dataset.material)) return;
  setMaterial(b.dataset.material);
});
$$('.charge-tabs button').forEach(b => b.onclick = () => { state.chargeMode = b.dataset.chargeMode; renderEditor(); });
$$('.segmented button').forEach(b => b.onclick = () => { state.view = b.dataset.view; syncViewControls(); renderVisualization(); });
$('#toggleLabels').onclick = () => { state.showLabels = !state.showLabels; $('#toggleLabels').classList.toggle('active', state.showLabels); renderVisualization(); };
$('#toggleMotion').onclick = () => { state.showMotion = !state.showMotion; syncViewControls(); render3d(); };
$('#resetView').onclick = () => { setRadius(4); state.graphZoom = 1; $('#radiusInput').value = state.radius; renderAll(); };
$('#toggleContributions').onclick = () => $('.contributions').classList.toggle('collapsed');
$('.visualization-wrap').addEventListener('click', (event) => {
  const target = event.target.closest?.('[data-region-id]');
  if (target) {
    state.selectedId = target.dataset.regionId;
    three.lastSignature = '';
    renderAll();
    return;
  }
  clearSelection();
});
$('#regionList').addEventListener('click', clearSelection);

['regionName', 'innerSize', 'outerSizeInput'].forEach(id => $('#' + id).addEventListener('change', commitEditor));
$('#densityProfile').onchange = commitEditor;
$('#chargeValue').onchange = () => {
  const r = selected();
  if (!r || r.material === 'vacuum') return;
  const raw = Number($('#chargeValue').value), unit = Number($('#chargeUnit').value);
  if (state.chargeMode === 'total') {
    r.charge = raw * unit;
    r.coefficient = r.charge / Math.max(measure(r), EPS);
  } else {
    r.coefficient = raw * unit;
    refreshCharge(r);
  }
  renderAll();
};
$('#chargeUnit').onchange = () => {
  const r = selected();
  if (!r) return;
  const physical = state.chargeMode === 'total' ? r.charge : r.coefficient;
  $('#chargeValue').value = Number((physical / Number($('#chargeUnit').value)).toPrecision(7));
};
$('#radiusInput').addEventListener('input', () => {
  setRadius($('#radiusInput').value);
  renderVisualization();
  calculate();
});
$('#graphZoom').oninput = () => {
  state.graphZoom = Number($('#graphZoom').value) || 1;
  renderVisualization();
};

renderAll();
