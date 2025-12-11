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
import { GameOverScreen } from './ui/GameOverScreen.js';
import { NetworkInterface } from './utils/NetworkInterface.js';
import { AudioSystem } from './systems/AudioSystem.js';

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
    this.gameOverScreen = null;
    this.loadingScreen = new LoadingScreen();
    this.network = new NetworkInterface(false); // Single-player for now
    this.audio = new AudioSystem();

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
    
    // Initialize Audio
    await this.audio.init();

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
    this.gameOverScreen = new GameOverScreen(() => this.restartMatch());

    // Setup event listeners
    this.setupEventListeners();

    // Start the game
    this.loadingScreen.updateText('Ready!');
    this.start();

    // Hide loading screen
    setTimeout(() => {
      this.loadingScreen.hide();
    }, 1000);
    
    // Play whistle at start
    this.audio.play('whistle');
  }

  setupEventListeners() {
    // Menu toggle
    this.inputSystem.on('menu', () => this.togglePause());

    // Controller menu navigation
    this.inputSystem.on('menuNavigate', (dir) => {
      if (this.isMenuOpen) {
        this.menu.handleNavigate(dir);
      }
    });

    this.inputSystem.on('menuConfirm', () => {
      if (this.isMenuOpen) {
        this.menu.handleConfirm();
      }
    });

    this.inputSystem.on('menuBack', () => {
      if (this.isMenuOpen) {
        this.menu.handleBack();
      }
    });

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
  
  restartMatch() {
    this.simulation.resetMatch();
    this.audio.play('whistle');
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

    // Always update gamepad for menu controls
    this.inputSystem.updateGamepad();

    // Don't update simulation when paused
    if (!this.isMenuOpen) {
      // Get input commands
      const commands = this.inputSystem.getCommands();

      // Update simulation
      this.simulation.update(deltaTime, commands);

      // Handle events (audio, game state changes)
      this.handleEvents();
      
      // Update Audio Engine Loop
      this.updateAudio();

      // Update HUD
      this.hud.update(this.state);
    }

    // Camera input from right stick
    const cameraInput = this.inputSystem.getCameraInput();

    // Always render
    this.renderSystem.render(this.state, cameraInput, deltaTime);
  };
  
  handleEvents() {
    // Process event queue
    for (const event of this.state.events) {
      switch (event.type) {
        case 'collision':
          // Scale volume by force
          const vol = Math.min(1.0, event.data.force / 40);
          if (vol > 0.1) {
            this.audio.play('hit', vol);
          }
          break;
        case 'jump':
          this.audio.play('jump', 0.6);
          break;
        case 'goal':
          this.audio.play('goal');
          this.showGoalNotification(event.data.team);
          break;
      }
    }
    this.state.clearEvents();
    
    // Check for match end
    if (this.state.matchEnded && this.gameOverScreen.element.classList.contains('hidden')) {
      this.audio.play('whistle');
      this.audio.stopAll(); // Stop engine sounds
      
      // Determine winner
      let winner = 'draw';
      if (this.state.score.blue > this.state.score.orange) winner = 'blue';
      if (this.state.score.orange > this.state.score.blue) winner = 'orange';
      
      this.gameOverScreen.show(winner);
    }
  }
  
  updateAudio() {
    if (this.state.matchEnded) return;
    
    const playerVehicle = this.state.vehicles['player'];
    if (playerVehicle) {
      const vel = playerVehicle.velocity;
      const speed = Math.sqrt(vel.x*vel.x + vel.y*vel.y + vel.z*vel.z);
      // Normalized rpm roughly based on speed/maxSpeed
      const rpm = Math.min(1.0, speed / this.config.vehicle.maxSpeed);
      
      // Check boost state (infer from input for now, or check if boost is decreasing)
      // Actually we have access to commands in update(), but here we only have state.
      // Ideally state would track "isBoosting" flag.
      // But we can check if boost is actively draining in state? No, that's diff.
      // Let's rely on InputSystem commands? No, let's update Vehicle state to include isBoosting flag.
      
      // Hack: assume boosting if speed > maxSpeed * 0.9 or just check if we can get isBoosting from simulation.
      // Better: Update GameState to include 'isBoosting' flag on vehicle.
      // For now, I'll assume 0 boost sound if I can't be sure, or just rely on speed.
      // Actually, let's fix Vehicle.js to export isBoosting in getState().
      
      this.audio.updateEngine(rpm, playerVehicle.isBoosting);
    }
  }
  
  showGoalNotification(team) {
    const el = document.getElementById('goal-announcement');
    const scoreText = el.querySelector('.scored-by');
    
    scoreText.textContent = `${team.toUpperCase()} TEAM SCORES`;
    scoreText.style.color = team === 'blue' ? '#4dabf7' : '#ff922b';
    scoreText.style.background = 'rgba(0,0,0,0.8)';
    
    el.classList.remove('hidden');
    
    // Remove animation class to reset it
    el.style.animation = 'none';
    el.offsetHeight; /* trigger reflow */
    el.style.animation = null; 
    
    setTimeout(() => {
      el.classList.add('hidden');
    }, 2000);
  }
}

// Start the game
const game = new Game();
game.init();