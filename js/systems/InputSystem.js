import nipplejs from 'nipplejs';

/**
 * Input system
 * Handles keyboard, gamepad, and touch input
 * Generates commands for vehicle control
 */
export class InputSystem {
  constructor(inputBindings) {
    this.bindings = inputBindings;
    
    this.keys = new Set();
    this.gamepad = null;
    this.joystick = null;
    
    this.listeners = new Map();
    
    this.isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }
  
  init() {
    this.setupKeyboard();
    this.setupGamepad();
    
    if (this.isMobile) {
      this.setupTouch();
    }
  }
  
  setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      
      // Trigger menu event
      if (e.code === this.bindings.getBinding('keyboard', 'menu')) {
        this.trigger('menu');
      }
    });
    
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
  }
  
  setupGamepad() {
    window.addEventListener('gamepadconnected', (e) => {
      console.log('Gamepad connected:', e.gamepad);
      this.gamepad = e.gamepad;
    });
    
    window.addEventListener('gamepaddisconnected', () => {
      this.gamepad = null;
    });
  }
  
  setupTouch() {
    // Create virtual joystick for mobile
    const container = document.getElementById('game-container');
    
    this.joystick = nipplejs.create({
      zone: container,
      mode: 'static',
      position: { left: '80px', bottom: '80px' },
      color: 'white',
      size: 120
    });
    
    // Add boost button
    const boostBtn = document.createElement('button');
    boostBtn.id = 'boost-btn';
    boostBtn.textContent = 'BOOST';
    boostBtn.style.cssText = `
      position: fixed;
      right: 80px;
      bottom: 150px;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.8);
      border: 3px solid white;
      font-family: 'Space Mono', monospace;
      font-size: 12px;
      font-weight: bold;
      color: #000;
      z-index: 100;
      touch-action: none;
    `;
    container.appendChild(boostBtn);
    
    // Add jump button
    const jumpBtn = document.createElement('button');
    jumpBtn.id = 'jump-btn';
    jumpBtn.textContent = 'JUMP';
    jumpBtn.style.cssText = `
      position: fixed;
      right: 80px;
      bottom: 50px;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.8);
      border: 3px solid white;
      font-family: 'Space Mono', monospace;
      font-size: 12px;
      font-weight: bold;
      color: #000;
      z-index: 100;
      touch-action: none;
    `;
    container.appendChild(jumpBtn);
    
    this.touchState = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      boost: false
    };
    
    this.joystick.on('move', (evt, data) => {
      const angle = data.angle.degree;
      const force = Math.min(data.force, 2) / 2;
      
      // Convert angle to direction
      this.touchState.forward = angle > 315 || angle < 45;
      this.touchState.right = angle >= 45 && angle < 135;
      this.touchState.backward = angle >= 135 && angle < 225;
      this.touchState.left = angle >= 225 && angle < 315;
    });
    
    this.joystick.on('end', () => {
      this.touchState.forward = false;
      this.touchState.backward = false;
      this.touchState.left = false;
      this.touchState.right = false;
    });
    
    boostBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.touchState.boost = true;
    });
    
    boostBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.touchState.boost = false;
    });
    
    jumpBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.touchState.jump = true;
    });
    
    jumpBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.touchState.jump = false;
    });
  }
  
  getCommands() {
    const commands = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      boost: false
    };
    
    // Keyboard input
    if (this.keys.has(this.bindings.getBinding('keyboard', 'forward'))) {
      commands.forward = true;
    }
    if (this.keys.has(this.bindings.getBinding('keyboard', 'backward'))) {
      commands.backward = true;
    }
    if (this.keys.has(this.bindings.getBinding('keyboard', 'left'))) {
      commands.left = true;
    }
    if (this.keys.has(this.bindings.getBinding('keyboard', 'right'))) {
      commands.right = true;
    }
    if (this.keys.has(this.bindings.getBinding('keyboard', 'jump'))) {
      commands.jump = true;
    }
    if (this.keys.has(this.bindings.getBinding('keyboard', 'boost'))) {
      commands.boost = true;
    }
    
    // Gamepad input
    if (this.gamepad) {
      const gp = navigator.getGamepads()[this.gamepad.index];
      if (gp) {
        // Triggers (RT/LT for forward/backward)
        if (gp.buttons[7]?.pressed) commands.forward = true;
        if (gp.buttons[6]?.pressed) commands.backward = true;
        
        // Face buttons
        if (gp.buttons[0]?.pressed) commands.jump = true;
        if (gp.buttons[1]?.pressed) commands.boost = true;
        
        // Analog stick for turning
        const leftStickX = gp.axes[0];
        if (leftStickX < -0.3) commands.left = true;
        if (leftStickX > 0.3) commands.right = true;
        
        // Start button for menu
        if (gp.buttons[9]?.pressed) {
          this.trigger('menu');
        }
      }
    }
    
    // Touch input (mobile)
    if (this.isMobile && this.touchState) {
      commands.forward = commands.forward || this.touchState.forward;
      commands.backward = commands.backward || this.touchState.backward;
      commands.left = commands.left || this.touchState.left;
      commands.right = commands.right || this.touchState.right;
      commands.jump = commands.jump || this.touchState.jump;
      commands.boost = commands.boost || this.touchState.boost;
    }
    
    return commands;
  }
  
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }
  
  trigger(event) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb());
    }
  }
}