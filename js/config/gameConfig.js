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
    maxSpeed: 40,
    acceleration: 15,
    braking: 25,
    turnSpeed: 2.5,
    jumpForce: 12,
    boostForce: 25,
    boostCapacity: 100,
    boostRegenRate: 10, // per second
    boostDrainRate: 33.3 // per second (3 seconds full boost)
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