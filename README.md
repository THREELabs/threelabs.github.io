# Ultima Brawler - [Play Here!](https://threelabs.github.io) 

A minimalist, real-time multiplayer arena game inspired by the classic MMO, Ultima Online, built entirely in the browser.

This project brings the thrill of classic open-world PvP and PvE to the web. Developed with plain HTML, CSS, and JavaScript, it uses a peer-to-peer (P2P) networking model via WebRTC (PeerJS), where the first player to join a game acts as the host. No complex backend or downloads are required—just open the file and start brawling.

## ✨ Key Features

*   **Real-time Multiplayer:** Engage in seamless P2P combat and movement.
*   **PvP and PvE Combat:** Fight other players or hunt AI-controlled slimes that roam the world.
*   **Loot System:** Defeated monsters drop gold for players to collect.
*   **Death and Resurrection:** When a player's health reaches zero, they become a ghost. Ghosts are non-corporeal and must travel to a shrine to be resurrected.
*   **Safe Zones:** A designated area of the map where combat is disabled.
*   **Live Chat:** Communicate with other brawlers in the realm.

## 🚀 Tech Stack

*   **Frontend:** HTML5, CSS3, JavaScript (ES6+)
*   **Networking:** [PeerJS](https://peerjs.com/) (A library simplifying WebRTC)
*   **PeerJS Server:** A free Glitch instance is used for initial peer discovery.

## 🎮 How to Play

1.  Open the `index.html` file in your web browser.
2.  Enter a name and click "Find or Create Game".
    *   The first player to join becomes the host.
    *   Subsequent players will automatically connect to the host.
3.  Use **WASD** keys to move.
4.  **Click** on other players or monsters to attack.
5.  Press **Enter** to open the chat, type your message, and press **Enter** again to send.
