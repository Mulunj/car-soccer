export class InputBindings {
  constructor() {
    // Load saved bindings or use defaults
    this.bindings = this.loadBindings();
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
      'KeyW': 'W',
      'KeyA': 'A',
      'KeyS': 'S',
      'KeyD': 'D',
      'Space': 'Space',
      'ShiftLeft': 'Shift',
      'ShiftRight': 'Shift',
      'Escape': 'ESC'
    };
    return keyNames[code] || code;
  }
}