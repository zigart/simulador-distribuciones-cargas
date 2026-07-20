import { COLORS } from './constants.js';

export function defaultSphereRegions() {
  return [
    { id: 'core', name: 'Esfera central conductora', inner: 0, outer: 1, material: 'conductor', profile: 'constant', coefficient: 5e-9 / (4 * Math.PI * 1 ** 2), charge: 5e-9, color: COLORS[0] },
    { id: 'gap', name: 'Zona de vacío', inner: 1, outer: 2, material: 'vacuum', profile: 'constant', coefficient: 0, charge: 0, color: COLORS[1] },
    { id: 'shell', name: 'Cascarón exterior conductor', inner: 2, outer: 3, material: 'conductor', profile: 'constant', coefficient: -2e-9 / (4 * Math.PI * 3 ** 2), charge: -2e-9, color: COLORS[2] }
  ];
}

export function defaultCylinderRegions() {
  return [
    { id: 'core', name: 'Cilindro central conductor', inner: 0, outer: 1, material: 'conductor', profile: 'constant', coefficient: 5e-9 / (2 * Math.PI * 1), charge: 5e-9, color: COLORS[0] },
    { id: 'gap', name: 'Zona de vacío', inner: 1, outer: 2, material: 'vacuum', profile: 'constant', coefficient: 0, charge: 0, color: COLORS[1] },
    { id: 'shell', name: 'Coraza cilíndrica externa', inner: 2, outer: 3, material: 'conductor', profile: 'constant', coefficient: -2e-9 / (2 * Math.PI * 3), charge: -2e-9, color: COLORS[2] }
  ];
}

export function defaultRegionsFor(geometry) {
  return geometry === 'cylinder' ? defaultCylinderRegions() : defaultSphereRegions();
}
