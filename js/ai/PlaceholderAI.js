/**
 * Placeholder AI for opponent vehicles
 * Simple back-and-forth movement for testing
 * Will be replaced with network players in multiplayer
 */
export class PlaceholderAI {
  constructor(config) {
    this.config = config;
    this.aiStates = new Map();
  }

  initVehicle(vehicleId) {
    this.aiStates.set(vehicleId, {
      direction: Math.random() > 0.5 ? 1 : -1,
      timer: 0,
      switchTime: 2 + Math.random() * 3
    });
  }

  update(gameState, deltaTime) {
    const commands = {};

    // Update each AI vehicle
    for (const [vehicleId, vehicleState] of Object.entries(gameState.vehicles)) {
      if (!vehicleId.startsWith('ai-')) continue;

      if (!this.aiStates.has(vehicleId)) {
        this.initVehicle(vehicleId);
      }

      const aiState = this.aiStates.get(vehicleId);
      aiState.timer += deltaTime;

      // Switch direction periodically
      if (aiState.timer >= aiState.switchTime) {
        aiState.direction *= -1;
        aiState.timer = 0;
        aiState.switchTime = 2 + Math.random() * 3;
      }

      // Simple commands: drive forward or backward
      commands[vehicleId] = {
        forward: aiState.direction > 0,
        backward: aiState.direction < 0,
        left: false,
        right: false,
        jump: false,
        boost: false
      };
    }

    return commands;
  }
}