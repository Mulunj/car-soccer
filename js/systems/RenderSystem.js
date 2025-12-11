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

    // Camera orbit offsets (relative to car)
    this.cameraYawOffset = 0;
    this.cameraPitchOffset = 0;
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
  
  render(gameState, cameraInput = { x: 0, y: 0 }, deltaTime = 0) {
    // Update camera to follow player
    const playerVehicle = gameState.vehicles['player'];
    if (playerVehicle && this.renderObjects?.vehicles['player']) {
      this.updateCamera(playerVehicle, cameraInput, deltaTime);
    }
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
  }
  
  updateCamera(playerState, cameraInput = { x: 0, y: 0 }, deltaTime = 0) {
    const targetPos = new THREE.Vector3(
      playerState.position.x,
      playerState.position.y,
      playerState.position.z
    );
    
    // Smooth camera follow target
    this.cameraTarget.lerp(targetPos, this.config.camera.stiffness);

    // Vehicle orientation
    const vehicleQuat = new THREE.Quaternion(
      playerState.rotation.x,
      playerState.rotation.y,
      playerState.rotation.z,
      playerState.rotation.w || 1
    ).normalize();

    // Compute forward speed to know when car is moving forward
    const forwardWorld = new THREE.Vector3(1, 0, 0).applyQuaternion(vehicleQuat);
    const vel = new THREE.Vector3(
      playerState.velocity.x,
      playerState.velocity.y,
      playerState.velocity.z
    );
    const forwardSpeed = vel.dot(forwardWorld);
    const isMovingForward = forwardSpeed > 2; // small threshold

    // Update camera orbit offsets from right stick
    const yawSpeed = 1.5;   // radians/sec
    const pitchSpeed = 1.2; // radians/sec
    const returnSpeed = 2.0; // lerp speed back to default

    if (deltaTime > 0) {
      // Apply stick input
      if (cameraInput.x !== 0 || cameraInput.y !== 0) {
        this.cameraYawOffset += -cameraInput.x * yawSpeed * deltaTime;
        this.cameraPitchOffset += -cameraInput.y * pitchSpeed * deltaTime;
      } else if (isMovingForward) {
        // Auto-orbit back to default when moving forward and stick is neutral
        this.cameraYawOffset += (0 - this.cameraYawOffset) * Math.min(1, returnSpeed * deltaTime);
        this.cameraPitchOffset += (0 - this.cameraPitchOffset) * Math.min(1, returnSpeed * deltaTime);
      }
    }

    // Clamp vertical rotation
    const maxPitch = this.config.camera.maxVerticalAngle;
    this.cameraPitchOffset = Math.max(-maxPitch, Math.min(maxPitch, this.cameraPitchOffset));

    // Base offset in vehicle local space (behind car along -X)
    const offset = new THREE.Vector3(-this.config.camera.distance, 0, 0);

    // Apply local camera orbit (pitch then yaw)
    const camEuler = new THREE.Euler(this.cameraPitchOffset, this.cameraYawOffset, 0, 'YXZ');
    offset.applyEuler(camEuler);
    offset.y += this.config.camera.height;

    // Transform offset by vehicle rotation to world space
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