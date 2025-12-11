export const GameConfig = {
  // Arena dimensions
  arena: {
    width: 100,
    length: 140,
    height: 20,
    wallHeight: 12,
    goalWidth: 20,
    goalHeight: 8,
    goalDepth: 10
  },

  // Vehicle physics
  vehicle: {
    mass: 180,
    width: 3.5,
    length: 5,
    height: 1.5,
    maxSpeed: 45, // Hard cap on physics velocity
    maxSpin: 5,   // Hard cap on angular velocity (radians/sec)
    acceleration: 15,
    braking: 25,
    turnSpeed: 2.5,
    jumpForce: 8, // Reduced from 12 to prevent flying too high
    boostForce: 25,
    boostCapacity: 100,
    boostRegenRate: 10,
    boostDrainRate: 33.3,
    
    // Suspension & Wheel settings (RaycastVehicle)
    suspensionStiffness: 50, // Stiffer suspension
    suspensionRestLength: 0.8, // Increased for better ground clearance
    frictionSlip: 2.0, // Reduced to prevent flipping on sharp turns
    dampingRelaxation: 2.5, // Increased damping
    dampingCompression: 4.5, // Increased damping
    maxSuspensionForce: 200000,
    rollInfluence: 0.2, // Increased to keep car upright
    axleWidth: 2.6, // Wider stance for stability
    suspensionPos: 0.1 // Lower mount point
  },

  // Ball physics
  ball: {
    radius: 1.8,
    mass: 30,
    restitution: 0.6,
    friction: 0.5
  },

  // Game rules
  game: {
    matchDuration: 300, // 5 minutes in seconds
    resetDelay: 3000 // milliseconds
  },

  // Teams
  teams: {
    blue: {
      name: 'Blue',
      color: 0x4dabf7,
      spawnSide: -1 // -1 for left side
    },
    orange: {
      name: 'Orange',
      color: 0xff922b,
      spawnSide: 1 // 1 for right side
    }
  },

  // Placeholder AI settings
  ai: {
    count: 3,
    updateRate: 60 // times per second
  },

  // Rendering
  render: {
    fov: 75,
    near: 0.1,
    far: 1000,
    shadowMapSize: 2048
  },

  // Camera
  camera: {
    distance: 12,
    height: 6,
    stiffness: 0.1,
    maxVerticalAngle: Math.PI / 3
  }
};