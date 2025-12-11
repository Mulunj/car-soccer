export class InputBindings {
  constructor() {
    // Load saved bindings or use defaults
    this.bindings = this.loadBindings();

    // Gamepad button mapping
    this.gamepadButtonMap = {
      'A': 0,
      'B': 1,
      'X': 2,
      'Y': 3,
      'LB': 4,
      'RB': 5,
      'LT': 6,
      'RT': 7,
      'Back': 8,
      'Start': 9,
      'LStick': 10,
      'RStick': 11,
      'DPadUp': 12,
      'DPadDown': 13,
      'DPadLeft': 14,
      'DPadRight': 15
    };
  }

  getDefaultBindings() {
    return {
      keyboard: {
        forward: 'KeyW',
        backward: 'KeyS',
        left: 'KeyA',
        right: 'KeyD',
        jump: 'Space',
        boost: 'ShiftLeft',
        menu: 'Escape'
      },
      gamepad: {
        forward: 'RT', // Right trigger
        backward: 'LT', // Left trigger
        jump: 'A',
        boost: 'B',
        menu: 'Start'
      }
    };
  }

  loadBindings() {
    try {
      const saved = localStorage.getItem('carSoccerBindings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load saved bindings:', e);
    }
    return this.getDefaultBindings();
  }

  saveBindings() {
    try {
      localStorage.setItem('carSoccerBindings', JSON.stringify(this.bindings));
    } catch (e) {
      console.warn('Failed to save bindings:', e);
    }
  }

  setBinding(device, action, key) {
    if (this.bindings[device]) {
      this.bindings[device][action] = key;
      this.saveBindings();
    }
  }

  getBinding(device, action) {
    return this.bindings[device]?.[action];
  }

  getKeyName(code) {
    const keyNames = {
      // Keyboard
      'KeyW': 'W',
      'KeyA': 'A',
      'KeyS': 'S',
      'KeyD': 'D',
      'Space': 'Space',
      'ShiftLeft': 'Shift',
      'ShiftRight': 'Shift',
      'Escape': 'ESC',
      // Gamepad
      'A': 'A',
      'B': 'B',
      'X': 'X',
      'Y': 'Y',
      'LB': 'LB',
      'RB': 'RB',
      'LT': 'LT',
      'RT': 'RT',
      'Back': 'Back',
      'Start': 'Start',
      'LStick': 'L-Stick',
      'RStick': 'R-Stick',
      'DPadUp': 'D-Pad Up',
      'DPadDown': 'D-Pad Down',
      'DPadLeft': 'D-Pad Left',
      'DPadRight': 'D-Pad Right'
    };
    return keyNames[code] || code;
  }

  getGamepadButtonIndex(name) {
    if (!name) return null;
    if (this.gamepadButtonMap.hasOwnProperty(name)) {
      return this.gamepadButtonMap[name];
    }
    return null;
  }

  getGamepadButtonName(index) {
    for (const [name, idx] of Object.entries(this.gamepadButtonMap)) {
      if (idx === index) return name;
    }
    return null;
  }
}