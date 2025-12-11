import * as THREE from 'three';
import * as CANNON from 'cannon-es';

/**
 * Ball entity
 * Physics-enabled ball that responds to collisions
 */
export class Ball {
  constructor(config, physics) {
    this.config = config;
    this.physics = physics;
    this.mesh = null;
    this.body = null;
  }
  
  init() {
    const radius = this.config.ball.radius;
    
    // Visual mesh
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.7
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    
    // Physics body
    const shape = new CANNON.Sphere(radius);
    this.body = new CANNON.Body({
      mass: this.config.ball.mass,
      shape: shape,
      position: new CANNON.Vec3(0, 5, 0),
      linearDamping: 0.05,
      angularDamping: 0.05
    });
    
    // Set material properties
    this.body.material = new CANNON.Material({
      friction: this.config.ball.friction,
      restitution: this.config.ball.restitution
    });
    
    this.physics.addBody('ball', this.body);
    
    // Sync mesh with physics
    this.updateMesh();
  }
  
  updateMesh() {
    this.mesh.position.copy(this.body.position);
    this.mesh.quaternion.copy(this.body.quaternion);
  }
  
  reset() {
    this.body.position.set(0, 5, 0);
    this.body.velocity.set(0, 0, 0);
    this.body.angularVelocity.set(0, 0, 0);
    this.updateMesh();
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
      }
    };
  }
}

