export const GameConfig = {
  // Arena dimensions
  arena: {
    width: 100,
    length: 140,
    height: 20,
    wallHeight: 36,
    goalWidth: 20,
    goalHeight: 8,
    goalDepth: 10
  },

  // Vehicle physics
  vehicle: {
    mass: 350, 
    width: 3, 
    length: 6,
    height: 1.2, 
    maxSpeed: 45, 
    maxSpin: 4, // Reduced max spin to prevent uncontrollable pirouettes
    acceleration: 10,
    braking: 30,
    turnSpeed: 3.0,
    jumpForce: 10,
    boostForce: 30,
    boostCapacity: 100,
    boostRegenRate: 10,
    boostDrainRate: 33.3,
    
    // Suspension & Wheel settings (RaycastVehicle)
    suspensionStiffness: 80, // Increased to prevent bottoming out
    suspensionRestLength: 0.85, // Slightly longer suspension for better clearance
    frictionSlip: 0.8, // Reduced friction to prevent tripping/flipping
    dampingRelaxation: 1.8, // Adjusted damping
    dampingCompression: 2.0,
    maxSuspensionForce: 220000, // Increased to hold up car firmly
    rollInfluence: 1.0, // Maximum anti-roll to keep chassis flat
    axleWidth: 3.2, // Slightly wider stance for stability
    suspensionPos: 0.2, // Raise suspension connection points inside chassis
    minGroundClearance: 0.3 // Hard clamp so chassis bottom doesn't sink under the floor
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