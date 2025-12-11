/**
 * Network interface abstraction
 * Placeholder for future multiplayer integration with WebsimSocket
 * 
 * This interface defines the contract for network communication
 * Single-player mode uses a null implementation
 * Multiplayer will implement actual network sync
 */
export class NetworkInterface {
  constructor(isMultiplayer = false) {
    this.isMultiplayer = isMultiplayer;
    this.room = null;
  }

  /**
   * Initialize network connection
   * In single-player, this is a no-op
   */
  async connect() {
    if (!this.isMultiplayer) {
      return Promise.resolve();
    }

    // Future: Initialize WebsimSocket
    // this.room = new WebsimSocket();
    // await this.room.initialize();
    // this.setupRoomHandlers();
  }

  /**
   * Send command to server
   * In single-player, commands are handled locally
   */
  sendCommand(command) {
    if (!this.isMultiplayer) {
      // Local handling
      return;
    }

    // Future: Send via WebsimSocket
    // this.room.updatePresence({ lastCommand: command });
  }

  /**
   * Broadcast state update
   * In single-player, this is a no-op
   */
  broadcastState(state) {
    if (!this.isMultiplayer) {
      return;
    }

    // Future: Broadcast via WebsimSocket
    // this.room.updateRoomState({ gameState: state.serialize() });
  }

  /**
   * Subscribe to state updates
   * In single-player, callback is never called
   */
  onStateUpdate(callback) {
    if (!this.isMultiplayer) {
      return () => {};
    }

    // Future: Subscribe via WebsimSocket
    // return this.room.subscribeRoomState(callback);
  }

  /**
   * Subscribe to player join/leave
   */
  onPlayerChange(callback) {
    if (!this.isMultiplayer) {
      return () => {};
    }

    // Future: Subscribe via WebsimSocket
    // return this.room.subscribePresence(callback);
  }
}