import * as CANNON from 'cannon-es';

/**
 * Chassis component - sets up chassis body and basic collision handling
 */
export class Chassis {
  constructor(id, team, config, physics) {
    this.id = id;
    this.team = team;
    this.config = config;
    this.physics = physics;

    this.chassisBody = null;
  }

  init(position) {
    // Create chassis body and lower COM by offsetting shape
    const halfExtents = new CANNON.Vec3(
      this.config.vehicle.length / 2,
      this.config.vehicle.height / 2,
      this.config.vehicle.width / 2
    );
    const shape = new CANNON.Box(halfExtents);

    this.chassisBody = new CANNON.Body({
      mass: this.config.vehicle.mass,
      position: new CANNON.Vec3(position.x, position.y + 3, position.z),
      angularDamping: 0.5
    });

    const comOffset = 0.5;
    this.chassisBody.addShape(shape, new CANNON.Vec3(0, comOffset, 0));

    this.physics.addBody(this.id, this.chassisBody);

    // Collision listener for impact events
    this.lastCollisionForce = 0;
    this.chassisBody.addEventListener('collide', (e) => {
      const relativeVelocity = e.contact.getImpactVelocityAlongNormal();
      if (Math.abs(relativeVelocity) > 5) {
        this.lastCollisionForce = Math.abs(relativeVelocity);
      }
    });
  }

  get body() {
    return this.chassisBody;
  }
}

