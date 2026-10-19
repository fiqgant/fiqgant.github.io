import * as THREE from 'three';
import { RGBELoader } from 'https://cdn.jsdelivr.net/npm/three@0.134.0/examples/jsm/loaders/RGBELoader.js';
import { OBJLoader } from 'https://cdn.jsdelivr.net/npm/three@0.134.0/examples/jsm/loaders/OBJLoader.js';

const canvas = document.getElementById('canvas');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
// Cap pixel ratio: 3x phones otherwise render 9x the pixels for no visible gain
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight, false);

const scene = new THREE.Scene();

// HDR environment for the chrome reflections
const hdrEquirect = new RGBELoader()
  .setPath('https://raw.githubusercontent.com/miroleon/gradient_hdr_freebie/main/Gradient_HDR_Freebies/')
  .load('ml_gradient_freebie_01.hdr', () => {
    hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
  });
scene.environment = hdrEquirect;

// Fog - if too dark go lower with the second value
scene.fog = new THREE.FogExp2(0x11151c, 0.15);

const group = new THREE.Group();
scene.add(group);

const pointlight = new THREE.PointLight(0x85ccb8, 7.5, 20);
pointlight.position.set(0, 3, 2);
group.add(pointlight);

const pointlight2 = new THREE.PointLight(0x9f85cc, 7.5, 20);
pointlight2.position.set(0, 3, 2);
group.add(pointlight2);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
group.add(camera);

const material = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0,
  metalness: 0.7,
  envMapIntensity: 10
});

let helm;
new OBJLoader().load('./assets/helm.obj', (object) => {
  object.children[0].material = material;
  object.scale.setScalar(10);
  object.position.set(0, -1.5, 0);
  group.add(object);
  helm = object;
  canvas.classList.add('ready');
});

// Pointer parallax (mouse + touch), smoothed in the render loop
const pointer = { x: 0, y: 0 };
const smooth = { x: 0, y: 0 };
window.addEventListener('pointermove', (e) => {
  pointer.x = e.clientX / window.innerWidth - 0.5;
  pointer.y = e.clientY / window.innerHeight - 0.5;
});

// Pull the camera back on portrait screens so the model doesn't swallow the layout
let radius = 10;
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  radius = camera.aspect < 1 ? 12 : 10;
  renderer.setSize(window.innerWidth, window.innerHeight, false);
}
window.addEventListener('resize', onWindowResize);
onWindowResize();

let theta = 0;
function update() {
  theta += 0.0025;

  smooth.x += (pointer.x - smooth.x) * 0.05;
  smooth.y += (pointer.y - smooth.y) * 0.05;

  const t = theta + smooth.x * 0.8;

  // Orbit the camera around the model
  camera.position.x = Math.sin(t) * radius;
  camera.position.z = Math.cos(t) * radius;
  camera.position.y = Math.cos(t) + smooth.y * 3;

  pointlight.position.x = Math.sin(theta + 1) * 11;
  pointlight.position.z = Math.cos(theta + 1) * 11;
  pointlight.position.y = 2 * Math.cos(theta - 3) + 3;

  pointlight2.position.x = -Math.sin(theta + 1) * 11;
  pointlight2.position.z = -Math.cos(theta + 1) * 11;
  pointlight2.position.y = 2 * -Math.cos(theta - 3) - 6;

  // Rotate the group to simulate the rotation of the HDR
  group.rotation.y += 0.01;

  // Spin the model itself (camera orbit alone barely reads as motion)
  if (helm) helm.rotation.y += 0.012;

  camera.lookAt(0, 0, 0);
}

function animate() {
  update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
