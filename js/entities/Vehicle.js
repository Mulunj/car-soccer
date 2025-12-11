import { Chassis } from './vehicle/Chassis.js';
import { Wheels } from './vehicle/Wheels.js';
import { VehicleMesh } from './vehicle/VehicleMesh.js';
import { VehicleController } from './vehicle/VehicleController.js';

/**
 * Vehicle - Thin composition wrapper that composes chassis, wheels, mesh and controller.
 */
export class Vehicle {
  constructor(id, team, config, physics) {
    this.id = id;
    this.team = team;
    this.config = config;
    this.physics = physics;

    // Components
    this.chassis = new Chassis(this.id, this.team, this.config, this.physics);
    this.wheels = new Wheels(this.config, this.physics, this.chassis);
    this.mesh = new VehicleMesh(this.team, this.config);
    this.controller = new VehicleController(this.config, this.chassis, this.wheels, this.mesh);
  }

  init(position) {
    this.chassis.init(position);
    this.wheels.init(position);
    this.mesh.init();
    this.controller.init(position);

    // Assemble mesh group (mesh keeps wheel placeholders synced by controller)
    this.mesh.group.add(this.mesh.chassisMesh);
    this.mesh.wheelMeshes.forEach(wm => this.mesh.group.add(wm));
  }

  applyCommands(commands, deltaTime) {
    this.controller.applyCommands(commands, deltaTime);
  }

  updateMesh() {
    this.controller.updateMesh();
  }

  setPosition(position) {
    this.controller.setPosition(position);
  }

  setVelocity(velocity) {
    this.controller.setVelocity(velocity);
  }

  setTeam(team) {
    this.team = team;
    this.mesh.setTeam(team);
  }

  getState() {
    return this.controller.getState();
  }

  get body() {
    return this.chassis.body;
  }

  get wheelInfos() {
    return this.wheels.getWheelInfos();
  }

  get meshObject() {
    return this.mesh.group;
  }
}