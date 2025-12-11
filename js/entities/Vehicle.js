import * as THREE from 'three';
import * as CANNON from 'cannon-es';

/**
 * Vehicle entity
 * Player and AI controlled car using RaycastVehicle
 */
export class Vehicle {
  constructor(id, team, config, physics) {
    this.id = id;
    this.team = team;
    this.config = config;
    this.physics = physics;
    
    this.mesh = null;
    this.chassisBody = null;
    this.vehicle = null;
    this.wheelMeshes = [];
    
    this.boost = 100;
    this.isBoosting = false;
    this.steeringValue = 0;
  }
  
  init(position) {
    this.createPhysics(position);
    this.createMesh();
  }
  
  createPhysics(position) {
    // Chassis
    const shape = new CANNON.Box(new CANNON.Vec3(
      this.config.vehicle.length / 2,
      this.config.vehicle.height / 2,
      this.config.vehicle.width / 2
    ));
    
    // Create body but add shape with offset to lower Center of Mass (COM)
    // By moving the shape UP relative to the body center, the body center (mass) ends up lower.
    this.chassisBody = new CANNON.Body({
      mass: this.config.vehicle.mass,
      position: new CANNON.Vec3(position.x, position.y + 3, position.z), // Spawn slightly higher
      angularDamping: 0.5
    });

    const comOffset = 0.5; // Offset shape UP -> Lowers COM
    this.chassisBody.addShape(shape, new CANNON.Vec3(0, comOffset, 0));
    
    this.physics.addBody(this.id, this.chassisBody);
    
    // Raycast Vehicle
    this.vehicle = new CANNON.RaycastVehicle({
      chassisBody: this.chassisBody,
      indexRightAxis: 2, // Z is right/left (width)
      indexUpAxis: 1,    // Y is up
      indexForwardAxis: 0 // X is forward
    });
    
    const options = {
      radius: 0.5,
      directionLocal: new CANNON.Vec3(0, -1, 0),
      suspensionStiffness: this.config.vehicle.suspensionStiffness || 30,
      suspensionRestLength: this.config.vehicle.suspensionRestLength || 0.6,
      frictionSlip: this.config.vehicle.frictionSlip || 1.4,
      dampingRelaxation: this.config.vehicle.dampingRelaxation || 2.3,
      dampingCompression: this.config.vehicle.dampingCompression || 4.4,
      maxSuspensionForce: this.config.vehicle.maxSuspensionForce || 100000,
      rollInfluence: this.config.vehicle.rollInfluence || 0.01,
      axleLocal: new CANNON.Vec3(0, 0, 1),
      chassisConnectionPointLocal: new CANNON.Vec3(1, 1, 0),
      maxSuspensionTravel: 0.3,
      customSlidingRotationalSpeed: -20,
      useCustomSlidingRotationalSpeed: true
    };
    
    const halfLength = this.config.vehicle.length / 2;
    // Use explicit axleWidth from config
    const axleWidth = (this.config.vehicle.axleWidth || 3.0) / 2;
    
    // Calculate height offset relative to body center
    // We want connection points near the bottom of the OFFSET chassis shape
    // Shape bottom is at: comOffset - height/2
    const heightOffset = comOffset - (this.config.vehicle.height / 2) + (this.config.vehicle.suspensionPos || 0);

    // Swap signs to match indexRightAxis=2 (Z is Right)
    // Front Left (0) - Negative Z
    options.chassisConnectionPointLocal.set(halfLength * 0.7, heightOffset, -axleWidth);
    this.vehicle.addWheel(options);

    // Front Right (1) - Positive Z
    options.chassisConnectionPointLocal.set(halfLength * 0.7, heightOffset, axleWidth);
    this.vehicle.addWheel(options);

    // Rear Left (2) - Negative Z
    options.chassisConnectionPointLocal.set(-halfLength * 0.7, heightOffset, -axleWidth);
    this.vehicle.addWheel(options);

    // Rear Right (3) - Positive Z
    options.chassisConnectionPointLocal.set(-halfLength * 0.7, heightOffset, axleWidth);
    this.vehicle.addWheel(options);

    this.vehicle.addToWorld(this.physics.world);
    
    // Wheel collision listener (for audio events maybe)
    this.vehicle.wheelInfos.forEach((wheel) => {
        // can attach listeners if needed
    });
    
    // Add collision listener to chassis for impacts
    this.chassisBody.addEventListener('collide', (e) => {
      const relativeVelocity = e.contact.getImpactVelocityAlongNormal();
      if (Math.abs(relativeVelocity) > 5) {
        this.lastCollisionForce = Math.abs(relativeVelocity);
      }
    });
  }
  
