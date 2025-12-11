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
    
    // Listen for key presses when editing
    window.addEventListener('keydown', (e) => {
      if (this.editingControl) {
        e.preventDefault();
        this.setControlBinding(e.code);
      }
    });
  }
  
  buildControlsList() {
    const container = document.getElementById('controls-list');
    const actions = ['forward', 'backward', 'left', 'right', 'jump', 'boost'];
    
    actions.forEach(action => {
      const item = document.createElement('div');
      item.className = 'control-item';
      
      const label = document.createElement('div');
      label.className = 'control-label';
      label.textContent = action.toUpperCase();
      
      const key = document.createElement('div');
      key.className = 'control-key';
      key.dataset.action = action;
      const binding = this.bindings.getBinding('keyboard', action);
      key.textContent = this.bindings.getKeyName(binding);
      
      key.addEventListener('click', () => {
        this.startEditingControl(action, key);
      });
      
      item.appendChild(label);
      item.appendChild(key);
      container.appendChild(item);
    });
  }
  
  startEditingControl(action, element) {
    // Clear previous editing state
    document.querySelectorAll('.control-key').forEach(el => {
      el.classList.remove('editing');
    });
    
    this.editingControl = { action, element };
    element.classList.add('editing');
    element.textContent = 'Press key...';
  }
  
  setControlBinding(code) {
    if (!this.editingControl) return;
    
    const { action, element } = this.editingControl;
    this.bindings.setBinding('keyboard', action, code);
    
    element.classList.remove('editing');
    element.textContent = this.bindings.getKeyName(code);
    
    this.editingControl = null;
  }
  
  show() {
    this.menuElement.classList.remove('hidden');
  }
  
  hide() {
    this.menuElement.classList.add('hidden');
    this.hideControls();
  }
  
  showControls() {
    this.menuElement.classList.add('hidden');
    this.controlsElement.classList.remove('hidden');
  }
  
  hideControls() {
    this.controlsElement.classList.add('hidden');
    this.menuElement.classList.remove('hidden');
  }
}