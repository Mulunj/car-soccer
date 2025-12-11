import * as CANNON from 'cannon-es';
import * as THREE from 'three';

/**
 * VehicleController - handles driving logic, input application, and mesh syncing
 */
export class VehicleController {
  constructor(config, chassis, wheels, mesh) {
    this.config = config;
    this.chassis = chassis;
    this.wheels = wheels;
    this.mesh = mesh;

    this.boost = 100;
    this.isBoosting = false;
    this.steeringValue = 0;
    this.justJumped = false;
  }

  init(position) {
    // Expose mesh group for convenient addition to scene
    this.mesh.group.position.set(position.x, position.y, position.z);
    this.updateMesh();
  }

  applyCommands(commands, deltaTime) {
    if (!commands) return;

    const body = this.chassis.body;
    const vehicle = this.wheels.vehicle;

    // Safety clamps
    const maxSpeed = this.config.vehicle.maxSpeed || 40;
    const currentSpeedSq = body.velocity.lengthSquared();
    if (currentSpeedSq > maxSpeed * maxSpeed) {
      body.velocity.normalize();
      body.velocity.scale(maxSpeed, body.velocity);
    }

    const maxSpin = this.config.vehicle.maxSpin || 5;
    const currentSpinSq = body.angularVelocity.lengthSquared();
    if (currentSpinSq > maxSpin * maxSpin) {
      body.angularVelocity.normalize();
      body.angularVelocity.scale(maxSpin, body.angularVelocity);
    }

    // Steering
    const maxSteerVal = 0.2;
    let targetSteer = 0;
    if (commands.left) targetSteer = maxSteerVal;
    if (commands.right) targetSteer = -maxSteerVal;
    this.steeringValue += (targetSteer - this.steeringValue) * 0.2;

    if (vehicle) {
      vehicle.setSteeringValue(this.steeringValue, 0);
      vehicle.setSteeringValue(this.steeringValue, 1);
    }

    // Engine/brake
    const maxForce = this.config.vehicle.acceleration * this.config.vehicle.mass;
    let engineForce = 0;
    let brake = 0;
    if (commands.forward) engineForce = maxForce;
    else if (commands.backward) engineForce = -maxForce / 2;
    if (!commands.forward && !commands.backward) brake = 10;

    if (vehicle) {
      vehicle.applyEngineForce(engineForce, 0);
      vehicle.applyEngineForce(engineForce, 1);
      vehicle.applyEngineForce(engineForce, 2);
      vehicle.applyEngineForce(engineForce, 3);

      vehicle.setBrake(brake, 0);
      vehicle.setBrake(brake, 1);
      vehicle.setBrake(brake, 2);
      vehicle.setBrake(brake, 3);
    }

    // Boost
    this.isBoosting = false;
    if (commands.boost && this.boost > 0) {
      this.isBoosting = true;
      const forward = new CANNON.Vec3(1, 0, 0);
      body.quaternion.vmult(forward, forward);
      const boostForce = this.config.vehicle.boostForce * this.config.vehicle.mass;
      body.applyForce(forward.scale(boostForce), body.position);
      this.boost = Math.max(0, this.boost - this.config.vehicle.boostDrainRate * deltaTime);
    } else {
      this.boost = Math.min(100, this.boost + this.config.vehicle.boostRegenRate * deltaTime);
    }

    // Jump
    const onGround = vehicle ? vehicle.numWheelsOnGround > 0 : false;
    if (commands.jump && onGround) {
      const up = new CANNON.Vec3(0, 1, 0);
      body.quaternion.vmult(up, up);
      body.velocity.vadd(up.scale(this.config.vehicle.jumpForce), body.velocity);
      this.justJumped = true;
    }

    // Recovery & air control (kept simple and restrained)
    const upVec = new CANNON.Vec3(0, 1, 0);
    body.quaternion.vmult(upVec, upVec);
    const isFlipped = upVec.y < 0.3;
    const isStuck = vehicle && vehicle.numWheelsOnGround < 2 && Math.abs(body.velocity.y) < 0.1;

    // Air control (when not on ground and not just stuck/flipped)
    if (!onGround && !isFlipped && !isStuck) {
      const airTurnSpeed = 1.5; // Target radians per second
      const airPitchSpeed = 1.5;
      
      // Calculate target angular velocity
      const targetAngVel = new CANNON.Vec3(0, 0, 0);
      
      // Yaw (turning)
      if (commands.left) targetAngVel.y = airTurnSpeed;
      if (commands.right) targetAngVel.y = -airTurnSpeed;
      
      // Pitch (tilting forward/back)
      if (commands.forward) targetAngVel.x = -airPitchSpeed;
      if (commands.backward) targetAngVel.x = airPitchSpeed;

      // Roll (optional, mapped to same keys or modifiers? simple for now)
      
      // Apply torque to reach target angular velocity
      // Proportional control
      const kp = 200; // Torque multiplier
      const currentAngVel = body.angularVelocity;
      
      if (targetAngVel.lengthSquared() > 0.01) {
        // Transform target axis to world space? No, controls are usually local-ish or camera relative.
        // For simplicity in air, Local controls are best.
        
        // Convert local target to world
        const worldTarget = new CANNON.Vec3();
        body.quaternion.vmult(targetAngVel, worldTarget);
        
        const diff = new CANNON.Vec3();
        worldTarget.vsub(currentAngVel, diff);
        
        // Apply torque
        const torque = diff.scale(kp * deltaTime);
        body.angularVelocity.vadd(torque, body.angularVelocity);
      } else {
        // Auto-stabilize / dampen rotation when no input
        body.angularVelocity.scale(0.98, body.angularVelocity);
      }
    }
    
    // Recovery flip (only when actually flipped on ground)
    if (isFlipped && (commands.jump || commands.left || commands.right)) {
      const flipForce = 15000 * deltaTime; // Impulse-like torque
      const torque = new CANNON.Vec3(0, 0, 0);

      // Roll to flip over
      torque.z = -flipForce; // Always try to roll sideways
      if (commands.left) torque.z = flipForce;
      
      // Add a little upward pop
      if (commands.jump && Math.random() < 0.1) {
        body.velocity.y += 2;
      }

      const worldTorque = new CANNON.Vec3();
      body.quaternion.vmult(torque, worldTorque);
      body.angularVelocity.vadd(worldTorque.scale(0.01), body.angularVelocity); // Scale down for velocity addition
    }

    // Sync mesh after physics changes
    this.updateMesh();
  }

