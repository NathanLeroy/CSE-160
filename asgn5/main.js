import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/MTLLoader.js';


const mazeMap = [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,1,0,0,0,0,1],
        [1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,1,1,0,0,1,1,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1],
      
        [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1,1,1,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
      
        [1,0,0,0,0,1,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
      
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1]
];



function addMaze(scene) {
    const wallGeometry = new THREE.BoxGeometry(1,2,1);
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc
    });
  
    const rows = mazeMap.length;
    const cols = mazeMap[0].length;
  
    const xOffset = cols / 2;
    const zOffset = rows / 2;
  
    for (let z = 0; z < rows; z++) {
  
      for (let x = 0; x < cols; x++) {
  
        if (mazeMap[z][x] === 1) {
  
          const wall = new THREE.Mesh(wallGeometry, wallMaterial);
  
          wall.position.set(
            x - xOffset,
            1,
            z - zOffset
          );
  
          scene.add(wall);
  
        }
  
      }
  
    }
  
  }


function main() {

  const canvas = document.querySelector('#c');

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true
  });

  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();

  const mtlLoader = new MTLLoader();

    mtlLoader.load('models/WinnerCup.mtl', (materials) => {
    materials.preload();

    const objLoader = new OBJLoader();
    objLoader.setMaterials(materials);

    objLoader.load(
        'models/WinnerCup.obj',
        (cup) => {
        cup.scale.set(0.005,0.005,0.005);
        cup.position.set(-10, 1, 8);
        scene.add(cup);
        },
        undefined,
        (error) => {
        console.error('Error loading OBJ:', error);
        }
    );
    }, undefined, (error) => {
    console.error('Error loading MTL:', error);
    });

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  camera.position.set(0, 5, 15);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.update();

  // Lighting

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(10, 20, 10);
  scene.add(directionalLight);

  const pointLight = new THREE.PointLight(0xff6600, 2);
  pointLight.position.set(0, 5, 0);
  scene.add(pointLight);

  // Floor

  const textureLoader = new THREE.TextureLoader();
  const floorTexture = textureLoader.load("textures/pool.jpg");

  const floorGeometry = new THREE.BoxGeometry(40, .5, 40);
  const floorMaterial = new THREE.MeshStandardMaterial({ map: floorTexture });

  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.position.y = -0.25;

  scene.add(floor);


  // Sphere

  const lavaTexture = textureLoader.load("textures/lava.jpg");

  const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
  const sphereMaterial = new THREE.MeshStandardMaterial({
    map: lavaTexture,
    emissive: 0xaa3300
  });

  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphere.position.set(0, 2, 0);

  scene.add(sphere);

  // Cube

  const cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
  const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x14aa33 });

  const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  cube.position.set(5, 1, 0);

  scene.add(cube);

  // Cylinder

  const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 3, 32);
  const cylinderMaterial = new THREE.MeshStandardMaterial({ color: 0x3182ff });

  const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
  cylinder.position.set(-5, 1.5, 0);

  scene.add(cylinder);

  // Maze

  addMaze(scene);


  // Skybox

  const sky = textureLoader.load("textures/sky.jpg");
  scene.background = sky;

  function animate(time) {

    time *= 0.001;

    sphere.rotation.y = time;
    sphere.position.y = 2 + Math.sin(time * 2) * 0.5;

    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    renderer.render(scene, camera);

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

main();