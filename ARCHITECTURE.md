# Car Soccer - Architecture Documentation

## Overview
This car soccer game is built with a clean, modular architecture designed to seamlessly transition from single-player to multiplayer.

## Core Principles

### 1. Separation of Concerns
- **Simulation**: Pure game logic and physics (GameSimulation, PhysicsSystem)
- **Input**: Command generation from various sources (InputSystem)
- **Rendering**: Visual representation (RenderSystem)
- **UI**: User interface and menus (HUD, Menu, LoadingScreen)

### 2. State Management
- **GameState**: Centralized, serializable game state
- All game entities update the GameState
- State can be serialized for network transmission
- Rendering reads from GameState, never modifies it

### 3. Command Pattern
- Input devices generate commands, not direct actions
- Commands flow: Input → Simulation → State Update → Render
- This allows for network command transmission in multiplayer

## Directory Structure


