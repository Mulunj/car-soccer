import { PhysicsSystem } from '../systems/PhysicsSystem.js';
import { Arena } from '../entities/Arena.js';
import { Vehicle } from '../entities/Vehicle.js';
import { Ball } from '../entities/Ball.js';
import { PlaceholderAI } from '../ai/PlaceholderAI.js';

/**
 * Core game simulation
 * Manages physics, entities, and game rules
 * Designed to run authoritatively on server in multiplayer
 */
export class GameSimulation {
  constructor(state, config) {
    this.state = state;
    this.config = config;
    
    this.physics = null;
    this.arena = null;
    this.ball = null;
    this.vehicles = {};
    this.ai = null;
    
    this.resetTimer = null;
  }
  
  async init() {
    // Initialize physics
    this.physics = new PhysicsSystem(this.config);
    this.physics.init();
    
    // Create arena
    this.arena = new Arena(this.config, this.physics);
    await this.arena.init();
    
    // Create ball
    this.ball = new Ball(this.config, this.physics);
    this.ball.init();
    
    // Create player vehicle
    this.addPlayerVehicle('player', 'blue');
    
    // Create AI opponents
    this.ai = new PlaceholderAI(this.config);
    this.addAIVehicles();
    
    // Start match
    this.state.matchStarted = true;
  }
  
  addPlayerVehicle(id, team) {
    const spawnPos = this.getSpawnPosition(team);
    const vehicle = new Vehicle(id, team, this.config, this.physics);
    vehicle.init(spawnPos);
    
    this.vehicles[id] = vehicle;
    this.state.addVehicle(id, team, spawnPos, { x: 0, y: 0, z: 0 });
  }
  
  addAIVehicles() {
    const aiCount = this.config.ai.count;
    const blueCount = Math.floor(aiCount / 2);
    const orangeCount = aiCount - blueCount;
    
    for (let i = 0; i < blueCount; i++) {
      const id = `ai-blue-${i}`;
      const spawnPos = this.getSpawnPosition('blue', i + 1);
      const vehicle = new Vehicle(id, 'blue', this.config, this.physics);
      vehicle.init(spawnPos);
      
      this.vehicles[id] = vehicle;
      this.state.addVehicle(id, 'blue', spawnPos, { x: 0, y: 0, z: 0 });
    }
    
    for (let i = 0; i < orangeCount; i++) {
      const id = `ai-orange-${i}`;
      const spawnPos = this.getSpawnPosition('orange', i + 1);
      const vehicle = new Vehicle(id, 'orange', this.config, this.physics);
      vehicle.init(spawnPos);
      
      this.vehicles[id] = vehicle;
      this.state.addVehicle(id, 'orange', spawnPos, { x: 0, y: 0, z: 0 });
    }
  }
  
  getSpawnPosition(team, offset = 0) {
    const side = this.config.teams[team].spawnSide;
    const x = side * (this.config.arena.length / 3);
    const z = offset * 10;
    return { x, y: 2, z };
  }
  
  switchPlayerTeam(playerId, newTeam) {
    const vehicle = this.vehicles[playerId];
    if (vehicle) {
      vehicle.setTeam(newTeam);
      this.state.vehicles[playerId].team = newTeam;
      
      // Respawn at new team's side
      const spawnPos = this.getSpawnPosition(newTeam);
      vehicle.setPosition(spawnPos);
    }
  }
  
  update(deltaTime, commands) {
    // Update physics
    this.physics.step(deltaTime);
    
    // Update match time
    if (this.state.matchStarted && !this.state.matchEnded) {
      this.state.matchTime += deltaTime;
      
      if (this.state.matchTime >= this.config.game.matchDuration) {
        this.state.matchEnded = true;
      }
    }
    
    // Update player vehicle with commands
    const playerVehicle = this.vehicles['player'];
    if (playerVehicle && commands) {
      playerVehicle.applyCommands(commands, deltaTime);
    }
    
    // Update AI vehicles
    const aiCommands = this.ai.update(this.state, deltaTime);
    for (const [vehicleId, commands] of Object.entries(aiCommands)) {
      const vehicle = this.vehicles[vehicleId];
      if (vehicle) {
        vehicle.applyCommands(commands, deltaTime);
      }
    }
    
    // Update entity states from physics
    this.updateStates();
    
    // Check for goals
    this.checkGoals();
  }
  
  updateStates() {
    // Update ball state
    const ballState = this.ball.getState();
    this.state.updateBall(ballState.position, ballState.velocity, ballState.rotation);
    
    // Update vehicle states
    for (const [id, vehicle] of Object.entries(this.vehicles)) {
      const vehicleState = vehicle.getState();
      this.state.updateVehicle(id, vehicleState);
    }
  }
  
  checkGoals() {
    // Don't check during reset
    if (this.resetTimer) return;
    
    const ballPos = this.state.ball.position;
    const goalY = this.config.arena.goalHeight / 2;
    const goalZ = this.config.arena.goalWidth / 2;
    const arenaLength = this.config.arena.length / 2;
    
    // Check if ball is in goal zone and low enough
    if (ballPos.y < goalY && Math.abs(ballPos.z) < goalZ) {
      if (ballPos.x < -arenaLength + this.config.arena.goalDepth) {
        // Blue team scored (ball in orange goal)
        this.handleGoal('blue');
      } else if (ballPos.x > arenaLength - this.config.arena.goalDepth) {
        // Orange team scored (ball in blue goal)
        this.handleGoal('orange');
      }
    }
  }
  
  handleGoal(team) {
    this.state.scoreGoal(team, null); // We'd track who scored in multiplayer
    
    // Reset after delay
    this.resetTimer = setTimeout(() => {
      this.resetPositions();
      this.resetTimer = null;
    }, this.config.game.resetDelay);
  }
  
  resetPositions() {
    // Reset ball
    this.ball.reset();
    
    // Reset vehicles
    for (const [id, vehicle] of Object.entries(this.vehicles)) {
      const team = this.state.vehicles[id].team;
      const isPlayer = id === 'player';
      const offset = isPlayer ? 0 : parseInt(id.split('-').pop()) + 1;
      const spawnPos = this.getSpawnPosition(team, offset);
      vehicle.setPosition(spawnPos);
      vehicle.setVelocity({ x: 0, y: 0, z: 0 });
    }
  }
  
  /** 
   * Get physics meshes for rendering
   */
  getRenderObjects() {
    return {
      arena: this.arena.mesh,
      ball: this.ball.mesh,
      vehicles: Object.fromEntries(
        Object.entries(this.vehicles).map(([id, vehicle]) => [id, vehicle.mesh])
      )
    };
  }
}