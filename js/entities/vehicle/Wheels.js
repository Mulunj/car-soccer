import * as CANNON from 'cannon-es';

/**
 * Wheels component - creates RaycastVehicle and wheel configuration
 */
export class Wheels {
  constructor(config, physics, chassis) {
    this.config = config;
    this.physics = physics;
    this.chassis = chassis;

    this.vehicle = null;
  }

  init(position) {
    // Setup RaycastVehicle
    this.vehicle = new CANNON.RaycastVehicle({
      chassisBody: this.chassis.body,
      indexRightAxis: 2,
      indexUpAxis: 1,
      indexForwardAxis: 0
    });

    const optionsTemplate = {
      radius: 0.5,
      directionLocal: new CANNON.Vec3(0, -1, 0),
      suspensionStiffness: this.config.vehicle.suspensionStiffness,
      suspensionRestLength: this.config.vehicle.suspensionRestLength,
      frictionSlip: this.config.vehicle.frictionSlip,
      dampingRelaxation: this.config.vehicle.dampingRelaxation,
      dampingCompression: this.config.vehicle.dampingCompression,
      maxSuspensionForce: this.config.vehicle.maxSuspensionForce,
      rollInfluence: this.config.vehicle.rollInfluence,
      axleLocal: new CANNON.Vec3(0, 0, 1),
      chassisConnectionPointLocal: new CANNON.Vec3(1, 1, 0),
      maxSuspensionTravel: 0.3,
      customSlidingRotationalSpeed: -20,
      useCustomSlidingRotationalSpeed: true
    };

    const halfLength = this.config.vehicle.length / 2;
    const axleWidth = (this.config.vehicle.axleWidth || 3.0) / 2;
    const comOffset = 0.5;
    const heightOffset = comOffset - (this.config.vehicle.height / 2) + (this.config.vehicle.suspensionPos || 0);

    // Front Left
    optionsTemplate.chassisConnectionPointLocal.set(halfLength * 0.7, heightOffset, -axleWidth);
    this.vehicle.addWheel(optionsTemplate);

    // Front Right
    optionsTemplate.chassisConnectionPointLocal.set(halfLength * 0.7, heightOffset, axleWidth);
    this.vehicle.addWheel(optionsTemplate);

    // Rear Left
    optionsTemplate.chassisConnectionPointLocal.set(-halfLength * 0.7, heightOffset, -axleWidth);
    this.vehicle.addWheel(optionsTemplate);

    // Rear Right
    optionsTemplate.chassisConnectionPointLocal.set(-halfLength * 0.7, heightOffset, axleWidth);
    this.vehicle.addWheel(optionsTemplate);

    this.vehicle.addToWorld(this.physics.world);
  }

  getWheelInfos() {
    return this.vehicle ? this.vehicle.wheelInfos : [];
  }
}

