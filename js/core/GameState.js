/**
 * Serializable game state
 * Designed for easy synchronization in multiplayer
 */
export class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.timestamp = Date.now();

    // Match state
    this.matchTime = 0;
    this.matchStarted = false;
    this.matchEnded = false;

    // Score
    this.score = {
      blue: 0,
      orange: 0
    };

    // Ball state
    this.ball = {
      position: { x: 0, y: 5, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 }
    };

    // Player vehicles (keyed by clientId in multiplayer)
    this.vehicles = {};

    // Last goal info
    this.lastGoal = null;
  }

  /**
   * Add a vehicle to the game state
   */
  addVehicle(id, team, position, rotation) {
    this.vehicles[id] = {
      id,
      team,
      position: { ...position },
      velocity: { x: 0, y: 0, z: 0 },
      rotation: { ...rotation },
      boost: 100,
      onGround: false
    };
  }

  /**
   * Remove a vehicle from the game state
   */
  removeVehicle(id) {
    delete this.vehicles[id];
  }

  /**
   * Update vehicle state
   */
  updateVehicle(id, updates) {
    if (this.vehicles[id]) {
      Object.assign(this.vehicles[id], updates);
    }
  }

  /**
   * Update ball state
   */
  updateBall(position, velocity, rotation) {
    this.ball.position = { ...position };
    this.ball.velocity = { ...velocity };
    this.ball.rotation = { ...rotation };
  }

  /**
   * Record a goal
   */
  scoreGoal(team, scoredBy) {
    this.score[team]++;
    this.lastGoal = {
      team,
      scoredBy,
      timestamp: Date.now()
    };
  }

  /**
   * Serialize state for network transmission
   */
  serialize() {
    return JSON.stringify({
      timestamp: this.timestamp,
      matchTime: this.matchTime,
      matchStarted: this.matchStarted,
      score: this.score,
      ball: this.ball,
      vehicles: this.vehicles,
      lastGoal: this.lastGoal
    });
  }

  /**
   * Deserialize state from network
   */
  deserialize(data) {
    const parsed = JSON.parse(data);
    Object.assign(this, parsed);
  }

  /**
   * Clone the current state
   */
  clone() {
    const cloned = new GameState();
    cloned.deserialize(this.serialize());
    return cloned;
  }
}