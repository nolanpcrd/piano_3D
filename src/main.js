import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const light = new THREE.AmbientLight(0xffffff);
scene.add(light);

const directionalLight = new THREE.DirectionalLight(0xffffff, 5);
directionalLight.position.set(0, 1, -2);
scene.add(directionalLight);

const renderer = new THREE.WebGLRenderer({canvas: document.getElementById("canvas"), antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enableZoom = true;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let mixer = null;
let animations = {};
let interactableMeshes = [];

const loader = new GLTFLoader();
loader.load('../piano.glb', function (gltf) {
  scene.add(gltf.scene);

  mixer = new THREE.AnimationMixer(gltf.scene);

  gltf.animations.forEach((clip) => {
    const meshName = clip.name.split("_Press")[0];
    const mesh = gltf.scene.getObjectByName(meshName);
    if (mesh) {
      animations[meshName] = mixer.clipAction(clip);
      interactableMeshes.push(mesh);
    }
  });

}, undefined, function (error) {
  console.error(error);
});

function onMouseClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(interactableMeshes, true);

  if (intersects.length > 0) {
    const clickedObject = intersects[0].object;
    const animation = animations[clickedObject.name];

    if (animation) {
      animation.reset().play();
      startSound(clickedObject.name);

      const animationDuration = animation.getClip().duration * 1400;
      setTimeout(() => {
        animation.stop();
      }, 350);
    }
  }
}


window.addEventListener('click', onMouseClick);

function animate() {
  if (mixer) {
    mixer.update(0.01);
  }
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function startSound(note) {
  note = note.replace("#", "Sharp");
  const audio = new Audio(`../sounds/${note}.wav`);
  audio.play();
}

animate();
