# 🎮 Sphere UO Web - Mage Combat

A browser-based implementation of Ultima Online's PvP magic combat system using Phaser 3. This project focuses on recreating the strategic spell-casting mechanics that made Sphere Shard's PvP so legendary.

## ✨ Current Features

### Core Mechanics
- Real-time movement using mouse control
- Targeting system for spell casting
- Mana management and regeneration
- Health tracking and regeneration
- Collision detection with environment
- Spell casting cooldowns and fizzle mechanics

### Environment
- Dynamic world with obstacles:
  - Houses for cover
  - Walls for strategic positioning
  - Trees for environmental detail
  - Roads and grass texturing
- Tactical positioning using line of sight

### Combat System
- Magic Arrow spell implementation
- Spell casting animations and effects
- Targeting indicator system
- Spell collision with environment
- Fizzle effects for interrupted spells
- Cast time and cooldown management

### UI Features
- Health and mana bars for both players
- Target selection indicator
- Character shadows for visual depth
- Clear casting feedback
- Spell fizzle visual effects

## 🚀 Getting Started

### Prerequisites
- Modern web browser with JavaScript enabled
- Local web server for development

### Quick Start
1. Clone the repository:
```bash
git clone https://github.com/yourusername/sphere-uo-web.git
```

2. Serve the directory using your preferred web server. For example, using Python:
```bash
python -m http.server 8000
```

3. Open your browser and navigate to:
```
http://localhost:8000
```

## 🎮 Controls

- **Mouse Movement**: Hold left mouse button to move your character
- **Targeting**: Click on the enemy (red mage) to target/untarget
- **Spell Casting**: Press 'R' to cast Magic Arrow (costs 20 mana)
- **Strategy**: Use walls and houses for cover - spells cannot pass through them!

## 🛠️ Technical Details

### Dependencies
- Phaser 3.60.0
- Modern browser with WebGL support

### Project Structure
```
sphere-uo-web/
├── index.html          # Main game page and styles
└── assets/            
    ├── mage-blue.png   # Player character
    ├── mage-red.png    # Enemy character
    ├── wall.png        # Wall texture
    ├── house.png       # House texture
    ├── tree.png        # Tree texture
    └── grass.png       # Ground texture
```

### Core Classes
- `MainScene`: Main game scene handling core gameplay
  - Player and enemy creation
  - World object generation
  - Input handling
  - Spell casting system
  - Collision detection
  - Status management

## 🎯 Upcoming Features

- Additional spells from UO's spell book
- Multiple character classes
- Network multiplayer support
- Advanced targeting system
- More environmental interactions
- Character stats and progression
- Equipment system

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/awesome-feature`
3. Commit your changes: `git commit -m 'Add awesome feature'`
4. Push to the branch: `git push origin feature/awesome-feature`
5. Open a Pull Request


## 🙏 Acknowledgments

- Ultima Online and its magical combat system
- Phaser game framework team
- Original UO sprite artists

---
*Note: This project is a fan recreation and is not affiliated with or endorsed by Electronic Arts or the original Ultima Online development team.*
