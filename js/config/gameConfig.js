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
    mass: 150, // Slightly reduced mass
    width: 2.2, // Significantly narrower to prevent ground clipping (was 3.5)
    length: 4.8,
    height: 1.2, // Lower profile
    maxSpeed: 45, 
    maxSpin: 6,
    acceleration: 20,
    braking: 30,
    turnSpeed: 3.0,
    jumpForce: 10,
    boostForce: 30,
    boostCapacity: 100,
    boostRegenRate: 10,
    boostDrainRate: 33.3,
    
    // Suspension & Wheel settings (RaycastVehicle)
    suspensionStiffness: 60, // Optimized stiffness
    suspensionRestLength: 0.6, // Adjusted for new connection points
    frictionSlip: 1.5, // Good grip but allows some slide
    dampingRelaxation: 2.3,
    dampingCompression: 4.4,
    maxSuspensionForce: 100000,
    rollInfluence: 0.5, // Stronger anti-roll
    axleWidth: 3.0, // Wider than body to prevent body scraping
    suspensionPos: 0.0 // Connection point offset
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