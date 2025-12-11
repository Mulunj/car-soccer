# Car Soccer Game

A browser-based 3D car soccer game built with Three.js and Cannon.js, designed for seamless multiplayer integration.

## Features

### Current (Single-Player)
- ✓ Full 3D arena with goals and walls
- ✓ Physics-based vehicle controls
- ✓ Boost and jump mechanics
- ✓ Score tracking and timer
- ✓ AI opponents (placeholder bots)
- ✓ Team switching
- ✓ Customizable key bindings
- ✓ Mobile support with touch controls
- ✓ Gamepad support

### Controls

**Keyboard (Default)**
- W/A/S/D: Drive and steer
- Space: Jump
- Shift: Boost
- ESC: Menu

**Gamepad**
- Right Trigger: Accelerate
- Left Trigger: Brake/Reverse
- Left Stick: Steer
- A Button: Jump
- B Button: Boost
- Start: Menu

**Mobile**
- Virtual joystick: Drive and steer
- JUMP button: Jump
- BOOST button: Boost

## Quick Start

1. Open `index.html` in a modern browser
2. Wait for assets to load
3. Start playing immediately!

## Architecture Highlights

- **Modular Design**: Small, focused modules in intuitive directory structure
- **Multiplayer-Ready**: Clean separation between simulation, input, and rendering
- **Serializable State**: All game state can be transmitted over network
- **Command Pattern**: Input generates commands, enabling network command transmission
- **Platform Agnostic**: Keyboard, gamepad, and touch support

## File Structure


