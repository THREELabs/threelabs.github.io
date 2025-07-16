# Ultima Online Brawler - A PeerJS Multiplayer Game

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![PeerJS](https://img.shields.io/badge/PeerJS-D32F2F?style=for-the-badge)

A host-client based multiplayer arena brawler built with modern HTML, CSS, and JavaScript, using **PeerJS** for real-time WebRTC communication. Drop into a persistent micro-world, fight other players and AI-controlled monsters, cast powerful spells, collect gold, and climb the leaderboards!

This game is designed as a single, self-contained HTML file. No server setup is required to play.

## ✨ Features

### Gameplay & Core Mechanics
*   **Host-Client Architecture**: The first player to join becomes the **Host**, acting as the authoritative server. The host manages all critical game logic, including combat, NPC behavior, and loot drops, ensuring a cheat-resistant environment.
*   **Automated Matchmaking**: Players automatically find and join the same game world using a shared, hardcoded PeerJS ID.
*   **Real-time Synchronized Movement**: Player movement is smoothly interpolated and updated across all clients for a seamless experience.
*   **Player & Terrain Collision**: Players cannot walk through each other, buildings, or into water, making positioning strategic.
*   **Idle Player Management**: Inactive players are automatically moved to a designated idle area to keep the main world clear for active players.

### ⚔️ Combat & Spellcasting System
*   **Hybrid PvP & PvE Combat**: Engage in thrilling combat against both other players (**PvP**) and AI-controlled Slime monsters (**PvE**).
*   **Targeting System**: Click to target an enemy, or press `Tab` to cycle through nearby valid targets.
*   **Spellcasting**: Target an enemy and press keys `1-4` to cast powerful spells with unique effects, mana costs, and casting times:
    *   `(1) Poison`: Envenoms the target, dealing damage over time.
    *   `(2) Lightning`: Calls down a bolt of lightning for moderate damage.
    *   `(3) Magic Arrow`: Fires a quick, low-cost bolt of energy.
    *   `(4) Flamestrike`: A slow-casting but powerful AoE fire spell.
*   **Line of Sight**: Spells can be interrupted if the caster loses line of sight to their target behind buildings.
*   **Safe & Dangerous Zones**: A designated **Safe Zone** prevents PvP combat, offering a place to rest and trade without danger.
*   **Combat State**: Players entering combat have their name tags temporarily hidden to provide a clearer view of the action.

### 📈 Player Progression & Economy
*   **Death & Resurrection**: Upon death, players become ghosts. Ghosts are ethereal and can pass through objects. To resurrect, travel to the **Shrine** in the safe zone and wait for its power to restore you to life.
*   **Loot Drops**: When killed, players drop some or all of their gold, creating a risk-reward loop. Slimes also drop a fixed amount of gold.
*   **Gold Economy**: Earn gold by defeating Slimes and other players.
*   **NPC Potion Vendor**: Spend your gold at a vendor to buy powerful consumables:
    *   `Healing Potion`: Instantly restores 40 health.
    *   `Speed Potion`: Grants a 50% movement speed boost for 20 seconds.
    *   `Damage Potion`: Adds 5 bonus damage to your melee attacks for 20 seconds.
*   **Title System**: Earn dynamic titles like `"the Hunter"`, `"the Brawler"`, or `"the Murderer"` based on your in-game statistics (PvE kills, PvP kills, deaths).

### 🌍 World & Interaction
*   **AI-Controlled NPCs**: The world is populated with Slimes that have their own AI, including an aggro range and attack patterns. They respawn automatically to keep the world active.
*   **Living World**: Features like a dynamically moving sailing boat and stylized buildings with unique roofs and doors bring the environment to life.
*   **Bank, Blacksmith, and Healer's Hut**: Non-functional but aesthetically pleasing buildings that create an immersive town environment.

### 💻 UI & Communication
*   **Live Chat & Speech Bubbles**: A classic in-game chat box allows for real-time communication. Messages also appear visually above the speaker's character.
*   **Leaderboard Command**: Type `/top` in the chat to see a real-time leaderboard of the richest players currently in the game.
*   **Dynamic UI**: The interface cleanly displays your current Gold, Mana, and Potion inventory.
*   **Target Display**: When you target an enemy, their name and a real-time health bar appear at the top of the UI for clear combat feedback.

## How It Works

This project uses a P2P game logic model where the first player to join becomes the authoritative host.

**1. Becoming the Host**
*   When the first player joins, they attempt to register with the public PeerJS server using a special, hardcoded ID (`ultima-brawler-game-host-v2`).
*   Since no one else has this ID, the registration succeeds. This player is now the **Host** and the source of truth for the entire game state. They will run all AI, validate actions, and synchronize data.

**2. Becoming a Client**
*   When another player joins, they also try to register with the same hardcoded Host ID.
*   The PeerJS server sees this ID is already taken and returns an `unavailable-id` error.
*   The game code catches this error, which signals that a host already exists.
*   The new player (the **Client**) then gets a random ID from the server and uses it to connect directly to the peer who owns the Host ID.

**3. Data Flow**
*   **Clients** send their intended actions (e.g., "I want to move to these coordinates," "I want to cast 'Poison' on Target X") only to the Host.
*   The **Host** receives these requests, validates them (Are they in range? Do they have enough mana?), updates the main game state, and then broadcasts the result to *all* connected Clients.
*   This ensures every player has a consistent view of the game world, with the Host's game state as the final authority.

## How to Play

### Running the Game
1.  **Download the Code**: Download the single `index.html` file from this repository.
2.  **Open the File**: Open the `index.html` file in your web browser (e.g., Chrome, Firefox).
3.  **Enter Your Name** and click "Find or Create Game."

To test multiplayer functionality, open the same `index.html` file in a second browser tab or send the file to a friend. The first person to load the page will become the host, and all subsequent players will automatically connect.

### Basic Controls
*   **Movement**: `W`, `A`, `S`, `D` keys or **Hold Left Mouse Button** to move.
*   **Attack**: **Click** on an enemy to begin auto-attacking.
*   **Targeting**: `Tab` to cycle targets, `Escape` to clear your target.
*   **Spells**: Press keys `1` through `4` to cast spells on your current target.
*   **Use Health Potion**: Press `6`.
*   **Chat**: Press `Enter`, type your message, and press `Enter` again to send.
