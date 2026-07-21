import { EPS, K } from './constants.js';

export const sortedRegions = (regions) => [...regions].sort((a, b) => a.inner - b.inner || a.outer - b.outer);

export function measure(region, geometry, upper = region.outer) {
  const a = Math.max(0, region.inner);
  const b = Math.max(a, upper);
  if (region.material === 'conductor') {
    if (geometry === 'sphere') return 4 * Math.PI * region.outer ** 2;
    return 2 * Math.PI * region.outer;
  }
  if (geometry === 'sphere') {
    return 4 / 3 * Math.PI * (b ** 3 - a ** 3);
  }
  return Math.PI * (b ** 2 - a ** 2);
}

export function refreshRegionCharge(region, geometry) {
  const next = { ...region };
  if (next.material === 'vacuum') {
    next.charge = 0;
    next.coefficient = 0;
    return next;
  }
  next.profile = 'constant';
  next.charge = next.coefficient * Math.max(measure(next, geometry), EPS);
  return next;
}

export function coefficientUnit(region) {
  if (region.material === 'conductor') return 'C/m²';
  return 'C/m³';
}

export const regionDensity = (region) => region.material === 'vacuum' ? 0 : region.coefficient;

export function enclosedCharge(region, distance, geometry) {
  if (region.material === 'vacuum' || distance <= region.inner + EPS) return 0;
  if (region.material === 'conductor') return distance >= region.outer - EPS ? region.charge : 0;
  if (distance >= region.outer) return region.charge;
  return region.coefficient * measure(region, geometry, distance);
}

function sphericalContribution(region, point, geometry) {
  const d = Math.hypot(point.x, point.y, point.z);
  if (d < EPS || region.material === 'vacuum') return { x: 0, y: 0, z: 0 };
  if (region.material === 'conductor') {
    if (d < region.outer) return { x: 0, y: 0, z: 0 };
    const factor = K * region.charge / d ** 3;
    return { x: factor * point.x, y: factor * point.y, z: factor * point.z };
  }
  if (region.inner <= EPS && d <= region.outer) {
    const factor = K * region.charge / Math.max(region.outer ** 3, EPS);
    return { x: factor * point.x, y: factor * point.y, z: factor * point.z };
  }
  const enclosed = enclosedCharge(region, d, geometry);
  const factor = K * enclosed / d ** 3;
  return { x: factor * point.x, y: factor * point.y, z: factor * point.z };
}

function cylindricalContribution(region, point, geometry) {
  const r = Math.hypot(point.x, point.y);
  if (r < EPS || region.material === 'vacuum') return { x: 0, y: 0, z: 0 };
  if (region.material === 'conductor') {
    if (r < region.outer) return { x: 0, y: 0, z: 0 };
    const factor = 2 * K * region.charge / r ** 2;
    return { x: factor * point.x, y: factor * point.y, z: 0 };
  }
  if (region.inner <= EPS && r <= region.outer) {
    const factor = 2 * K * region.charge / Math.max(region.outer ** 2, EPS);
    return { x: factor * point.x, y: factor * point.y, z: 0 };
  }
  const enclosedLambda = enclosedCharge(region, r, geometry);
  const factor = 2 * K * enclosedLambda / r ** 2;
  return { x: factor * point.x, y: factor * point.y, z: 0 };
}

export function pointInsideConductor(geometry, regions, point) {
  const d = geometry === 'sphere' ? Math.hypot(point.x, point.y, point.z) : Math.hypot(point.x, point.y);
  return regions.some(region => region.material === 'conductor' && d > region.inner + EPS && d < region.outer - EPS);
}

export function calculateField(geometry, regions, point) {
  const ordered = sortedRegions(regions);
  if (pointInsideConductor(geometry, ordered, point)) {
    const rows = ordered.map(region => ({ region, field: { x: 0, y: 0, z: 0 } }));
    return { rows, total: { x: 0, y: 0, z: 0 } };
  }
  const rows = ordered.map(region => ({
    region,
    field: geometry === 'sphere'
      ? sphericalContribution(region, point, geometry)
      : cylindricalContribution(region, point, geometry)
  }));
  const total = rows.reduce((a, r) => ({ x: a.x + r.field.x, y: a.y + r.field.y, z: a.z + r.field.z }), { x: 0, y: 0, z: 0 });
  return { rows, total };
}

export function locatePoint(geometry, regions, point) {
  const d = geometry === 'sphere' ? Math.hypot(point.x, point.y, point.z) : Math.hypot(point.x, point.y);
  const region = sortedRegions(regions).find(item => d >= item.inner - EPS && d < item.outer - EPS);
  if (!region) return 'Fuera de la configuración';
  if (region.material === 'vacuum') return `En ${region.name} · vacío`;
  if (region.material === 'conductor') return `En ${region.name} · conductor, E = 0`;
  return `En ${region.name}`;
}

export function validateRegion(region, regions) {
  if (!region.name.trim()) return 'Ingresá un nombre para la región.';
  if (region.inner < 0 || region.outer <= 0) return 'Las dimensiones deben ser positivas.';
  if (region.outer <= region.inner) return 'El límite exterior debe ser mayor que el interior.';
  const overlaps = regions.some(r => r.id !== region.id && region.inner < r.outer - EPS && r.inner < region.outer - EPS);
  if (overlaps) return 'Esta región se superpone con otra. Las fronteras sí pueden tocarse.';
  return '';
}
