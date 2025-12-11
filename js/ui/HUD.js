/**
 * Heads-Up Display
 * Shows score, timer, and boost meter
 */
export class HUD {
  constructor() {
    this.element = document.getElementById('hud');
    this.blueScore = document.querySelector('.blue-team .score');
    this.orangeScore = document.querySelector('.orange-team .score');
    this.timer = document.querySelector('.timer');
    this.boostFill = document.querySelector('.boost-fill');
  }

  show() {
    this.element.classList.remove('hidden');
  }

  hide() {
    this.element.classList.add('hidden');
  }

  update(gameState) {
    // Update scores
    this.blueScore.textContent = gameState.score.blue;
    this.orangeScore.textContent = gameState.score.orange;

    // Update timer
    const timeLeft = Math.max(0, 300 - gameState.matchTime);
    const minutes = Math.floor(timeLeft / 60);
    const seconds = Math.floor(timeLeft % 60);
    this.timer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Update boost meter
    const playerVehicle = gameState.vehicles['player'];
    if (playerVehicle) {
      this.boostFill.style.width = `${playerVehicle.boost}%`;
    }
  }
}