  updateMesh() {
    const body = this.chassis.body;
    if (!body) return;

    // Update mesh group to match chassis
    this.mesh.group.position.copy(body.position);
    this.mesh.group.quaternion.copy(body.quaternion);

    // Update wheel positions using wheel world transforms
    const vehicle = this.wheels.vehicle;
    if (!vehicle) return;
    for (let i = 0; i < vehicle.wheelInfos.length; i++) {
      vehicle.updateWheelTransform(i);
      const t = vehicle.wheelInfos[i].worldTransform;

      // Convert world wheel transform to local mesh group space
      const invPos = body.position.clone().negate();
      const invQuat = body.quaternion.clone().inverse();

      const worldPos = t.position;
      const localPos = new CANNON.Vec3();
      worldPos.vadd(invPos, localPos);
      invQuat.vmult(localPos, localPos);

      const worldRot = t.quaternion;
      const localRot = invQuat.mult(worldRot);

      // Apply to THREE meshes
      this.mesh.wheelMeshes[i].position.copy(localPos);
      this.mesh.wheelMeshes[i].quaternion.copy(localRot);
    }
  }

  setPosition(position) {
    const body = this.chassis.body;
    body.position.set(position.x, position.y + 2, position.z);
    body.velocity.set(0, 0, 0);
    body.angularVelocity.set(0, 0, 0);
    body.quaternion.set(0, 0, 0, 1);
    this.steeringValue = 0;
    this.updateMesh();
  }

  setVelocity(velocity) {
    const body = this.chassis.body;
    body.velocity.set(velocity.x, velocity.y, velocity.z);
    body.angularVelocity.set(0, 0, 0);
  }

  getState() {
    const body = this.chassis.body;
    const vehicle = this.wheels.vehicle;
    return {
      position: { x: body.position.x, y: body.position.y, z: body.position.z },
      velocity: { x: body.velocity.x, y: body.velocity.y, z: body.velocity.z },
      rotation: {
        x: body.quaternion.x, y: body.quaternion.y, z: body.quaternion.z, w: body.quaternion.w
      },
      boost: this.boost,
      onGround: vehicle ? vehicle.numWheelsOnGround > 0 : false,
      isBoosting: this.isBoosting
    };
  }
}

