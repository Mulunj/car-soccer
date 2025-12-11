import * as THREE from 'three';
import * as CANNON from 'cannon-es';

/**
 * Arena entity
 * Creates the playing field, walls, and goals
 */
export class Arena {
  constructor(config, physics) {
    this.config = config;
    this.physics = physics;
    this.mesh = new THREE.Group();
  }

  async init() {
    this.createFloor();
    this.createWalls();
    this.createGoals();
  }

  createFloor() {
    const width = this.config.arena.width;
    const length = this.config.arena.length;

    // Visual mesh
    const geometry = new THREE.PlaneGeometry(length, width);
    const material = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.8,
      metalness: 0.2
    });
    const floor = new THREE.Mesh(geometry, material);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.mesh.add(floor);

    // Add field lines
    this.createFieldLines();

    // Physics body
    const floorShape = new CANNON.Plane();
    const floorBody = new CANNON.Body({
      mass: 0, // Static
      shape: floorShape
    });
    floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.physics.addBody('floor', floorBody);
  }

  createFieldLines() {
    const width = this.config.arena.width;
    const length = this.config.arena.length;

    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });

    // Center line
    const centerLine = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.01, -width / 2),
      new THREE.Vector3(0, 0.01, width / 2)
    ]);
    this.mesh.add(new THREE.Line(centerLine, lineMaterial));

    // Center circle
    const centerCircle = new THREE.RingGeometry(10, 10.2, 32);
    const circle = new THREE.Mesh(centerCircle, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    circle.rotation.x = -Math.PI / 2;
    circle.position.y = 0.01;
    this.mesh.add(circle);
  }

  createWalls() {
    const width = this.config.arena.width;
    const length = this.config.arena.length;
    const height = this.config.arena.wallHeight;

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.7,
      metalness: 0.3
    });

    // Side walls
    this.createWall(0, height / 2, width / 2, length, height, 0.5, wallMaterial);
    this.createWall(0, height / 2, -width / 2, length, height, 0.5, wallMaterial);

    // End walls (with goal openings)
    const goalWidth = this.config.arena.goalWidth;
    const sideWidth = (width - goalWidth) / 2;

    // Left end walls
    this.createWall(-length / 2, height / 2, width / 2 - sideWidth / 2, 0.5, height, sideWidth, wallMaterial);
    this.createWall(-length / 2, height / 2, -width / 2 + sideWidth / 2, 0.5, height, sideWidth, wallMaterial);

    // Right end walls
    this.createWall(length / 2, height / 2, width / 2 - sideWidth / 2, 0.5, height, sideWidth, wallMaterial);
    this.createWall(length / 2, height / 2, -width / 2 + sideWidth / 2, 0.5, height, sideWidth, wallMaterial);
  }

  createWall(x, y, z, sizeX, sizeY, sizeZ, material) {
    // Visual mesh
    const geometry = new THREE.BoxGeometry(sizeX, sizeY, sizeZ);
    const wall = new THREE.Mesh(geometry, material);
    wall.position.set(x, y, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    this.mesh.add(wall);

    // Physics body
    const shape = new CANNON.Box(new CANNON.Vec3(sizeX / 2, sizeY / 2, sizeZ / 2));
    const body = new CANNON.Body({
      mass: 0,
      shape: shape,
      position: new CANNON.Vec3(x, y, z)
    });
    this.physics.world.addBody(body);
  }

  createGoals() {
    const goalWidth = this.config.arena.goalWidth;
    const goalHeight = this.config.arena.goalHeight;
    const goalDepth = this.config.arena.goalDepth;
    const length = this.config.arena.length;

    // Blue goal (left side)
    this.createGoal(-length / 2 - goalDepth / 2, goalHeight / 2, 0, goalDepth, goalHeight, goalWidth, 0x4dabf7);

    // Orange goal (right side)
    this.createGoal(length / 2 + goalDepth / 2, goalHeight / 2, 0, goalDepth, goalHeight, goalWidth, 0xff922b);
  }

  createGoal(x, y, z, depth, height, width, color) {
    const goalMaterial = new THREE.MeshStandardMaterial({
      color: color,
      transparent: true,
      opacity: 0.3,
      roughness: 0.5,
      metalness: 0.5
    });

    // Goal frame (posts and crossbar)
    const postRadius = 0.2;
    const postGeometry = new THREE.CylinderGeometry(postRadius, postRadius, height, 8);
    const crossbarGeometry = new THREE.CylinderGeometry(postRadius, postRadius, width, 8);

    // Left post
    const leftPost = new THREE.Mesh(postGeometry, goalMaterial);
    leftPost.position.set(x, y, -width / 2);
    this.mesh.add(leftPost);

    // Right post
    const rightPost = new THREE.Mesh(postGeometry, goalMaterial);
    rightPost.position.set(x, y, width / 2);
    this.mesh.add(rightPost);

    // Crossbar
    const crossbar = new THREE.Mesh(crossbarGeometry, goalMaterial);
    crossbar.position.set(x, height, z);
    crossbar.rotation.z = Math.PI / 2;
    this.mesh.add(crossbar);

    // Back wall
    const backGeometry = new THREE.PlaneGeometry(depth, height);
    const backMaterial = new THREE.MeshStandardMaterial({
      color: color,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide
    });
    const back = new THREE.Mesh(backGeometry, backMaterial);
    back.position.set(x - (x > 0 ? depth / 2 : -depth / 2), y, z);
    back.rotation.y = x > 0 ? -Math.PI / 2 : Math.PI / 2;
    this.mesh.add(back);
  }
}