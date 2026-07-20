export const fmt = (n, digits = 3) => Number.isFinite(n)
  ? n.toLocaleString('es-AR', { maximumFractionDigits: digits, minimumFractionDigits: digits })
  : '—';

export function sci(n) {
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) < 1e-12) return '0';
  if (Math.abs(n) >= 1e5 || Math.abs(n) < .01) {
    return n.toExponential(3).replace('e+', '×10^').replace('e-', '×10^-');
  }
  return fmt(n, 3);
}

export function chargeUnitLabel(geometry, unit) {
  if (geometry === 'cylinder') {
    if (unit === 1e-9) return 'nC/m';
    if (unit === 0.000001) return 'μC/m';
    return 'C/m';
  }
  if (unit === 1e-9) return 'nC';
  if (unit === 0.000001) return 'μC';
  return 'C';
}

export function chargeFmtWithUnit(value, geometry, unit) {
  const scaled = value / unit;
  if (Math.abs(scaled) < 1e-12) return `${fmt(0, 2)} ${chargeUnitLabel(geometry, unit)}`;
  const sign = scaled >= 0 ? '+' : '−';
  return `${sign}${fmt(Math.abs(scaled), 2)} ${chargeUnitLabel(geometry, unit)}`;
}

export function labels(geometry) {
  if (geometry === 'sphere') return { shape: 'ESFÉRICA', dim: 'R', inner: 'Radio interior', outer: 'Radio exterior', total: 'Carga total', totalUnit: 'C' };
  return { shape: 'CILÍNDRICA', dim: 'r', inner: 'Radio interior', outer: 'Radio exterior', total: 'Carga por metro λ', totalUnit: 'C/m' };
}

export const profileName = (profile) => ({ constant: 'ρ constante', linear: 'ρ = A r', inverse: 'ρ = B / r' })[profile] || 'ρ constante';
export const materialName = (material) => ({ insulator: 'aislante', conductor: 'conductor', vacuum: 'vacío' })[material] || material;
