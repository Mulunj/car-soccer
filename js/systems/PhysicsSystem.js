import * as CANNON from 'cannon-es';

/**
 * Physics system using Cannon.js
 * Manages the physics world and simulation
 */
export class PhysicsSystem {
  constructor(config) {
    this.config = config;
    this.world = null;
    this.bodies = new Map();
  }

  init() {
    // Create physics world
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -30, 0)
    });

    // Set solver iterations for better stability
    this.world.solver.iterations = 10;

    // Enable collision detection
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);

    // Default contact material
    const defaultMaterial = new CANNON.Material('default');
    const defaultContactMaterial = new CANNON.ContactMaterial(
      defaultMaterial,
      defaultMaterial,
      {
        friction: 0.1,
        restitution: 0.2
      }
    );
    this.world.addContactMaterial(defaultContactMaterial);
    this.world.defaultContactMaterial = defaultContactMaterial;
  }

  step(deltaTime) {
    // Cap deltaTime to avoid physics explosions
    const maxDelta = 1 / 30;
    const dt = Math.min(deltaTime, maxDelta);

    this.world.step(dt);
  }

  addBody(id, body) {
    this.world.addBody(body);
    this.bodies.set(id, body);
  }

  removeBody(id) {
    const body = this.bodies.get(id);
    if (body) {
      this.world.removeBody(body);
      this.bodies.delete(id);
    }
  }

  getBody(id) {
    return this.bodies.get(id);
  }
}