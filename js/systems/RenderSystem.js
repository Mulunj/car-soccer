import * as THREE from 'three';

/**
 * Rendering system
 * Manages Three.js scene, camera, and rendering
 */
export class RenderSystem {
  constructor(config) {
    this.config = config;
    
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    
    this.renderObjects = null;
    this.cameraTarget = new THREE.Vector3();
    this.cameraPosition = new THREE.Vector3();
  }
  
  async init() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0a);
    this.scene.fog = new THREE.Fog(0x0a0a0a, 100, 200);
    
    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      this.config.render.fov,
      window.innerWidth / window.innerHeight,
      this.config.render.near,
      this.config.render.far
    );
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    document.getElementById('game-container').appendChild(this.renderer.domElement);
    
    // Add lights
    this.setupLights();
  }
  
  setupLights() {
    // Ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambient);
    
    // Main directional light
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(50, 80, 30);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = this.config.render.shadowMapSize;
    mainLight.shadow.mapSize.height = this.config.render.shadowMapSize;
    mainLight.shadow.camera.left = -100;
    mainLight.shadow.camera.right = 100;
    mainLight.shadow.camera.top = 100;
    mainLight.shadow.camera.bottom = -100;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 200;
    this.scene.add(mainLight);
    
    // Fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-50, 40, -30);
    this.scene.add(fillLight);
  }
  
  setRenderObjects(objects) {
    // Clear existing objects
    if (this.renderObjects) {
      if (this.renderObjects.arena) this.scene.remove(this.renderObjects.arena);
      if (this.renderObjects.ball) this.scene.remove(this.renderObjects.ball);
      if (this.renderObjects.vehicles) {
        Object.values(this.renderObjects.vehicles).forEach(v => this.scene.remove(v));
      }
    }
    
    // Add new objects
    this.renderObjects = objects;
    if (objects.arena) this.scene.add(objects.arena);
    if (objects.ball) this.scene.add(objects.ball);
    if (objects.vehicles) {
      Object.values(objects.vehicles).forEach(v => this.scene.add(v));
    }
  }
  
  render(gameState) {
    // Update camera to follow player
    const playerVehicle = gameState.vehicles['player'];
    if (playerVehicle && this.renderObjects?.vehicles['player']) {
      this.updateCamera(playerVehicle);
    }
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
  }
  
  updateCamera(playerState) {
    const targetPos = new THREE.Vector3(
      playerState.position.x,
      playerState.position.y,
      playerState.position.z
    );
    
    // Smooth camera follow
    this.cameraTarget.lerp(targetPos, this.config.camera.stiffness);
    
    // Position camera behind and above the vehicle
    const offset = new THREE.Vector3(
      -this.config.camera.distance,
      this.config.camera.height,
      0
    );
    
    // Rotate offset based on vehicle rotation
    const vehicleQuat = new THREE.Quaternion(
      playerState.rotation.x,
      playerState.rotation.y,
      playerState.rotation.z,
      1
    ).normalize();
    offset.applyQuaternion(vehicleQuat);
    
    const desiredPosition = this.cameraTarget.clone().add(offset);
    this.cameraPosition.lerp(desiredPosition, this.config.camera.stiffness);
    
    this.camera.position.copy(this.cameraPosition);
    this.camera.lookAt(this.cameraTarget);
  }
  
  handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}