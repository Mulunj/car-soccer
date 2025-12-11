/**
 * Game Over Screen
 * Displays match results and restart options
 */
export class GameOverScreen {
  constructor(onRestart) {
    this.element = document.getElementById('game-over-screen');
    this.onRestart = onRestart;
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        this.hide();
        this.onRestart();
      });
    }
  }

  show(winner) {
    this.element.classList.remove('hidden');
    
    const title = this.element.querySelector('h2');
    const result = this.element.querySelector('.winner-text');
    
    if (winner === 'draw') {
      title.textContent = "MATCH DRAW!";
      result.textContent = "No winner this time";
      result.className = 'winner-text';
    } else {
      title.textContent = "MATCH FINISHED";
      result.textContent = `${winner.toUpperCase()} TEAM WINS!`;
      result.className = `winner-text ${winner}-team-text`;
    }
  }

  hide() {
    this.element.classList.add('hidden');
  }
}