  createMesh() {
    this.mesh = new THREE.Group();
    
    // Chassis Mesh
    const bodyGeometry = new THREE.BoxGeometry(
      this.config.vehicle.length,
      this.config.vehicle.height,
      this.config.vehicle.width
    );
    
    const teamColor = this.config.teams[this.team].color;
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: teamColor,
      roughness: 0.4,
      metalness: 0.6
    });
    
    this.chassisMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.chassisMesh.castShadow = true;
    
    // Match the physics shape offset
    this.chassisMesh.position.set(0, 0.5, 0); // comOffset
    
    this.mesh.add(this.chassisMesh);
    
    // Wheel Meshes
    const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 24);
    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.8
    });
    
    // Rotate cylinder geometry so it rolls along Z axis when rotated by physics
    wheelGeometry.rotateX(Math.PI / 2);

    for (let i = 0; i < 4; i++) {
      const wheelMesh = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheelMesh.castShadow = true;
      this.mesh.add(wheelMesh);
      this.wheelMeshes.push(wheelMesh);
    }
  }
  
  applyCommands(commands, deltaTime) {
    if (!commands) return;

    // Safety Clamps - Prevent physics explosions
    const maxSpeed = this.config.vehicle.maxSpeed || 40;
    const currentSpeedSq = this.chassisBody.velocity.lengthSquared();
    if (currentSpeedSq > maxSpeed * maxSpeed) {
      this.chassisBody.velocity.normalize();
      this.chassisBody.velocity.scale(maxSpeed, this.chassisBody.velocity);
    }

    const maxSpin = this.config.vehicle.maxSpin || 5;
    const currentSpinSq = this.chassisBody.angularVelocity.lengthSquared();
    if (currentSpinSq > maxSpin * maxSpin) {
      this.chassisBody.angularVelocity.normalize();
      this.chassisBody.angularVelocity.scale(maxSpin, this.chassisBody.angularVelocity);
    }
    
    // Steering
    const maxSteerVal = 0.2;
    const steerSpeed = 2.0 * deltaTime;
    
    let targetSteer = 0;
    if (commands.left) targetSteer = maxSteerVal;
    if (commands.right) targetSteer = -maxSteerVal;
    
    // Simple Lerp for steering
    this.steeringValue += (targetSteer - this.steeringValue) * 0.2;
    
    this.vehicle.setSteeringValue(this.steeringValue, 0);
    this.vehicle.setSteeringValue(this.steeringValue, 1);
    
    // Engine Force
    const maxForce = this.config.vehicle.acceleration * this.config.vehicle.mass; // ~2700
    const brakeForce = this.config.vehicle.braking * this.config.vehicle.mass;
    
    let engineForce = 0;
    let brake = 0;
    
    if (commands.forward) {
      engineForce = maxForce;
    } else if (commands.backward) {
      engineForce = -maxForce / 2; // Reverse is slower
    }
    
    // Automatic braking if no input
    if (!commands.forward && !commands.backward) {
      brake = 10;
    }
    
    // Apply to rear wheels (RWD) or AWD
    this.vehicle.applyEngineForce(engineForce, 2);
    this.vehicle.applyEngineForce(engineForce, 3);
    this.vehicle.applyEngineForce(engineForce, 0); // AWD for better control
    this.vehicle.applyEngineForce(engineForce, 1);
    
    this.vehicle.setBrake(brake, 0);
    this.vehicle.setBrake(brake, 1);
    this.vehicle.setBrake(brake, 2);
    this.vehicle.setBrake(brake, 3);
    
    // Boost
    this.isBoosting = false;
    if (commands.boost && this.boost > 0) {
      this.isBoosting = true;
      const forward = new CANNON.Vec3(1, 0, 0);
      this.chassisBody.quaternion.vmult(forward, forward);
      
      const boostForce = this.config.vehicle.boostForce * this.config.vehicle.mass;
      this.chassisBody.applyForce(forward.scale(boostForce), this.chassisBody.position);
      
      this.boost = Math.max(0, this.boost - this.config.vehicle.boostDrainRate * deltaTime);
    } else {
      this.boost = Math.min(100, this.boost + this.config.vehicle.boostRegenRate * deltaTime);
    }
    
    // Jump
    const onGround = this.vehicle.numWheelsOnGround > 0;
    if (commands.jump && onGround) {
      const up = new CANNON.Vec3(0, 1, 0);
      this.chassisBody.quaternion.vmult(up, up);
      this.chassisBody.velocity.vadd(up.scale(this.config.vehicle.jumpForce), this.chassisBody.velocity);
      this.justJumped = true;
    }
    
    // Auto-flip / Recovery mechanics
    // Detect if car is flipped or stuck on side
    const up = new CANNON.Vec3(0, 1, 0);
    this.chassisBody.quaternion.vmult(up, up);
    const isFlipped = up.y < 0.3;
    const isStuck = this.vehicle.numWheelsOnGround < 2 && Math.abs(this.chassisBody.velocity.y) < 0.1;

    if (isFlipped || isStuck) {
      // Allow flipping with movement keys or jump
      if (commands.forward || commands.backward || commands.jump || commands.left || commands.right) {
        
        // Apply rotation torque to flip upright
        const torqueStrength = 400 * deltaTime;
        const torque = new CANNON.Vec3(0, 0, 0);
        
        // Pitch control (Forward/Back)
        if (commands.forward) torque.x += torqueStrength;
        if (commands.backward) torque.x -= torqueStrength;
        
        // Roll control (Left/Right)
        if (commands.left) torque.z += torqueStrength;
        if (commands.right) torque.z -= torqueStrength;

        // Jump button provides a big kick to help flip
        if (commands.jump) {
            // Upward impulse
            this.chassisBody.velocity.y += 5 * deltaTime;
            // Roll torque
            torque.z -= torqueStrength * 5; 
        }

        // Apply local torque
        this.chassisBody.quaternion.vmult(torque, torque);
        this.chassisBody.angularVelocity.vadd(torque, this.chassisBody.angularVelocity);
      }
    }
    
    // Air Control (Pitch/Yaw/Roll adjustment while in air)
    if (!onGround && !isFlipped) {
      // Reduce rotation power significantly to prevent uncontrollable spinning
      const rotSpeed = 1.0 * deltaTime; 
      const torque = new CANNON.Vec3(0, 0, 0);
      
      if (commands.forward) torque.z -= rotSpeed * 200; // Pitch down
      if (commands.backward) torque.z += rotSpeed * 200; // Pitch up
      if (commands.left) torque.y += rotSpeed * 200; // Yaw left
      if (commands.right) torque.y -= rotSpeed * 200; // Yaw right
      
      // Roll adjustment (auto-leveling)
      // If no input, try to upright the car slightly?
      // For now just basic air control.

      // Transform torque to world space
      this.chassisBody.quaternion.vmult(torque, torque);
      this.chassisBody.angularVelocity.vadd(torque, this.chassisBody.angularVelocity);

      // Stronger angular damping in air to prevent yeeting
      this.chassisBody.angularVelocity.scale(0.95, this.chassisBody.angularVelocity);
    } else {
       // Reset regular damping when on ground
       this.chassisBody.angularDamping = 0.5;
    }

    this.updateMesh();
  }
  
  updateMesh() {
    // 1. Update Group position to match Chassis
    this.mesh.position.copy(this.chassisBody.position);
    this.mesh.quaternion.copy(this.chassisBody.quaternion);
    
    // 2. Update Wheel Meshes
    // Calculate inverse chassis transform to convert world wheel pos to local
    const invPos = this.chassisBody.position.clone().negate();
    const invQuat = this.chassisBody.quaternion.clone().inverse();
    
    for (let i = 0; i < this.vehicle.wheelInfos.length; i++) {
      this.vehicle.updateWheelTransform(i);
      const t = this.vehicle.wheelInfos[i].worldTransform;
      
      // Convert world transform 't' to local space of 'this.mesh'
      // LocalPos = InvQuat * (WorldPos + InvPos)
      const worldPos = t.position;
      const localPos = new CANNON.Vec3();
      worldPos.vadd(invPos, localPos);
      invQuat.vmult(localPos, localPos);
      
      // LocalRot = InvQuat * WorldRot
      const worldRot = t.quaternion;
      const localRot = invQuat.mult(worldRot);
      
      this.wheelMeshes[i].position.copy(localPos);
      this.wheelMeshes[i].quaternion.copy(localRot);
    }
  }
  
  setPosition(position) {
    this.chassisBody.position.set(position.x, position.y + 2, position.z); // Spawn safe
    this.chassisBody.velocity.set(0, 0, 0);
    this.chassisBody.angularVelocity.set(0, 0, 0);
    this.chassisBody.quaternion.set(0, 0, 0, 1);
    this.steeringValue = 0;
    this.updateMesh();
  }
  
  setVelocity(velocity) {
    this.chassisBody.velocity.set(velocity.x, velocity.y, velocity.z);
    this.chassisBody.angularVelocity.set(0, 0, 0);
  }
  
  setTeam(team) {
    this.team = team;
    const teamColor = this.config.teams[team].color;
    this.chassisMesh.material.color.setHex(teamColor);
  }
  
  getState() {
    return {
      position: {
        x: this.chassisBody.position.x,
        y: this.chassisBody.position.y,
        z: this.chassisBody.position.z
      },
      velocity: {
        x: this.chassisBody.velocity.x,
        y: this.chassisBody.velocity.y,
        z: this.chassisBody.velocity.z
      },
      rotation: {
        x: this.chassisBody.quaternion.x,
        y: this.chassisBody.quaternion.y,
        z: this.chassisBody.quaternion.z,
        w: this.chassisBody.quaternion.w
      },
      boost: this.boost,
      onGround: this.vehicle.numWheelsOnGround > 0,
      isBoosting: this.isBoosting
    };
  }
  
  get body() {
    return this.chassisBody;
  }
}