/**
 * In-game menu
 * Pause, team switching, and controls customization
 */
export class Menu {
  constructor(inputBindings, onResume, onSwitchTeam) {
    this.bindings = inputBindings;
    this.onResume = onResume;
    this.onSwitchTeam = onSwitchTeam;
    
    this.menuElement = document.getElementById('menu');
    this.controlsElement = document.getElementById('controls-menu');
    
    this.setupEventListeners();
    this.buildControlsList();
    
    this.editingControl = null;

    // Controller navigation state
    this.mainButtons = [
      document.getElementById('resume-btn'),
      document.getElementById('switch-team-btn'),
      document.getElementById('controls-btn')
    ];
    this.controlsButtons = [
      document.getElementById('controls-back-btn')
    ];
    this.focusIndex = 0;
    this.activeMenu = 'main'; // 'main' or 'controls'
  }
  
  setupEventListeners() {
    document.getElementById('resume-btn').addEventListener('click', () => {
      this.onResume();
    });
    
    document.getElementById('switch-team-btn').addEventListener('click', () => {
      this.onSwitchTeam();
      this.onResume();
    });
    
    document.getElementById('controls-btn').addEventListener('click', () => {
      this.showControls();
    });
    
    document.getElementById('controls-back-btn').addEventListener('click', () => {
      this.hideControls();
    });
    
    // Listen for key presses when editing keyboard bindings
    window.addEventListener('keydown', (e) => {
      if (this.editingControl && this.editingControl.device === 'keyboard') {
        e.preventDefault();
        this.setControlBinding(e.code);
      }
    });
  }
  
  buildControlsList() {
    const container = document.getElementById('controls-list');
    container.innerHTML = '';

    // Keyboard controls
    const keyboardHeader = document.createElement('h3');
    keyboardHeader.textContent = 'Keyboard';
    keyboardHeader.className = 'controls-header';
    container.appendChild(keyboardHeader);

    const keyboardActions = ['forward', 'backward', 'left', 'right', 'jump', 'boost'];
    
    keyboardActions.forEach(action => {
      const item = document.createElement('div');
      item.className = 'control-item';
      
      const label = document.createElement('div');
      label.className = 'control-label';
      label.textContent = action.toUpperCase();
      
      const key = document.createElement('div');
      key.className = 'control-key';
      key.dataset.action = action;
      key.dataset.device = 'keyboard';
      const binding = this.bindings.getBinding('keyboard', action);
      key.textContent = this.bindings.getKeyName(binding);
      
      key.addEventListener('click', () => {
        this.startEditingControl('keyboard', action, key);
      });
      
      item.appendChild(label);
      item.appendChild(key);
      container.appendChild(item);
    });

    // Gamepad controls
    const gamepadHeader = document.createElement('h3');
    gamepadHeader.textContent = 'Gamepad';
    gamepadHeader.className = 'controls-header';
    container.appendChild(gamepadHeader);

    const gamepadActions = ['forward', 'backward', 'jump', 'boost', 'menu'];

    gamepadActions.forEach(action => {
      const item = document.createElement('div');
      item.className = 'control-item';
      
      const label = document.createElement('div');
      label.className = 'control-label';
      label.textContent = action.toUpperCase();
      
      const key = document.createElement('div');
      key.className = 'control-key';
      key.dataset.action = action;
      key.dataset.device = 'gamepad';
      const binding = this.bindings.getBinding('gamepad', action);
      key.textContent = this.bindings.getKeyName(binding);
      
      key.addEventListener('click', () => {
        this.startEditingControl('gamepad', action, key);
      });
      
      item.appendChild(label);
      item.appendChild(key);
      container.appendChild(item);
    });
  }
  
  startEditingControl(device, action, element) {
    // Clear previous editing state
    document.querySelectorAll('.control-key').forEach(el => {
      el.classList.remove('editing');
    });
    
    this.editingControl = { device, action, element };
    element.classList.add('editing');
    element.textContent = 'Press key...';

    if (device === 'gamepad') {
      this.waitForGamepadButton();
    }
  }
  
  setControlBinding(code) {
    if (!this.editingControl) return;
    
    const { device, action, element } = this.editingControl;
    this.bindings.setBinding(device, action, code);
    
    element.classList.remove('editing');
    element.textContent = this.bindings.getKeyName(code);
    
    this.editingControl = null;
  }

  waitForGamepadButton() {
    const poll = () => {
      if (!this.editingControl || this.editingControl.device !== 'gamepad') return;

      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads[0];
      if (gp) {
        for (let i = 0; i < gp.buttons.length; i++) {
          if (gp.buttons[i].pressed) {
            const name = this.bindings.getGamepadButtonName(i);
            if (name) {
              this.setControlBinding(name);
              return;
            }
          }
        }
      }
      requestAnimationFrame(poll);
    };
    requestAnimationFrame(poll);
  }
  
  show() {
    this.menuElement.classList.remove('hidden');
    this.activeMenu = 'main';
    this.focusIndex = 0;
    this.updateFocus();
  }
  
  hide() {
    this.menuElement.classList.add('hidden');
    this.hideControls();
  }
  
  showControls() {
    this.menuElement.classList.add('hidden');
    this.controlsElement.classList.remove('hidden');
    this.activeMenu = 'controls';
    this.focusIndex = 0;
    this.updateFocus();
  }
  
  hideControls() {
    this.controlsElement.classList.add('hidden');
    this.activeMenu = 'main';
    this.focusIndex = 0;
    this.updateFocus();
  }

  /**
   * Controller/keyboard navigation helpers
   */
  updateFocus() {
    const allButtons = [...this.mainButtons, ...this.controlsButtons].filter(Boolean);
    allButtons.forEach(btn => btn && btn.classList.remove('focused'));

    const buttons = this.activeMenu === 'main' ? this.mainButtons : this.controlsButtons;
    const btn = buttons[this.focusIndex];
    if (btn) {
      btn.classList.add('focused');
    }
  }

  handleNavigate(direction) {
    const buttons = this.activeMenu === 'main' ? this.mainButtons : this.controlsButtons;
    const available = buttons.filter(Boolean);
    if (available.length === 0) return;

    // Find current index among non-null buttons
    let indices = buttons.map((b, i) => b ? i : -1).filter(i => i !== -1);
    let current = indices.includes(this.focusIndex) ? indices.indexOf(this.focusIndex) : 0;
    current = (current + direction + indices.length) % indices.length;
    this.focusIndex = indices[current];
    this.updateFocus();
  }

  handleConfirm() {
    const buttons = this.activeMenu === 'main' ? this.mainButtons : this.controlsButtons;
    const btn = buttons[this.focusIndex];
    if (btn) {
      btn.click();
    }
  }

  handleBack() {
    if (this.activeMenu === 'controls') {
      this.hideControls();
    } else {
      // Back from main menu resumes game
      this.onResume();
    }
  }
}