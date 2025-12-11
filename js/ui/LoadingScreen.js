/**
 * Loading screen
 * Displays while assets and game initialize
 */
export class LoadingScreen {
  constructor() {
    this.element = document.getElementById('loading-screen');
  }

  show() {
    this.element.classList.remove('fade-out');
  }

  hide() {
    this.element.classList.add('fade-out');
    setTimeout(() => {
      this.element.style.display = 'none';
      // Show HUD
      document.getElementById('hud').classList.remove('hidden');
    }, 500);
  }

  updateText(text) {
    const textElement = this.element.querySelector('.loading-text');
    if (textElement) {
      textElement.textContent = text;
    }
  }
}