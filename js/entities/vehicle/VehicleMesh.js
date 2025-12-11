import * as THREE from 'three';

/**
 * Visual mesh component for vehicle (chassis + wheels)
 */
export class VehicleMesh {
  constructor(team, config) {
    this.team = team;
    this.config = config;

    this.group = new THREE.Group();
    this.chassisMesh = null;
    this.wheelMeshes = [];
  }

  init() {
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
    this.chassisMesh.position.set(0, 0.5, 0);

    // Wheel Meshes
    const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 24);
    wheelGeometry.rotateX(Math.PI / 2);
    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.8
    });

    for (let i = 0; i < 4; i++) {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.castShadow = true;
      this.wheelMeshes.push(wheel);
    }
  }

  setTeam(team) {
    this.team = team;
    if (this.chassisMesh) {
      const teamColor = this.config.teams[team].color;
      this.chassisMesh.material.color.setHex(teamColor);
    }
  }
}

