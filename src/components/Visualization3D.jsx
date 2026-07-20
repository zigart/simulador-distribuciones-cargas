import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EPS } from '../physics/constants.js';
import { calculateField, sortedRegions } from '../physics/calculations.js';
import { fmt } from '../physics/format.js';

function disposeObject(object) {
  object.traverse(child => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach(material => {
        if (material.map) material.map.dispose();
        material.dispose();
      });
    }
  });
}

function lineMaterial(color = 0x17201f, opacity = .28) {
  return new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
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

export default function Visualization3D({ state, labels }) {
  const canvasRef = useRef(null);
  const threeRef = useRef(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const canvas = canvasRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1000);
    camera.position.set(4.2, 3.2, 5.2);
    camera.lookAt(0, 0, 0);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const root = new THREE.Group();
    scene.add(root);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xb7c4be, 1.9));
    const light = new THREE.DirectionalLight(0xffffff, 1.2);
    light.position.set(4, 6, 5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, .55));
    threeRef.current = { scene, camera, renderer, root, particles: [] };

    let frame;
    const animate = (time) => {
      frame = requestAnimationFrame(animate);
      const current = stateRef.current;
      if (current.view !== 'model') return;
      if (current.showMotion) {
        root.rotation.y += .004;
        root.rotation.x = Math.sin(time * .00045) * .08;
      }
      threeRef.current.particles.forEach((particle, i) => {
        const t = ((time * .00018 + particle.userData.phase) % 1);
        const flow = particle.userData.direction > 0 ? t : 1 - t;
        const radius = .35 + flow * particle.userData.radius;
        const a = particle.userData.angle + (current.showMotion ? time * .00025 : 0);
        if (current.geometry === 'cylinder') {
          particle.position.set(Math.cos(a) * radius, Math.sin(a) * radius, Math.sin(i * 1.7) * 1.7);
        } else {
          particle.position.set(Math.cos(a) * radius, Math.sin(a) * Math.cos(a * .7) * radius, Math.sin(a) * radius);
        }
      });
      resize();
      renderer.render(scene, camera);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    frame = requestAnimationFrame(animate);
    window.addEventListener('resize', resize);
    resize();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      disposeObject(root);
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const three = threeRef.current;
    if (!three) return;
    while (three.root.children.length) {
      const child = three.root.children.pop();
      disposeObject(child);
    }
    three.particles = [];
    const active = sortedRegions(state.regions);
    const maxOuter = Math.max(.01, ...state.regions.map(r => r.outer));
    active.slice().reverse().forEach(region => add3dRegion(three, state, region, maxOuter));
    const totalCharge = active.reduce((sum, r) => sum + (r.material === 'vacuum' ? 0 : r.charge), 0);
    const direction = totalCharge >= 0 ? 1 : -1;
    for (let i = 0; i < 26; i++) addFieldParticle(three, direction, i);
    addPointMarker(three, state, maxOuter);
    if (state.showLabels) {
      add3dDimensionGuides(three, state, labels, maxOuter);
      const axes = new THREE.AxesHelper(2.9);
      axes.material.depthTest = false;
      axes.renderOrder = 10;
      three.root.add(axes);
    }
  }, [state.geometry, state.regions, state.selectedId, state.graphZoom, state.radius, state.showLabels, labels]);

  return <canvas id="visualization3d" ref={canvasRef} aria-label="Vista tridimensional de la configuración"></canvas>;
}

