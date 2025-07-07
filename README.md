# Ultima Online Brawler - A PeerJS Multiplayer Game

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![PeerJS](https://img.shields.io/badge/PeerJS-D32F2F?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)

A simple, browser-based 2D multiplayer game built to demonstrate real-time P2P communication using PeerJS. The project uses a client-server model for signaling and a host-client model for game state management, where the first player to join becomes the authoritative host.

# Ultima Online Brawler

A host-client based multiplayer arena brawler built with HTML, CSS, and JavaScript using PeerJS for WebRTC communication. Drop into a persistent world, fight other players and AI-controlled monsters, collect gold, and climb the leaderboards!

## ✨ Features

###  Gameplay
*   **Automated Matchmaking**: Players automatically find and join the same game world using a shared game ID, creating a seamless multiplayer experience.
*   **Authoritative Host-Client Architecture**: The first player to join becomes the **Host**, acting as the server. The host manages all critical game logic, including combat resolution, NPC behavior, and loot drops, ensuring a cheat-resistant environment.

### ⚔️ Combat System
*   **Hybrid PvP & PvE Combat**: Engage in thrilling combat against both other players (**PvP**) and AI-controlled Slime monsters (**PvE**).
*   **Simple & Direct Combat**: Attack targets with a simple click. Damage is calculated and synchronized in real-time.
*   **Safe & Dangerous Zones**: A designated **Safe Zone** prevents PvP, offering a place to interact and trade without danger.
*   **Combat State**: Players entering combat have their name tags temporarily hidden to provide a clearer view of the action.

### 📈 Player Progression & Economy
*   **Death & Loot Drops**: Upon death, players drop a portion (or all) of their gold, which can be picked up by others.
*   **Ghost & Resurrection System**: Defeated players become "ghosts" and must travel to a special **Shrine** to be resurrected.
*   **Gold Economy**: Earn gold by defeating Slimes and other players.
*   **NPC Potion Vendor**: Spend your gold at a vendor to buy powerful consumables:
    *   `Health Potion`: Instantly restores health.
    *   `Speed Potion`: Gain a temporary movement speed boost.
    *   `Damage Potion`: Gain a temporary attack damage buff.
*   **Title System**: Earn dynamic titles like `"the Hunter"` or `"the Brawler"` based on your in-game statistics (kills, deaths).

### 🌍 World & Interaction
*   **Real-time Synchronized Movement**: Player movement is smooth and updated across all clients.
*   **Player & Terrain Collision**: Players cannot walk through each other or into water, making positioning strategic.
*   **AI-Controlled NPCs**: The world is populated with Slimes that have their own AI, agro range, and attack patterns. They respawn automatically to keep the world active.
*   **Idle Player Management**: Inactive players are automatically moved to a designated idle area to keep the main world clear.

### 💻 UI & Communication
*   **Live Chat**: A classic in-game chat box allows for real-time communication between all players.
*   **Speech Bubbles**: Chat messages also appear visually above the speaker's character for immediate, localized communication.
*   **Leaderboard**: Type `/top` in the chat to see a real-time leaderboard of the richest players in the game.
*   **Dynamic UI**: The interface displays your current gold, potion inventory, and real-time health bar.

This project uses a combination of a central signaling server and a P2P game logic model.

### 1. The Signaling Server (The "Matchmaker")

- A lightweight Node.js and Express.js server running the peer library
- Its only job is to introduce players to each other. It does not handle any game logic (movement, combat, etc.)
- When a player wants to join a game, they connect to this server and register a unique ID. The server keeps a list of who is online
- This project is configured to use a free server hosted on Glitch

### 2. The Host/Client Game Model

The game logic itself is managed in a peer-to-peer fashion, with one player acting as the "Host".

**Becoming the Host:**
- When the first player joins, they attempt to register with the signaling server using a special, hardcoded ID (`mini-uo-game-v1-any-string-works`)
- Since no one else has this ID, the registration succeeds. This player is now the Host and the source of truth for all game state

**Becoming a Client:**
- When a second player joins, they also try to register with the `HOST_ID`
- The signaling server sees that this ID is already taken and returns an `unavailable-id` error
- This error signals to the new player that a host already exists
- The new player then gets a random ID from the server and uses it to connect to the peer who owns the `HOST_ID`

### 3. Data Flow

- Clients send their actions (e.g., "I am moving left," "I am attacking Player X") only to the Host
- The Host receives these actions, updates the main game state (e.g., moves the player, reduces health), and then broadcasts the updated state to all connected Clients
- This ensures all players have a consistent view of the game world, with the Host as the final authority

## Setup and Installation

### Prerequisites

- A web browser
- A Glitch account (free)
- Basic knowledge of HTML/JavaScript

### Part 1: Set Up the Signaling Server (on Glitch)

1. **Create a Glitch Account**: Go to [Glitch.com](https://glitch.com) and sign up for a free account

2. **Create a New Project**: Create a new project from the "hello-express" template

3. **Set up package.json**:
   ```json
   {
     "name": "my-peerjs-server",
     "version": "1.0.0",
     "description": "A PeerJS Game Server",
     "main": "server.js",
     "scripts": {
       "start": "node server.js"
     },
     "dependencies": {
       "express": "^4.18.2",
       "peer": "^1.0.2"
     },
     "engines": {
       "node": "16.x"
     }
   }
   ```

4. **Set up server.js**:
   ```javascript
   const express = require('express');
   const { ExpressPeerServer } = require('peer');

   const app = express();
   const port = process.env.PORT || 3000;
   const server = app.listen(port, () => {
     console.log('Server is listening on port:', port);
   });

   const peerServer = ExpressPeerServer(server, {
     debug: true,
     allow_discovery: true,
   });

   app.use('/peerjs', peerServer);
   console.log('PeerJS server is running and waiting for connections on /peerjs');
   ```

5. **Get Your Server URL**: Glitch will automatically run the server. Find your project's public URL (e.g., `your-random-name.glitch.me`)

### Part 2: Set Up the Game Client

1. **Download the Code**: Clone this repository or download the `index.html` file

2. **Configure the Server Address**: Open `index.html` and update the `PEER_SERVER_CONFIG` with your Glitch URL:
   ```javascript
   const PEER_SERVER_CONFIG = {
       host: 'your-random-name.glitch.me', // <-- CHANGE THIS TO YOUR GLITCH URL
       path: '/peerjs',
       secure: true,
   };
   ```

3. **Save the file**

### Part 3: Running the Game

1. Open the modified `index.html` file in your web browser
2. To test multiplayer functionality, open the same file in a second browser tab or on a different device
3. The first player to join will become the host, and subsequent players will automatically connect as clients

## File Structure

```
mini-uo/
├── index.html          # Main game file (client-side)
├── README.md          # This file
└── server/            # Server files (for Glitch)
    ├── package.json
    └── server.js
```

## Future Improvements

- **Animations**: Add walking, attacking, and death animations
- **More Game Mechanics**: Introduce items, abilities, or different character types
- **Scalability**: For more than a handful of players, the "broadcast from host" model can become a bottleneck. A more advanced implementation might use a dedicated server or more complex P2P state synchronization
- **UI/UX Polish**: Improve the user interface and overall visual design

## Contributing

Feel free to fork this project and submit pull requests for improvements!

## License

This project is open source and available under the [MIT License](LICENSE).
