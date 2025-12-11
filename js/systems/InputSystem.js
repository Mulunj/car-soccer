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

    // Track gamepad button state for edge detection
    this.prevGamepadButtons = [];

    // Right-stick camera input
    this.cameraInput = { x: 0, y: 0 };
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
      this.prevGamepadButtons = new Array(e.gamepad.buttons.length).fill(false);
    });
    
    window.addEventListener('gamepaddisconnected', () => {
      this.gamepad = null;
      this.prevGamepadButtons = [];
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
        const getIdx = (action) => this.bindings.getGamepadButtonIndex(
          this.bindings.getBinding('gamepad', action)
        );

        const forwardIdx = getIdx('forward');
        const backwardIdx = getIdx('backward');
        const jumpIdx = getIdx('jump');
        const boostIdx = getIdx('boost');

        if (forwardIdx !== null && gp.buttons[forwardIdx]?.pressed) {
          commands.forward = true;
        }
        if (backwardIdx !== null && gp.buttons[backwardIdx]?.pressed) {
          commands.backward = true;
        }
        
        // Face buttons
        if (jumpIdx !== null && gp.buttons[jumpIdx]?.pressed) {
          commands.jump = true;
        }
        if (boostIdx !== null && gp.buttons[boostIdx]?.pressed) {
          commands.boost = true;
        }
        
        // Analog stick for turning
        const leftStickX = gp.axes[0];
        if (leftStickX < -0.3) commands.left = true;
        if (leftStickX > 0.3) commands.right = true;
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
  
  /**
   * Per-frame gamepad polling for menu controls and edge-triggered buttons
   * Should be called every frame regardless of pause state.
   */
  updateGamepad() {
    if (!this.gamepad) return;
    const gp = navigator.getGamepads()[this.gamepad.index];
    if (!gp) return;

    // Ensure prevGamepadButtons has correct length
    if (this.prevGamepadButtons.length !== gp.buttons.length) {
      this.prevGamepadButtons = new Array(gp.buttons.length).fill(false);
    }

    const isPressed = (name) => {
      const idx = this.bindings.getGamepadButtonIndex(name);
      return idx !== null && gp.buttons[idx]?.pressed;
    };

    // Menu toggle (Start or bound menu button)
    const menuName = this.bindings.getBinding('gamepad', 'menu');
    const menuIdx = this.bindings.getGamepadButtonIndex(menuName);
    if (menuIdx !== null) {
      const pressed = gp.buttons[menuIdx]?.pressed;
      const prev = this.prevGamepadButtons[menuIdx] || false;
      if (pressed && !prev) {
        this.trigger('menu');
      }
      this.prevGamepadButtons[menuIdx] = !!pressed;
    }

    // D-pad up/down for menu navigation
    const dpadUpIdx = this.bindings.getGamepadButtonIndex('DPadUp');
    const dpadDownIdx = this.bindings.getGamepadButtonIndex('DPadDown');

    if (dpadUpIdx !== null) {
      const pressed = gp.buttons[dpadUpIdx]?.pressed;
      const prev = this.prevGamepadButtons[dpadUpIdx] || false;
      if (pressed && !prev) {
        this.trigger('menuNavigate', -1);
      }
      this.prevGamepadButtons[dpadUpIdx] = !!pressed;
    }

    if (dpadDownIdx !== null) {
      const pressed = gp.buttons[dpadDownIdx]?.pressed;
      const prev = this.prevGamepadButtons[dpadDownIdx] || false;
      if (pressed && !prev) {
        this.trigger('menuNavigate', 1);
      }
      this.prevGamepadButtons[dpadDownIdx] = !!pressed;
    }

    // Left stick up/down as fallback for menu navigation
    const axisY = gp.axes[1];
    if (axisY !== undefined) {
      const threshold = 0.5;
      const upIdx = 'axisYUp';
      const downIdx = 'axisYDown';
      const upPrev = this.prevGamepadButtons[upIdx] || false;
      const downPrev = this.prevGamepadButtons[downIdx] || false;

      const upNow = axisY < -threshold;
      const downNow = axisY > threshold;

      if (upNow && !upPrev) {
        this.trigger('menuNavigate', -1);
      }
      if (downNow && !downPrev) {
        this.trigger('menuNavigate', 1);
      }

      this.prevGamepadButtons[upIdx] = upNow;
      this.prevGamepadButtons[downIdx] = downNow;
    }

    // Right stick for camera input
    const rx = gp.axes[2] ?? 0;
    const ry = gp.axes[3] ?? 0;
    const camDeadzone = 0.2;
    this.cameraInput.x = Math.abs(rx) > camDeadzone ? rx : 0;
    this.cameraInput.y = Math.abs(ry) > camDeadzone ? ry : 0;

    // Confirm (A)
    const confirmName = 'A';
    const confirmIdx = this.bindings.getGamepadButtonIndex(confirmName);
    if (confirmIdx !== null) {
      const pressed = gp.buttons[confirmIdx]?.pressed;
      const prev = this.prevGamepadButtons[confirmIdx] || false;
      if (pressed && !prev) {
        this.trigger('menuConfirm');
      }
      this.prevGamepadButtons[confirmIdx] = !!pressed;
    }

    // Back (B)
    const backName = 'B';
    const backIdx = this.bindings.getGamepadButtonIndex(backName);
    if (backIdx !== null) {
      const pressed = gp.buttons[backIdx]?.pressed;
      const prev = this.prevGamepadButtons[backIdx] || false;
      if (pressed && !prev) {
        this.trigger('menuBack');
      }
      this.prevGamepadButtons[backIdx] = !!pressed;
    }
  }

  getCameraInput() {
    return { ...this.cameraInput };
  }
  
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }
  
  trigger(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }
}