function makeMaterial(state, region, alpha = .34) {
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

function add3dRegion(three, state, region, maxOuter) {
  const isSelected = region.id === state.selectedId;
  const sizeScale = 2.6 * state.graphZoom / Math.max(maxOuter, EPS);
  const outer = Math.max(.02, region.outer * sizeScale);
  const inner = Math.max(0, region.inner * sizeScale);
  const material = makeMaterial(state, region, isSelected ? .6 : .28);
  let mesh;
  let outerEdges;
  if (state.geometry === 'cylinder') {
    const length = Math.max(3.2, outer * 2.7);
    mesh = new THREE.Mesh(new THREE.CylinderGeometry(outer, outer, length, 72, 1, false), material);
    mesh.rotation.x = Math.PI / 2;
    three.root.add(mesh);
    outerEdges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), lineMaterial(isSelected ? 0xc9f31d : 0x17201f, isSelected ? .95 : region.material === 'insulator' ? .34 : .22));
    if (inner > EPS) {
      const innerRing = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(inner, inner, length * 1.01, 72, 1, true)), lineMaterial(0x17201f, .3));
      innerRing.rotation.x = Math.PI / 2;
      three.root.add(innerRing);
    }
  } else {
    mesh = new THREE.Mesh(new THREE.SphereGeometry(outer, 72, 36), material);
    three.root.add(mesh);
    outerEdges = new THREE.LineSegments(new THREE.WireframeGeometry(mesh.geometry), lineMaterial(isSelected ? 0xc9f31d : 0x17201f, isSelected ? .75 : region.material === 'insulator' ? .16 : .1));
    if (inner > EPS) {
      three.root.add(new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.SphereGeometry(inner, 48, 24)), lineMaterial(0x17201f, .16)));
    }
  }
  mesh.renderOrder = isSelected ? 3 : region.material === 'insulator' ? 1 : region.material === 'vacuum' ? 0 : 2;
  outerEdges.rotation.copy(mesh.rotation);
  outerEdges.renderOrder = isSelected ? 8 : 4;
  three.root.add(outerEdges);
}

function addFieldParticle(three, direction, index) {
  const particle = new THREE.Mesh(new THREE.SphereGeometry(.025, 12, 8), new THREE.MeshBasicMaterial({ color: direction >= 0 ? 0xf2a65a : 0x6d8ee8 }));
  particle.userData = { angle: index / 20 * Math.PI * 2, direction, radius: 2.6, phase: index * .13 };
  three.particles.push(particle);
  three.root.add(particle);
}

function addPointMarker(three, state, maxOuter) {
  const scale = 2.6 * state.graphZoom / Math.max(maxOuter, EPS);
  const point = new THREE.Vector3(state.point.x * scale, state.point.y * scale, state.point.z * scale);
  const marker = new THREE.Mesh(new THREE.SphereGeometry(.07, 18, 12), new THREE.MeshBasicMaterial({ color: 0xc9f31d }));
  marker.position.copy(point);
  marker.renderOrder = 10;
  three.root.add(marker);
  const { total } = calculateField(state.geometry, state.regions, state.point);
  const field = new THREE.Vector3(total.x, total.y, total.z);
  if (field.length() > EPS) {
    field.normalize();
    const arrow = new THREE.ArrowHelper(field, point, .72, 0x17201f, .18, .09);
    arrow.renderOrder = 10;
    three.root.add(arrow);
  }
}

function add3dDimensionGuides(three, state, labels, maxOuter) {
  const scale = 2.6 * state.graphZoom / Math.max(maxOuter, EPS);
  sortedRegions(state.regions).forEach((region, index) => {
    const radius = Math.max(.02, region.outer * scale);
    const color = new THREE.Color(region.color);
    const guide = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(radius, 0, 0)]), lineMaterial(color.getHex(), region.id === state.selectedId ? .95 : .46));
    guide.renderOrder = 14;
    three.root.add(guide);
    const marker = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.TorusGeometry(radius, .006, 8, 96)), lineMaterial(color.getHex(), region.id === state.selectedId ? .9 : .28));
    marker.renderOrder = 13;
    three.root.add(marker);
    const label = makeTextSprite(`${labels.dim}${index + 1} = ${fmt(region.outer, 2)} m`, region.color);
    label.position.set(radius + .42, .18 + index * .18, 0);
    three.root.add(label);
  });
}
