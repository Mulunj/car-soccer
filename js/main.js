import * as THREE from 'three';
import { GameConfig } from './config/gameConfig.js';
import { InputBindings } from './config/inputBindings.js';
import { GameState } from './core/GameState.js';
import { GameSimulation } from './core/GameSimulation.js';
import { RenderSystem } from './systems/RenderSystem.js';
import { InputSystem } from './systems/InputSystem.js';
import { HUD } from './ui/HUD.js';
import { Menu } from './ui/Menu.js';
import { LoadingScreen } from './ui/LoadingScreen.js';
import { NetworkInterface } from './utils/NetworkInterface.js';

class Game {
  constructor() {
    this.config = GameConfig;
    this.inputBindings = new InputBindings();
    this.state = new GameState();

    this.simulation = null;
    this.renderSystem = null;
    this.inputSystem = null;
    this.hud = null;
    this.menu = null;
    this.loadingScreen = new LoadingScreen();
    this.network = new NetworkInterface(false); // Single-player for now

    this.lastTime = 0;
    this.isPaused = false;
    this.isMenuOpen = false;
  }

  async init() {
    // Show loading screen
    this.loadingScreen.show();
    this.loadingScreen.updateText('Initializing...');

    // Initialize network (no-op in single-player)
    await this.network.connect();

    // Initialize systems
    this.loadingScreen.updateText('Loading graphics...');
    this.renderSystem = new RenderSystem(this.config);
    await this.renderSystem.init();

    this.loadingScreen.updateText('Starting simulation...');
    this.simulation = new GameSimulation(this.state, this.config);
    await this.simulation.init();

    // Pass render objects to render system
    this.renderSystem.setRenderObjects(this.simulation.getRenderObjects());

    this.loadingScreen.updateText('Setting up controls...');
    this.inputSystem = new InputSystem(this.inputBindings);
    this.inputSystem.init();

    this.hud = new HUD();
    this.menu = new Menu(this.inputBindings, () => this.togglePause(), () => this.switchTeam());

    // Setup event listeners
    this.setupEventListeners();

    // Start the game
    this.loadingScreen.updateText('Ready!');
    this.start();

    // Hide loading screen
    setTimeout(() => {
      this.loadingScreen.hide();
    }, 1000);
  }

  setupEventListeners() {
    // Menu toggle
    this.inputSystem.on('menu', () => this.togglePause());

    // Window resize
    window.addEventListener('resize', () => {
      this.renderSystem.handleResize();
    });
  }

  togglePause() {
    this.isMenuOpen = !this.isMenuOpen;
    if (this.isMenuOpen) {
      this.menu.show();
    } else {
      this.menu.hide();
    }
  }

  switchTeam() {
    const playerId = 'player';
    const vehicle = this.state.vehicles[playerId];
    if (vehicle) {
      const newTeam = vehicle.team === 'blue' ? 'orange' : 'blue';
      this.simulation.switchPlayerTeam(playerId, newTeam);
    }
  }

  start() {
    this.lastTime = performance.now();
    this.update();
  }

  update = () => {
    requestAnimationFrame(this.update);

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
    this.lastTime = currentTime;

    // Don't update simulation when paused
    if (!this.isMenuOpen) {
      // Get input commands
      const commands = this.inputSystem.getCommands();

      // Update simulation
      this.simulation.update(deltaTime, commands);

      // Update HUD
      this.hud.update(this.state);
    }

    // Always render
    this.renderSystem.render(this.state);
  };
}

// Start the game
const game = new Game();
game.init();