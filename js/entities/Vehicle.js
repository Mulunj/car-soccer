import * as THREE from 'three';
import * as CANNON from 'cannon-es';

/**
 * Vehicle entity
 * Player and AI controlled car
 */
export class Vehicle {
  constructor(id, team, config, physics) {
    this.id = id;
    this.team = team;
    this.config = config;
    this.physics = physics;
    
    this.mesh = null;
    this.body = null;
    this.boost = 100;
    this.canJump = false;
    this.isBoosting = false; // Track boosting state
  }
  
  init(position) {
    this.createMesh();
    this.createPhysicsBody(position);
  }
  
  createMesh() {
    const group = new THREE.Group();
    
    // Car body
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
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    group.add(body);
    
    // Wheels (visual only)
    this.addWheels(group);
    
    this.mesh = group;
  }
  
  addWheels(group) {
    const wheelRadius = 0.5;
    const wheelWidth = 0.4;
    const wheelGeometry = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.8
    });
    
    // Place wheels roughly at the four corners, oriented to look like real car wheels
    const halfLength = this.config.vehicle.length / 2;
    const halfWidth = this.config.vehicle.width / 2;
    const wheelY = -this.config.vehicle.height / 2 + wheelRadius * 0.6;

    const positions = [
      // Front left
      { x: halfLength * 0.7, y: wheelY, z: halfWidth * 0.9 },
      // Front right
      { x: halfLength * 0.7, y: wheelY, z: -halfWidth * 0.9 },
      // Rear left
      { x: -halfLength * 0.7, y: wheelY, z: halfWidth * 0.9 },
      // Rear right
      { x: -halfLength * 0.7, y: wheelY, z: -halfWidth * 0.9 }
    ];
    
    positions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      // Rotate so the cylinder axis aligns with the car's width (z), like a real wheel
      // Align wheel cylinders so they sit correctly beside the car (rotate 90deg around X)
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(pos.x, pos.y, pos.z);
      wheel.castShadow = true;
      group.add(wheel);
    });
  }
  
  createPhysicsBody(position) {
    const shape = new CANNON.Box(new CANNON.Vec3(
      this.config.vehicle.length / 2,
      this.config.vehicle.height / 2,
      this.config.vehicle.width / 2
    ));
    
    this.body = new CANNON.Body({
      mass: this.config.vehicle.mass,
      shape: shape,
      position: new CANNON.Vec3(position.x, position.y, position.z),
      linearDamping: 0.1,
      angularDamping: 0.2
    });
    
    // Prevent car from tipping too easily
    this.body.fixedRotation = false;
    this.body.updateMassProperties();
    
    this.physics.addBody(this.id, this.body);
    
    // Contact listener for jump
    this.body.addEventListener('collide', (e) => {
      // Check if we hit the ground
      const contact = e.contact;
      const normal = contact.ni;
      
      // If normal points up, we're on ground
      if (normal.y > 0.5) {
        this.canJump = true;
      }
      
      // Collision sound logic
      // Calculate relative velocity along normal
      const relativeVelocity = e.contact.getImpactVelocityAlongNormal();
      
      if (Math.abs(relativeVelocity) > 5) {
        // Trigger collision event
        // We can't access GameState here directly, so we store it on the instance
        // and GameSimulation picks it up, or we pass a callback.
        // For simplicity, let's mark it as a property the simulation checks.
        this.lastCollisionForce = Math.abs(relativeVelocity);
      }
    });
    
    this.updateMesh();
  }
  
  applyCommands(commands, deltaTime) {
    if (!commands) return;
    
    const forward = new CANNON.Vec3(1, 0, 0);
    const right = new CANNON.Vec3(0, 0, 1);
    
    // Rotate direction vectors by car's rotation
    this.body.quaternion.vmult(forward, forward);
    this.body.quaternion.vmult(right, right);
    
    // Forward/backward
    if (commands.forward) {
      this.body.applyForce(
        forward.scale(this.config.vehicle.acceleration * this.config.vehicle.mass),
        this.body.position
      );
    }
    if (commands.backward) {
      this.body.applyForce(
        forward.scale(-this.config.vehicle.braking * this.config.vehicle.mass),
        this.body.position
      );
    }
    
    // Turning (only when moving)
    const speed = this.body.velocity.length();
    if (speed > 1) {
      if (commands.left) {
        this.body.angularVelocity.y += this.config.vehicle.turnSpeed * deltaTime;
      }
      if (commands.right) {
        this.body.angularVelocity.y -= this.config.vehicle.turnSpeed * deltaTime;
      }
    }
    
    // Jump
    if (commands.jump && this.canJump) {
      this.body.velocity.y = this.config.vehicle.jumpForce;
      this.canJump = false;
      this.justJumped = true; // Flag for audio
    }
    
    // Boost
    this.isBoosting = false;
    if (commands.boost && this.boost > 0) {
      this.body.applyForce(
        forward.scale(this.config.vehicle.boostForce * this.config.vehicle.mass),
        this.body.position
      );
      this.boost = Math.max(0, this.boost - this.config.vehicle.boostDrainRate * deltaTime);
      this.isBoosting = true;
    } else {
      // Regenerate boost
      this.boost = Math.min(100, this.boost + this.config.vehicle.boostRegenRate * deltaTime);
    }
    
    // Limit max speed
    const currentSpeed = this.body.velocity.length();
    if (currentSpeed > this.config.vehicle.maxSpeed) {
      this.body.velocity.scale(this.config.vehicle.maxSpeed / currentSpeed, this.body.velocity);
    }
    
    this.updateMesh();
  }
  
  updateMesh() {
    this.mesh.position.copy(this.body.position);
    this.mesh.quaternion.copy(this.body.quaternion);
  }
  
  setPosition(position) {
    this.body.position.set(position.x, position.y, position.z);
    this.body.quaternion.set(0, 0, 0, 1);
    this.updateMesh();
  }
  
  setVelocity(velocity) {
    this.body.velocity.set(velocity.x, velocity.y, velocity.z);
    this.body.angularVelocity.set(0, 0, 0);
  }
  
  setTeam(team) {
    this.team = team;
    // Update mesh color
    const teamColor = this.config.teams[team].color;
    this.mesh.children[0].material.color.setHex(teamColor);
  }
  
  getState() {
    return {
      position: {
        x: this.body.position.x,
        y: this.body.position.y,
        z: this.body.position.z
      },
      velocity: {
        x: this.body.velocity.x,
        y: this.body.velocity.y,
        z: this.body.velocity.z
      },
      rotation: {
        x: this.body.quaternion.x,
        y: this.body.quaternion.y,
        z: this.body.quaternion.z
      },
      boost: this.boost,
      onGround: this.canJump,
      isBoosting: this.isBoosting
    };
  }
}