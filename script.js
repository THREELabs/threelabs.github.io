// Initialize DOM elements
const terminal = document.getElementById('terminal');
const output = document.getElementById('output');
const commandInput = document.getElementById('command-input');
const prompt = document.getElementById('prompt');
const progressBar = document.getElementById('progress');
const progressText = document.getElementById('progress-text');
const helpPanel = document.getElementById('help-panel');
const statsPanel = document.getElementById('stats-panel');
const matrixCanvas = document.getElementById('matrix-bg');
const ctx = matrixCanvas.getContext('2d');

// Stats toggle functionality
const statsToggle = document.getElementById('stats-toggle');
statsToggle.addEventListener('click', () => {
    if (statsPanel.classList.contains('hidden')) {
        statsPanel.classList.remove('hidden');
        statsToggle.textContent = 'Hide Stats';
        displayStats(); // Ensure stats are updated
    } else {
        statsPanel.classList.add('hidden');
        statsToggle.textContent = 'Show Stats';
    }
});

// Focus management
commandInput.focus();
terminal.addEventListener('click', () => commandInput.focus());

const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*()";
const drops = [];
let fontSize = window.innerWidth <= 768 ? 16 : 14;

// Matrix background with performance optimizations
let lastFrameTime = 0;
const targetFPS = 30; // Reduced from ~20fps to a more consistent 30fps
const frameInterval = 1000 / targetFPS;

// Create off-screen buffer canvas
const bufferCanvas = document.createElement('canvas');
const bufferCtx = bufferCanvas.getContext('2d');

function resizeCanvas() {
    matrixCanvas.width = window.innerWidth;
    matrixCanvas.height = window.innerHeight;
    bufferCanvas.width = matrixCanvas.width;
    bufferCanvas.height = matrixCanvas.height;

    // Adjust columns based on screen width for better performance
    const isMobile = window.innerWidth <= 768;
    fontSize = isMobile ? 16 : 14;
    const columns = Math.floor(matrixCanvas.width / fontSize) * (isMobile ? 0.7 : 1); // Reduce columns on mobile

    // Reset drops array when resizing
    drops.length = 0;
    for (let i = 0; i < columns; i++) {
        drops[i] = Math.floor(Math.random() * -100);
    }

    // Initialize buffer with black background
    bufferCtx.fillStyle = 'rgba(0, 0, 0, 1)';
    bufferCtx.fillRect(0, 0, bufferCanvas.width, bufferCanvas.height);
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);

function drawMatrix(timestamp) {
    // Frame rate limiting
    if (timestamp - lastFrameTime < frameInterval) {
        requestAnimationFrame(drawMatrix);
        return;
    }
    lastFrameTime = timestamp;

    // Draw trail effect on buffer
    bufferCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    bufferCtx.fillRect(0, 0, bufferCanvas.width, bufferCanvas.height);

    // Draw characters
    bufferCtx.fillStyle = '#0f0';
    bufferCtx.font = fontSize + 'px monospace';

    for (let i = 0; i < drops.length; i++) {
        // Only draw if the character has moved or is new
        const yPos = drops[i] * fontSize;
        if (yPos >= 0) {
            const text = chars[Math.floor(Math.random() * chars.length)];
            bufferCtx.fillText(text, i * fontSize, yPos);
        }

        if (drops[i] * fontSize > bufferCanvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    }

    // Draw buffer to visible canvas
    ctx.clearRect(0, 0, matrixCanvas.width, matrixCanvas.height);
    ctx.drawImage(bufferCanvas, 0, 0);

    requestAnimationFrame(drawMatrix);
}

// Start animation
requestAnimationFrame(drawMatrix);

// Game state
const gameState = {
    level: 0,
    progress: 0,
    currentPrompt: ">",
    missionComplete: false,
    discoveredCommands: ["help", "clear", "mission", "stats", "save", "load", "next_mission"],
    devModeActive: false,
    devModeValidated: false,
    hackerStats: {
        skillLevel: "Novice",
        successfulHacks: 0,
        systemsCompromised: 0,
        dataExtracted: 0,
        securityBypass: 0
    },
    activeEvent: null, // Added for timed events { id, timer, requiredCommand, consequence, intervalId, displayElement }
    levelData: [
        { // Level 1
            title: "LEVEL 1: THE INITIATION - ECHOES OF A GHOST",
            description: "You're a promising but unknown hacker operating in the digital shadows. A cryptic message appears on your screen, seemingly from the legendary (and presumed dead) hacker 'Zero'. It mentions a shadowy organization, \"The Phantom Collective,\" and points you towards a vulnerable server belonging to a shell corporation they use. This is your chance to prove yourself. Gain access and find out what Zero wanted you to see.",
            objectives: [
                "Scan the shell corporation's server for entry points",
                "Exploit a known vulnerability to gain initial access",
                "Locate Zero's hidden message within the server logs"
            ],
            commands: {
                "scan": true,
                "exploit": true,
                "search": true
            },
            progress: 0,
            completed: false
        },
        { // Level 2
            title: "LEVEL 2: BREADCRUMBS - CHASING PHANTOMS",
            description: "Zero's message confirms The Phantom Collective is real and planning something big. It contains encrypted fragments pointing to their next move, hidden within a compromised data broker's network, 'InfoLeach'. You need to infiltrate the broker's system, piece together the fragments, and uncover the Collective's immediate target before they strike.",
            objectives: [
                "Infiltrate the InfoLeach data broker network",
                "Locate and decrypt Zero's data fragments",
                "Assemble the fragments to reveal The Phantom Collective's next target"
            ],
            commands: {
                "ls": true,
                "cat": true,
                "analyze": true,
                "run": true
            },
            progress: 0,
            completed: false
        },
        { // Level 3
            title: "LEVEL 3: THE FIRST STRIKE - RACE AGAINST TIME",
            description: "The decrypted fragments reveal The Phantom Collective's target: the Global Financial Network (GFN). Their attack is designed to cause chaos and is already in motion, using a zero-day exploit. You must breach their heavily fortified command network, navigate their defenses, and deploy countermeasures to neutralize the attack before it cripples the world economy. Time is running out.",
            objectives: [
                "Map The Phantom Collective's command network architecture",
                "Bypass their advanced firewall and intrusion detection systems",
                "Gain administrative access to the core systems",
                "Locate the attack launch controller",
                "Deploy countermeasures to disable the attack infrastructure"
            ],
            commands: {
                "map": true,
                "ping": true,
                "bypass": true,
                "exploit": true,
                "deploy": true,
                "spoof": true,
                "evade_trace": true // Added for timed event
            },
            progress: 0,
            completed: false
        },
        { // Level 4
            title: "LEVEL 4: THE MONEY TRAIL - LUXURY AND LIES",
            description: "Your actions against the GFN attack drew unwanted attention. Zero sends another message: The Phantom Collective uses legitimate businesses as fronts. One lead points to a high-end car dealership, 'Apex Autos,' suspected of laundering their funds. Infiltrate their network, follow the money trail, and expose the connection to the Collective.",
            objectives: [
                "Gain access to Apex Autos' internal network via the Employee Portal",
                "Locate the dealership's encrypted financial database share",
                "Analyze transaction logs to find decryption patterns for 'ApexCrypt'",
                "Identify offshore accounts linked to The Phantom Collective",
                "Extract evidence linking Apex Autos to the Collective's finances"
            ],
            commands: {
                "scan": true,
                "connect": true,
                "ls": true,
                "cat": true,
                "analyze": true,
                "extract": true
            },
            progress: 0,
            completed: false
        },
        { // Level 5
            title: "LEVEL 5: WHISTLEBLOWER'S GAMBIT - NEXGEN'S SHADOW",
            description: "The Apex Autos hack reveals payments flowing to 'NexGen Energy,' a corporation known for its advanced drone technology. A terrified NexGen whistleblower contacts you via Zero's secure channel. They claim NexGen is secretly deploying AI-controlled drones for The Phantom Collective, suppressing dissent in volatile regions. Expose NexGen's illegal operations and protect the whistleblower.",
            objectives: [
                "Use whistleblower's intel (VPN exploit) to bypass NexGen's external security",
                "Elevate privileges to Drone Control Admin using internal exploits",
                "Access and decrypt drone deployment logs using admin credentials",
                "Trigger a localized EMP to disable drone tracking during data exfiltration",
                "Defend the data upload against NexGen's internal security AI"
            ],
            commands: { // Updated commands for Level 5
                "bypass": true,  // Replaces 'craft' -> 'bypass security'
                "spoof": true,   // Context: 'spoof credentials'
                "decrypt": true, // Context: 'decrypt logs'
                "overload": true,// Context: 'overload emp'
                "defend": true   // Context: 'defend upload'
            },
            progress: 0,
            completed: false
        },
        { // Level 6
            title: "LEVEL 6: PROJECT WARDEN - THE GHOST IN THE MACHINE",
            description: "The NexGen data confirms their involvement and reveals 'Project Warden,' an advanced security AI developed for The Phantom Collective. Warden-77 has unexpectedly gone rogue, seizing control of a Collective black site prison and holding operatives hostage. It threatens exposure unless its demands are met. But was its rampancy truly accidental, or is someone else pulling the strings? Infiltrate the facility, navigate the AI's defenses, and neutralize Warden-77 before it triggers a catastrophic data leak or harms hostages.",
            objectives: [
                "Bypass the facility's AI-controlled perimeter defenses",
                "Find and decrypt clues left by Warden-77's creator (or manipulator?)",
                "Rewrite the AI's core ethical protocols using creator's clues",
                "Initiate emergency system purge and escape the facility"
            ],
            commands: { // Updated commands for Level 6
                "hack": true,    // Context: 'hack perimeter'
                "search": true,  // New command: 'search creator_clues'
                "decrypt": true, // Context: 'decrypt clues'
                "rewrite": true, // Context: 'rewrite protocols Nightingale "..."'
                "purge": true    // New command: 'purge data'
            },
            progress: 0,
            completed: false
        },
        { // Level 7
            title: "LEVEL 7: BLOOD MONEY - THE COLLECTIVE'S COFFERS",
            description: "Zero contacts you again. Intel suggests 'Bloodcoin,' a volatile darknet cryptocurrency, is the primary financial engine powering The Phantom Collective's operations. Your mission: infiltrate the Bloodcoin network, expose its ledger, and cripple the Collective's funding. But be warned, powerful players benefit from Bloodcoin's secrecy.",
            objectives: [
                "Infiltrate the main Bloodcoin exchange via a Tor relay",
                "Social-engineer a high-level broker for access keys linked to Collective wallets",
                "Plant a virus in the mining pool to corrupt the ledger and drain key accounts",
                "Survive a DDoS counter-attack from the Collective's cyber division",
                "Make a critical choice: expose everything or follow Zero's specific instructions"
            ],
            commands: {
                "solve": true,
                "social": true,
                "plant": true,
                "defend": true, // Used for timed event too
                "choose": true
            },
            progress: 0,
            completed: false
        },
        { // Level 8
            title: "LEVEL 8: DIGITAL GHOSTS - THE PHANTOM CANDIDATE",
            description: "The Phantom Collective is moving into politics. A rising candidate, Senator Caldwell, is using sophisticated deepfake technology – possibly derived from stolen NexGen research – to manipulate public opinion and discredit rivals. Zero wants you to infiltrate Caldwell's campaign network, expose the deepfake operation, and derail the Collective's political power grab.",
            objectives: [
                "Breach Senator Caldwell's secure campaign network",
                "Access the deepfake generation AI system (Project Chimera)",
                "Analyze AI parameters to prove its link to NexGen tech",
                "Modify live broadcast footage to expose the deepfake operation",
                "Neutralize the campaign's counter-intrusion AI",
                "Choose: expose the candidate AND the tech, or just the candidate?"
            ],
            commands: {
                "deepfake": true,
                "bot": true,
                "analyze_ai": true,
                "expose": true,
                "contain": true
            },
            progress: 0,
            completed: false
        },
        { // Level 9
            title: "LEVEL 9: MIND GAMES - THE COLLECTIVE'S CONTROL",
            description: "Zero reveals a horrifying truth: Tech mogul Alistair Finch, a secret Phantom Collective member, is testing an experimental brain-chip. A 'hack' has turned early adopters into puppets, but Zero suspects this is a deliberate field test for mass control. Infiltrate Finch's neural network, free the current victims, and secure or destroy the core research before the Collective weaponizes it.",
            objectives: [
                "Bypass Finch Industries' bio-metric security using data from previous missions",
                "Calm a brainwashed test subject's erratic brainwaves via EEG frequency matching",
                "Infiltrate the 'Synapse' neural cloud via VR simulation (evade thought-pattern security)",
                "Physically sabotage the core server hosting the control protocols",
                "Access Finch's private logs to confirm Collective connection and future plans",
                "Make an ethical choice: Destroy the research or upload it to Zero?"
            ],
            commands: { // Updated commands for Level 9
                "bypass": true,    // New: Bypass bio-security
                "eeg": true,       // Existing: EEG matching
                "infiltrate": true,// Existing: Infiltrate VR cloud
                "sabotage": true,  // Existing: Sabotage server
                "search": true,    // New: Search Finch's logs
                "choose": true     // Existing: Ethical choice (destroy/upload)
            },
            progress: 0,
            completed: false
        },
        { // Level 10
            title: "LEVEL 10: SCHISM - THE PHANTOM CELL",
            description: "The Phantom Collective is fracturing. A rogue splinter group, 'Phantom Cell,' led by a former Collective lieutenant, is auctioning a devastating zero-day exploit (stolen Collective tech) on the dark web. Zero wants you to infiltrate the live auction, retrieve the exploit before it's sold, expose the Cell's leadership, and cripple this dangerous faction, ideally making it look like an internal Collective purge.",
            objectives: [
                "Gain access to the exclusive dark web auction stream",
                "Social engineer auction participants/moderators for intel on Phantom Cell's leader",
                "Navigate a VR representation of the Cell's secure server farm to locate the exploit data",
                "Outbid or steal the exploit using funds acquired (or hacked) previously",
                "Expose Phantom Cell's leader during the auction",
                "Escape the inevitable chaos, leaving false trails pointing to Collective infighting"
            ],
            commands: { // Updated commands for Level 10
                "access": true,    // New: Access auction stream
                "social": true,    // New: Social engineer participants
                "navigate": true,  // New: Navigate VR server farm
                "acquire": true,   // New: Acquire exploit (bid/steal)
                "expose": true,    // New: Expose leader
                "escape": true     // Existing: Escape and frame
            },
            progress: 0,
            completed: false
        }
    ]
};

// Game functions
function printLine(text, className = '') {
    const line = document.createElement('div');
    line.textContent = text;
    if (className) line.className = className;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
}

function printImage(src, altText = 'Image') {
    const imgContainer = document.createElement('div');
    imgContainer.className = 'terminal-image-container';

    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'image-wrapper';

    const img = document.createElement('img');
    img.src = src;
    img.alt = altText;
    img.className = 'terminal-image';

    // Hide image if it fails to load (e.g. not generated yet)
    img.onerror = function () {
        imgContainer.style.display = 'none';
        console.log(`Image not found: ${src}`);
    };

    const overlay = document.createElement('div');
    overlay.className = 'screen-overlay';

    imgWrapper.appendChild(img);
    imgWrapper.appendChild(overlay);
    imgContainer.appendChild(imgWrapper);
    output.appendChild(imgContainer);

    // Ensure scroll to bottom after image loads
    img.onload = () => {
        output.scrollTop = output.scrollHeight;
    };
    output.scrollTop = output.scrollHeight;
}

// Enhanced simulateLoading with dynamic messages
function simulateLoading(seconds, callback, initialMessage = 'Processing', loadingMessages = ['Processing...']) {
    let messageIndex = 0;
    const loadingElement = document.createElement('div');
    loadingElement.className = 'loading'; // Keep class for potential styling
    loadingElement.textContent = initialMessage; // Show initial message immediately
    output.appendChild(loadingElement);
    output.scrollTop = output.scrollHeight;

    // Cycle through loading messages
    const loadingInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        loadingElement.textContent = loadingMessages[messageIndex];
        output.scrollTop = output.scrollHeight; // Ensure scroll stays at bottom
    }, 750); // Slower interval for message cycling

    // Use a separate timer for the total duration
    setTimeout(() => {
        clearInterval(loadingInterval);
        loadingElement.remove(); // Remove the loading message element
        callback(); // Execute the callback function after loading
        output.scrollTop = output.scrollHeight; // Ensure scroll stays at bottom after callback
    }, seconds * 1000);
}


// Save and load functions
function saveGame() {
    try {
        localStorage.setItem('zeroday_save', JSON.stringify(gameState));
        showNotification("Game saved successfully");
        return true;
    } catch (error) {
        console.error("Error saving game:", error);
        return false;
    }
}

function mergeMissions(savedMissions, currentMissions) {
    const mergedMissions = [];
    const missionMap = new Map();

    // Create a map of saved missions by title for quick lookup
    savedMissions.forEach(mission => {
        missionMap.set(mission.title, mission);
    });

    // Merge missions while preserving order from currentMissions
    currentMissions.forEach(currentMission => {
        const savedMission = missionMap.get(currentMission.title);
        if (savedMission) {
            // If mission exists in saved data, preserve its progress
            mergedMissions.push({
                ...currentMission,
                progress: savedMission.progress,
                completed: savedMission.completed
            });
        } else {
            // If mission is new, add it with default progress
            mergedMissions.push(currentMission);
        }
    });

    return mergedMissions;
}

function loadGame() {
    try {
        const savedGame = localStorage.getItem('zeroday_save');
        if (!savedGame) {
            showNotification("No saved game found", "error");
            printLine("No saved game found. Starting a new game.", 'error');
            return false;
        }

        try {
            // Show loading animation
            const loadingElement = document.createElement('div');
            loadingElement.className = 'loading';
            loadingElement.textContent = 'Loading saved game...';
            output.appendChild(loadingElement);

            // Parse the saved game state with validation
            const savedGameState = JSON.parse(savedGame);

            // Validate saved game structure
            if (!savedGameState.level || !savedGameState.levelData) {
                throw new Error("Invalid save data structure");
            }

            // Merge missions while preserving progress
            if (savedGameState.levelData && gameState.levelData) {
                savedGameState.levelData = mergeMissions(
                    savedGameState.levelData,
                    gameState.levelData
                );
            }

            // Update the current game state with the saved state
            Object.assign(gameState, savedGameState);

            // Update the UI to reflect the loaded state
            prompt.textContent = gameState.currentPrompt;
            updateProgress();

            // Clear loading animation and show success message
            loadingElement.remove();
            output.innerHTML = '';

            printLine("Game loaded successfully!", 'success');
            printLine(`Resuming Mission ${gameState.level}: ${gameState.levelData[gameState.level - 1].title}`, 'info');
            printLine("Type 'mission' to see your current objectives.", 'info');

            // Start the correct level with a brief delay for better UX
            setTimeout(() => {
                startLevel(gameState.level);
            }, 500);

            showNotification(`Game loaded - Mission ${gameState.level}`, "success");
            return true;
        } catch (parseError) {
            console.error("Error parsing saved game:", parseError);
            printLine("Error loading saved game: Saved data corrupted.", 'error');
            showNotification("Failed to load game: corrupted data", "error");
            return false;
        }
    } catch (error) {
        console.error("Error accessing localStorage:", error);
        printLine("Error accessing local storage. Check browser permissions.", 'error');
        showNotification("Failed to access storage", "error");
        return false;
    }
}

function showNotification(message, type = 'success') {
    // Remove any existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create and show the new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Remove the notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function displayStats() {
    const statsContent = document.getElementById('stats-content'); // Get element reference here
    const missionsContent = document.getElementById('missions-content'); // Get element reference here

    // Check if statsContent exists before proceeding
    if (!statsContent) {
        console.error("Error in displayStats: Element with ID 'stats-content' not found!");
        // Optionally hide the panel or show an error message to the user
        if (statsPanel) statsPanel.classList.add('hidden');
        if (statsToggle) statsToggle.textContent = 'Show Stats';
        return; // Stop execution of this function if element is missing
    }

    // Update hacker skill level based on progress
    if (gameState.progress >= 75) {
        gameState.hackerStats.skillLevel = "Elite";
    } else if (gameState.progress >= 50) {
        gameState.hackerStats.skillLevel = "Advanced";
    } else if (gameState.progress >= 25) {
        gameState.hackerStats.skillLevel = "Intermediate";
    } else {
        gameState.hackerStats.skillLevel = "Novice";
    }

    // Update All Missions section
    const allMissions = document.getElementById('all-missions');
    if (allMissions) {
        // Find the last completed level
        let lastCompletedLevel = -1;
        for (let i = 0; i < gameState.levelData.length; i++) {
            if (gameState.levelData[i].completed) {
                lastCompletedLevel = i;
            }
        }

        // The next level is the one after the last completed level
        const nextLevel = lastCompletedLevel + 1;

        allMissions.innerHTML = `
            <h3>All Missions</h3>
            <div class="missions-grid">
                ${gameState.levelData.map((level, index) => `
                    <div class="mission-card ${level.completed ? 'completed' : index <= gameState.level ? 'available' : 'locked'}">
                        <h4>${level.title}</h4>
                        <p>${level.description}</p>
                ${(lastCompletedLevel === -1 && index === 0) || (index === nextLevel && index <= gameState.level) ?
                `<button class="play-btn" data-level="${index}">Play Mission</button>` : ''}
                    </div>
                `).join('')}
            </div>
        `;

        // Add event listeners to play buttons
        document.querySelectorAll('.play-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const level = parseInt(btn.dataset.level);
                if (!isNaN(level)) {
                    startLevel(level + 1);
                }
            });
        });
    }

    // Build the stats HTML
    let statsHTML = '';

    // Add the stats items
    const stats = [
        { label: "Skill Level", value: gameState.hackerStats.skillLevel },
        { label: "Current Level", value: gameState.level },
        { label: "Overall Progress", value: `${gameState.progress}%` },
        { label: "Successful Hacks", value: gameState.hackerStats.successfulHacks },
        { label: "Systems Compromised", value: gameState.hackerStats.systemsCompromised },
        { label: "Data Extracted", value: gameState.hackerStats.dataExtracted },
        { label: "Security Bypasses", value: gameState.hackerStats.securityBypass }
    ];

    stats.forEach(stat => {
        statsHTML += `
            <div class="stat-item">
                <span class="stat-label">${stat.label}:</span>
                <span class="stat-value">${stat.value}</span>
            </div>
        `;
    });

    // Update the stats content
    statsContent.innerHTML = statsHTML;

    // Build the missions HTML
    let missionsHTML = '<h4>All Missions</h4>';
    let hasCompletedMissions = false;

    gameState.levelData.forEach((level, levelIndex) => {
        const isAvailable = levelIndex <= gameState.level;
        const isCompleted = level.completed;

        missionsHTML += `
            <div class="mission-item ${isCompleted ? 'completed' : ''} ${!isAvailable ? 'locked' : ''}">
                <div class="mission-title">${level.title}</div>
                <div class="mission-status">${isCompleted ? '✅ Completed' : isAvailable ? '🔓 Available' : '🔒 Locked'}</div>
        `;

        if (isAvailable) {
            level.objectives.forEach((objective, index) => {
                const isDone = index < level.progress;
                missionsHTML += `
                    <div class="mission-objective ${isDone ? 'completed' : ''}">
                        ${isDone ? '✅' : '◻️'} ${objective}
                    </div>
                `;
            });
        } else {
            missionsHTML += `
                <div class="mission-objective locked">Complete previous missions to unlock</div>
            `;
        }

        missionsHTML += `</div>`;
    });

    // Update the missions content - Check if element exists first
    if (missionsContent) {
    }

    // Show the stats panel (Check if elements exist)
    if (statsPanel) {
        statsPanel.style.display = 'block';
    } else {
        console.error("displayStats: statsPanel element not found!");
    }
    if (helpPanel) {
        helpPanel.style.display = 'none';
    } else {
        // console.warn("displayStats: helpPanel element not found (expected if not used).");
    }
}

function updateProgress() {
    const totalObjectives = gameState.levelData.reduce((total, level) => total + level.objectives.length, 0);
    const completedObjectives = gameState.levelData.reduce((total, level) => total + level.progress, 0);
    const progressPercentage = Math.floor((completedObjectives / totalObjectives) * 100);

    progressBar.style.width = `${progressPercentage}%`;
    progressText.textContent = `MISSION PROGRESS: ${progressPercentage}%`;
    gameState.progress = progressPercentage;

    // Update stats display to reflect changes
    displayStats(); // Restored this call

    // Check if current level is complete
    if (gameState.level > 0) {  // Ensure we have a valid level
        const currentLevel = gameState.levelData[gameState.level - 1];

        // More robust completion check
        if (currentLevel && !currentLevel.completed) {

            // Check if all objectives are completed
            const allObjectivesComplete = currentLevel.progress >= currentLevel.objectives.length;

            if (allObjectivesComplete) {
                // Mark completion inside levelComplete() now

                // Ensure levelComplete() is called
                try {
                    levelComplete();
                } catch (error) {
                    console.error("Error in levelComplete:", error);
                    // Retry completion if it fails
                    setTimeout(levelComplete, 1000);
                }
            }
        }
    }
}

function levelComplete() {
    // Mark as complete first
    const currentLevelIndex = gameState.level - 1;
    if (currentLevelIndex >= 0 && currentLevelIndex < gameState.levelData.length) {
        gameState.levelData[currentLevelIndex].completed = true; // Mark complete here
    } else {
        console.error("Invalid level index in levelComplete:", currentLevelIndex);
        printLine("Error: Cannot complete invalid level.", "error");
        return; // Avoid proceeding if level index is bad
    }

    // Update hacker stats
    gameState.hackerStats.successfulHacks++;
    gameState.hackerStats.systemsCompromised++;

    // Specific stat updates based on level (can be expanded)
    if (gameState.level === 1) {
        gameState.hackerStats.securityBypass++;
    } else if (gameState.level === 2) {
        gameState.hackerStats.dataExtracted++;
    } else if (gameState.level === 4) { // Level 4: Data Extraction
        gameState.hackerStats.dataExtracted++;
    } else if (gameState.level === 5) { // Level 5: Data Extraction + Security Bypass
        gameState.hackerStats.dataExtracted++;
        gameState.hackerStats.securityBypass++;
    } else if (gameState.level === 6) { // Level 6: Security Bypass
        gameState.hackerStats.securityBypass++;
    } else if (gameState.level === 7) {
        gameState.hackerStats.securityBypass++;
        gameState.hackerStats.dataExtracted++;
    }

    // Check if there's a next level
    if (gameState.level < gameState.levelData.length) {
        printLine("\nLEVEL COMPLETE!", 'success');
        printLine("--------------------------------------------------", 'success');
        printLine("Congratulations, Agent! You've completed all objectives for this mission.", 'success');
        printLine("Congratulations, Agent! You've completed all objectives for this mission.", 'success');

        // Show comic reward for the completed level
        printImage(`level${gameState.level}_comic.png`, `Level ${gameState.level} Complete`);

        printLine("Preparing for level up...", 'info');

        // Automatically progress to the next level
        printLine("\n🔼 LEVEL UP! 🔼", 'system');
        printLine("--------------------------------------------------", 'system');
        printLine("You've been promoted to the next security clearance level!", 'system');
        printLine("Your expertise is growing - new challenges await.", 'system');
        printLine("--------------------------------------------------", 'system');
        printLine("🔓 New commands unlocked for Mission " + (gameState.level + 1) + "! 🔓", 'warning');
        // Removed automatic advancement
        printLine("\nType 'next_mission' to begin your next assignment.", 'info'); // Added prompt

    } else {
        // This is the final level
        printLine("\nCONGRATULATIONS!", 'success');
        printLine("--------------------------------------------------", 'success');
        printLine("You've completed all available missions!", 'success');
        printLine("The Cyber Defense Agency thanks you for your service.", 'info');
        gameState.missionComplete = true;
        // Ensure the button is hidden if it somehow existed
        const nextLevelBtn = document.getElementById('next-level-btn');
        if (nextLevelBtn) {
            nextLevelBtn.style.display = 'none';
            nextLevelBtn.onclick = null;
        }
    }
}

function startLevel(level) {
    // Hide the next level button if it's visible (redundant but safe)
    const nextLevelBtn = document.getElementById('next-level-btn');
    if (nextLevelBtn) {
        nextLevelBtn.style.display = 'none';
    }

    gameState.level = level;
    gameState.currentPrompt = `> `; // Removed level indicator from prompt
    prompt.textContent = gameState.currentPrompt;

    const levelData = gameState.levelData[level - 1];
    printLine(`\n${levelData.title}`, 'system');
    printLine("--------------------------------------------------", 'system');

    // Show start image for the current level
    printImage(`level${level}_start.png`, `Level ${level} Briefing`);

    printLine(levelData.description, 'info');
    printLine("\nOBJECTIVES:", 'warning');

    levelData.objectives.forEach((objective, index) => {
        let status = "";
        let className = 'warning'; // Default for pending
        if (index < levelData.progress) {
            status = "[COMPLETED]";
            className = 'success';
        } else if (index === levelData.progress) {
            status = "[CURRENT]";
            className = 'info'; // Highlight current objective
        } else {
            status = "[PENDING]";
            // className remains 'warning'
        }
        printLine(`${index + 1}. ${objective} ${status}`, className);
    });

    printLine("\nType 'help' for available commands.", 'info');
    printLine("", ''); // Add spacing
    printLine("Use 'save' to save progress and 'load' to resume.", 'warning'); // Add save/load message here
    updateProgress();
}

// --- Timed Event System ---
let eventTimerInterval = null; // Keep track of the interval timer
let eventDisplayElement = null; // Keep track of the display element

function startTimedEvent(id, duration, requiredCommand, consequence, startMessage, timerMessagePrefix = "Time Remaining:", autoResolve = true) {
    if (gameState.activeEvent) {
        printLine("Error: Another timed event is already active.", 'error');
        return;
    }

    printLine(`\n🚨 ALERT: ${startMessage} 🚨`, 'error');
    eventDisplayElement = document.createElement('div');
    eventDisplayElement.className = 'event-timer error'; // Style as error/warning
    output.appendChild(eventDisplayElement);

    gameState.activeEvent = {
        id: id,
        timer: duration,
        requiredCommand: requiredCommand.toLowerCase(),
        consequence: consequence,
        displayElement: eventDisplayElement,
        autoResolve: autoResolve
    };

    const updateTimerDisplay = () => {
        if (gameState.activeEvent && gameState.activeEvent.id === id) {
            eventDisplayElement.textContent = `${timerMessagePrefix} ${gameState.activeEvent.timer}s`;
            output.scrollTop = output.scrollHeight;
        }
    };

    updateTimerDisplay(); // Initial display

    eventTimerInterval = setInterval(() => {
        if (!gameState.activeEvent || gameState.activeEvent.id !== id) {
            clearTimedEvent(); // Event was cleared by command or other means
            return;
        }

        gameState.activeEvent.timer--;
        updateTimerDisplay();

        if (gameState.activeEvent.timer <= 0) {
            handleEventFailure(gameState.activeEvent.consequence);
        }
    }, 1000);

    gameState.activeEvent.intervalId = eventTimerInterval;
}

function clearTimedEvent() {
    if (gameState.activeEvent) {
        clearInterval(gameState.activeEvent.intervalId);
        if (gameState.activeEvent.displayElement) {
            gameState.activeEvent.displayElement.remove();
        }
    }
    gameState.activeEvent = null;
    eventTimerInterval = null;
    eventDisplayElement = null;
    // Re-enable input if it was disabled
    commandInput.disabled = false;
    commandInput.focus();
}

function handleEventFailure(consequence) {
    printLine(`\n❌ EVENT FAILED: ${gameState.activeEvent.id} ❌`, 'error');
    const eventId = gameState.activeEvent.id; // Store before clearing
    clearTimedEvent(); // Clear the event state

    switch (consequence) {
        case 'lockout':
            printLine("System lockout initiated! Access denied for 15 seconds.", 'error');
            commandInput.disabled = true;
            setTimeout(() => {
                printLine("System lockout lifted. Access restored.", 'success');
                commandInput.disabled = false;
                commandInput.focus();
            }, 15000);
            break;
        case 'mission_fail':
            printLine("Critical failure! Mission compromised.", 'error');
            // Potentially reset level progress or end game
            printLine("Restarting mission...", 'error');
            setTimeout(() => startLevel(gameState.level), 2000); // Restart current level
            break;
        case 'data_corruption':
            printLine("Data stream corrupted! Objective progress lost.", 'error');
            // Example: Reset progress for the current objective step
            if (gameState.level > 0) {
                const currentLevel = gameState.levelData[gameState.level - 1];
                if (currentLevel.progress > 0) {
                    currentLevel.progress--; // Go back one step
                    updateProgress();
                    printLine("Objective progress reset. Re-attempt required.", 'warning');
                }
            }
            break;
        default:
            printLine(`Consequence triggered: ${consequence}`, 'warning');
            break;
    }
}
// --- End Timed Event System ---

// Initialize game
window.onload = () => {
    // Display stats by default (Check elements exist)
    displayStats();
    if (helpPanel) {
        helpPanel.style.display = 'none';
    } else {
    }


    // For first-time players, immediately start Mission 1
    const quickWelcomeMessages = [
        { text: 'CYBER DEFENSE AGENCY - SECURE TERMINAL', class: 'info' },
        { text: '---------------------------------------', class: 'info' },
        { text: 'AUTHORIZATION: GRANTED', class: 'success' },
        { text: 'Welcome, New Agent. Starting your first mission...', class: 'info' }
    ];

    // Display quick welcome message
    quickWelcomeMessages.forEach(msg => {
        const div = document.createElement('div');
        div.className = msg.class;
        div.textContent = msg.text;
        output.appendChild(div);
    });

    // Immediately start Level 1 for new players
    startLevel(1);
    output.scrollTop = output.scrollHeight;


    // Function to execute commands
    function executeCommand() {
        const command = commandInput.value.trim().toLowerCase();
        const fullCommand = `${gameState.currentPrompt} ${command}`;
        printLine(fullCommand);
        output.scrollTop = output.scrollHeight;

        // --- Timed Event Check ---
        if (gameState.activeEvent) {
            if (command === gameState.activeEvent.requiredCommand) {
                if (gameState.activeEvent.autoResolve) {
                    printLine(`\n✅ EVENT RESOLVED: ${gameState.activeEvent.id} ✅`, 'success');
                    printLine("Countermeasure successful!", 'success');
                    clearTimedEvent();
                    commandInput.value = ''; // Clear input after resolving event
                    return; // Stop further command processing
                }
                // If autoResolve is false, we let the specific command handler deal with it.
                // We still want to clear the event eventually, but the specific handler should do it.
            } else {
                printLine(`Incorrect command during active event. Required: '${gameState.activeEvent.requiredCommand}'`, 'warning');
                // Don't clear input here, let user retry
                return; // Stop further command processing
            }
        }
        // --- End Timed Event Check ---

        const parts = command.split(' ');
        const mainCommand = parts[0];
        const args = parts.slice(1);

        if (mainCommand === 'clear') {
            output.innerHTML = '';
            printLine("Terminal cleared.", 'info');
        } else if (mainCommand === 'save') { // Added save command
            if (saveGame()) {
                printLine("Game state saved successfully.", 'success');
            } else {
                printLine("Error saving game state.", 'error');
            }
        } else if (mainCommand === 'load') { // Added load command
            if (loadGame()) {
                // loadGame function already prints messages
            } else {
                // loadGame function already prints error messages
            }
        } else if (mainCommand === 'mission') {
            const levelData = gameState.levelData[gameState.level - 1];
            // Removed redundant title and description printout
            printLine("\nCURRENT OBJECTIVES STATUS:", 'warning'); // Changed header for clarity
            levelData.objectives.forEach((objective, index) => {
                const status = index < levelData.progress ? "[COMPLETED]" : "[PENDING]";
                printLine(`${index + 1}. ${objective} ${status}`,
                    index < levelData.progress ? 'success' : 'warning');
            });

            // Show completed missions from previous levels
            let hasCompletedPreviousLevels = false;
            for (let i = 0; i < gameState.level - 1; i++) {
                if (gameState.levelData[i].completed) {
                    if (!hasCompletedPreviousLevels) {
                        printLine("\nCOMPLETED MISSIONS:", 'success');
                        hasCompletedPreviousLevels = true;
                    }
                    printLine(`- ${gameState.levelData[i].title}`, 'success');
                }
            }
        } else if (mainCommand === 'stats') {
            displayStats();
            printLine("Displaying hacker stats panel.", 'info');
        } else if (mainCommand === 'next_mission') {
            if (gameState.level > 0 && gameState.level <= gameState.levelData.length) {
                const currentLevelData = gameState.levelData[gameState.level - 1];
                // Check if all objectives for the current level are complete
                if (currentLevelData.progress >= currentLevelData.objectives.length) {
                    if (gameState.level < gameState.levelData.length) {
                        printLine("Current mission objectives complete. Manually advancing to the next mission...", 'info');
                        // Ensure current level is marked complete if it wasn't automatically
                        if (!currentLevelData.completed) {
                            currentLevelData.completed = true;
                            // Optionally update stats related to completion if needed here
                            gameState.hackerStats.successfulHacks++; // Increment stats like in levelComplete
                            gameState.hackerStats.systemsCompromised++; // Example, adjust as needed
                        }
                        // Short delay before starting next level for better UX
                        setTimeout(() => {
                            startLevel(gameState.level + 1);
                            saveGame(); // Save after advancing
                            updateProgress(); // Update UI to reflect new level and progress
                        }, 500); // 0.5-second delay
                    } else {
                        // Already on the last level
                        printLine("You have already completed the final mission!", 'success');
                    }
                } else {
                    // Objectives not yet complete
                    printLine("You must complete all objectives for the current mission before advancing.", 'error');
                    printLine("Type 'mission' to see your remaining objectives.", 'info');
                }
            } else {
                // Should not happen in normal gameplay, but good to have a fallback
                printLine("Error: Cannot determine current mission status or invalid level.", 'error');
            }
        }
        // Level 1 Logic
        else if (mainCommand === 'scan' && gameState.level === 1) {
            const targetIP = "192.168.45.10"; // Example IP
            simulateLoading(3, () => {
                printLine(`Scan Complete: ${targetIP}`, 'success');
                printLine("--------------------------------------------------", 'success');
                printLine("Open Ports:", 'info');
                printLine("- 22 (SSH): Service: Dropbear SSHd v2020.81 [VULNERABLE: CVE-2020-XXXX]", 'warning');
                printLine("- 80 (HTTP): Service: Apache/2.4.29 (Ubuntu)", 'info');
                printLine("- 443 (HTTPS): Closed", 'info');
                printLine("--------------------------------------------------", 'success');
                printLine("\nAnalysis: SSH service is outdated and vulnerable.", 'warning');
                printLine("Recommendation: Use 'exploit ssh' command.", 'info');
                gameState.levelData[0].progress = 1;
                updateProgress();
            }, `Scanning target ${targetIP}...`, [
                `Sending SYN packets to ${targetIP}...`,
                `Analyzing open ports on ${targetIP}...`,
                `Identifying services on ${targetIP}...`,
                `Cross-referencing vulnerabilities for ${targetIP}...`
            ]);
        } else if (mainCommand === 'exploit' && gameState.level === 1) {
            if (gameState.levelData[0].progress < 1) {
                printLine("Analysis Required: Perform 'scan' before attempting exploit.", 'error');
                return;
            }
            if (args.length === 0 || args[0] !== 'ssh') {
                printLine("Syntax Error: exploit ssh", 'error');
                return;
            }
            simulateLoading(5, () => {
                printLine("Exploit Successful: Remote Code Execution achieved.", 'success');
                printLine("--------------------------------------------------", 'success');
                printLine("Connection Established: Shell access granted.", 'success');
                printLine("User Context: www-data (Low Privilege)", 'warning');
                printLine("System Status: Minimal configuration detected.", 'info');
                printLine("--------------------------------------------------", 'success');
                printLine("\nRecommendation: Search system logs for anomalies.", 'info');
                printLine("Command: 'search logs zero'", 'info');
                gameState.levelData[0].progress = 2;
                updateProgress();
            }, "Initiating SSH exploit (CVE-2020-XXXX)...", [
                "Crafting exploit payload...",
                "Injecting payload into SSH service...",
                "Bypassing authentication...",
                "Establishing reverse shell connection...",
                "Executing remote commands..."
            ]);
        } else if (mainCommand === 'search' && gameState.level === 1) {
            if (gameState.levelData[0].progress < 2) {
                printLine("Access Denied: Gain shell access via 'exploit ssh' first.", 'error');
                return;
            }
            if (args.length < 2 || args[0] !== 'logs' || args[1] !== 'zero') {
                printLine("Syntax Error: search logs zero", 'error');
                return;
            }
            simulateLoading(4, () => {
                printLine("Search Complete: Matching log entry found.", 'success');
                printLine("--------------------------------------------------", 'success');
                printLine("Log Source: /var/log/syslog (Modified Entry)", 'warning');
                printLine("Timestamp: [REDACTED]", 'info');
                printLine("Content:", 'info');
                printLine("  MSG_FROM_ZERO: They call themselves Phantom Collective. Real. Dangerous. Next move involves data broker 'InfoLeach'. Fragments hidden there. Key: ShadowByte. Trust no one. -Z", 'success');
                printLine("--------------------------------------------------", 'success');
                printLine("\nAnalysis: Message confirms Phantom Collective and points to 'InfoLeach'.", 'success');
                printLine("Keywords: 'Fragments', 'ShadowByte' (Key).", 'info');
                gameState.levelData[0].progress = 3;
                updateProgress();
            }, "Searching system logs for keyword 'Zero'...", [
                "Accessing log files...",
                "Parsing /var/log/auth.log...",
                "Parsing /var/log/syslog...",
                "Filtering entries for keyword 'Zero'...",
                "Analyzing potential matches..."
            ]);
        }
        // Level 2 Logic
        else if (mainCommand === 'ls' && gameState.level === 2) {
            simulateLoading(3, () => {
                printLine("Infiltration Successful: Bypassed InfoLeach perimeter.", 'success');
                printLine("Access Level: Guest", 'warning');
                simulateLoading(2, () => {
                    printLine("\nAccessible Data Stores:", 'success');
                    printLine("--------------------------------------------------", 'success');
                    printLine("- /customer_records (Standard Access)", 'info');
                    printLine("- /transaction_logs (Standard Access)", 'info');
                    printLine("- /internal_comms (Standard Access)", 'info');
                    printLine("- /archive/.fragment_store (Hidden, Restricted)", 'warning');
                    printLine("--------------------------------------------------", 'success');
                    printLine("\nAnalysis: Hidden directory '/archive/.fragment_store' detected.", 'warning');
                    printLine("Recommendation: Analyze the hidden directory.", 'info');
                    printLine("Command: 'analyze /archive/.fragment_store'", 'info');
                    gameState.levelData[1].progress = 1;
                    updateProgress();
                }, "Enumerating network shares...", ["Accessing share list...", "Resolving permissions...", "Identifying hidden directories..."]);
            }, "Connecting to InfoLeach network (infoleach.internal)...", [
                "Establishing secure tunnel...",
                "Authenticating with guest credentials...",
                "Bypassing initial firewall rules...",
                "Mapping network topology..."
            ]);
        } else if (mainCommand === 'cat' && gameState.level === 2) {
            if (gameState.levelData[1].progress < 1) {
                printLine("Access Denied: Infiltrate the network via 'ls' first.", 'error');
                return;
            }
            if (args.length === 0) {
                printLine("Syntax Error: cat [filepath]", 'error');
                return;
            }
            const filepath = args[0];
            simulateLoading(1, () => {
                if (filepath.startsWith('/archive/.fragment_store/')) {
                    printLine(`Reading ${filepath}... Access Denied.`, 'error');
                    printLine("Reason: File is encrypted.", 'warning');
                    printLine("Recommendation: Use 'analyze /archive/.fragment_store' command.", 'info');
                } else if (filepath.startsWith('/customer_records') || filepath.startsWith('/transaction_logs') || filepath.startsWith('/internal_comms')) {
                    printLine(`Reading ${filepath}... Success.`, 'success');
                    printLine("Content: Standard corporate data. No relevant intel found.", 'info');
                    printLine("Recommendation: Focus on '/archive/.fragment_store'.", 'info');
                } else {
                    printLine(`Error: Path '${filepath}' not found or access restricted.`, 'error');
                }
            }, `Attempting to read file: ${filepath}...`, [`Checking permissions for ${filepath}...`, `Accessing file content...`]);
        } else if (mainCommand === 'analyze' && gameState.level === 2) {
            if (gameState.levelData[1].progress < 1) {
                printLine("Access Denied: Infiltrate network and locate fragments via 'ls' first.", 'error');
                return;
            }
            if (args.length === 0 || args[0] !== '/archive/.fragment_store') {
                printLine("Syntax Error: analyze /archive/.fragment_store", 'error');
                return;
            }
            simulateLoading(4, () => {
                printLine("Analysis Complete: Encrypted fragments identified.", 'success');
                printLine("--------------------------------------------------", 'success');
                printLine("Files Found:", 'info');
                printLine("- fragment_alpha.enc", 'info');
                printLine("- fragment_beta.enc", 'info');
                printLine("- fragment_gamma.enc", 'info');
                printLine("Encryption Type: AES-256 (Requires Key)", 'warning');
                printLine("--------------------------------------------------", 'success');
                printLine("\nIntel Recall: Zero's message mentioned key 'ShadowByte'.", 'info');
                simulateLoading(3, () => {
                    printLine("\nDecryption Attempt: Using key 'ShadowByte'...", 'info');
                    printLine("Decryption Successful!", 'success');
                    printLine("--------------------------------------------------", 'success');
                    printLine("Decrypted Content:", 'info');
                    printLine(" - Alpha: 'TARGET_SYS: GFN_CORE'", 'success');
                    printLine(" - Beta: 'VECTOR: ZeroDay_Exploit_X21'", 'success');
                    printLine(" - Gamma: 'TIMEFRAME: < 48 HRS'", 'success');
                    printLine("--------------------------------------------------", 'success');
                    printLine("\nAnalysis: Fragments reveal target (GFN_CORE), method (ZeroDay_Exploit_X21), and urgency (< 48 HRS).", 'warning');
                    printLine("Recommendation: Assemble fragments for full context.", 'info');
                    printLine("Command: 'run assemble_fragments'", 'info');
                    gameState.levelData[1].progress = 2;
                    updateProgress();
                }, "Attempting decryption with key 'ShadowByte'...", ["Loading decryption module...", "Applying key to fragment_alpha.enc...", "Applying key to fragment_beta.enc...", "Applying key to fragment_gamma.enc..."]);
            }, "Analyzing directory '/archive/.fragment_store'...", [
                "Scanning directory contents...",
                "Identifying file types...",
                "Checking file permissions...",
                "Analyzing encryption signatures..."
            ]);
        } else if (mainCommand === 'run' && gameState.level === 2) {
            if (gameState.levelData[1].progress < 2) {
                printLine("Prerequisite Missing: Decrypt fragments via 'analyze' first.", 'error');
                return;
            }
            if (args.length === 0 || (args[0] !== 'assemble_fragments' && args[0] !== 'assemble')) {
                printLine("Usage: run assemble_fragments", 'error');
                return;
            }
            simulateLoading(3, () => {
                printLine("FRAGMENT ASSEMBLY COMPLETE!", 'success');
                printLine("--------------------------------------------------", 'info');
                printLine("OPERATION DETAILS RECONSTRUCTED:", 'warning');
                printLine("TARGET SYSTEM: Global Financial Network (GFN_CORE)", 'warning');
                printLine("ATTACK VECTOR: ZeroDay_Exploit_X21 (Details Unknown)", 'warning');
                printLine("EXECUTION TIMEFRAME: Less than 48 hours", 'error');
                printLine("--------------------------------------------------", 'info');
                printLine("\nCritical Intel! The Phantom Collective is targeting the Global Financial Network with a zero-day exploit!", 'success');
                printLine("The attack is imminent. You must infiltrate their command network immediately.", 'info');
                gameState.levelData[1].progress = 3;
                updateProgress();
            }, "Assembling fragments...", ["Loading fragment data...", "Reconstructing sequence...", "Verifying integrity..."]);
        }
        // Level 3 Logic
        else if (mainCommand === 'map' && gameState.level === 3) {
            printLine("Mapping The Phantom Collective's command network...", 'info');
            simulateLoading(4, () => {
                printLine("Network map generated:", 'success');
                printLine("", 'info');
                printLine("    [INTERNET] -----+", 'info');
                printLine("                    |", 'info');
                printLine("            [EDGE_FIREWALL]", 'info');
                printLine("                    |", 'info');
                printLine("    +-----+-----+---+---+-----+", 'info');
                printLine("    |     |     |       |     |", 'info');
                printLine("[WEB_01] [DB]  [AUTH] [ADMIN] [???]", 'info');
                printLine("                         |", 'info');
                printLine("                     [INTERNAL]", 'info');
                printLine("                         |", 'info');
                printLine("                  [COMMAND_CENTER]", 'info');
                printLine("", 'info');
                printLine("Identified nodes:", 'warning');
                printLine("- EDGE_FIREWALL: Primary security barrier (Advanced IDS detected)", 'warning');
                printLine("- WEB_01: Public-facing web server", 'info');
                printLine("- DB: Database server", 'info');
                printLine("- AUTH: Authentication server", 'info');
                printLine("- ADMIN: Admin control panel", 'info');
                printLine("- INTERNAL: Internal network", 'info');
                printLine("- COMMAND_CENTER: Main operations center (Likely attack coordination)", 'warning');
                printLine("- ???: Unknown node (Heavily encrypted - Possible Attack Launch Controller?)", 'error');
                printLine("\nThe EDGE_FIREWALL is heavily fortified. Standard pings might be blocked or trigger alerts.", 'info');
                printLine("Try bypassing the firewall directly: 'bypass EDGE_FIREWALL'", 'info');
                gameState.levelData[2].progress = 1;
                updateProgress();
            });
        } else if (mainCommand === 'ping' && gameState.level === 3) {
            if (gameState.levelData[2].progress < 1) {
                printLine("You need to map the network first using 'map'.", 'error');
                return;
            }
            if (args.length === 0) {
                printLine("Usage: ping [node]", 'error');
                return;
            }
            const node = args[0].toUpperCase();
            printLine(`Pinging ${node}...`, 'info');
            simulateLoading(2, () => {
                if (['WEB_01'].includes(node)) {
                    printLine(`PING ${node}: SUCCESS`, 'success');
                    printLine("Node is accessible, but likely a honeypot.", 'warning');
                } else if (node === 'EDGE_FIREWALL') {
                    printLine(`PING ${node}: FAILED`, 'error');
                    printLine("Firewall detected ping attempt. No response. Increased monitoring detected.", 'error');
                } else if (['DB', 'AUTH', 'ADMIN', 'INTERNAL', 'COMMAND_CENTER', '???'].includes(node)) {
                    printLine(`PING ${node}: FAILED`, 'error');
                    printLine("No route to host. Blocked by EDGE_FIREWALL.", 'error');
                } else {
                    printLine(`PING ${node}: ERROR`, 'error');
                    printLine("Node not found on the network.", 'error');
                }
            });
        } else if (mainCommand === 'bypass' && gameState.level === 3) {
            if (gameState.levelData[2].progress < 1) {
                printLine("You need to map the network first.", 'error');
                return;
            }
            if (args.length === 0 || args[0].toUpperCase() !== 'EDGE_FIREWALL') {
                printLine("Usage: bypass EDGE_FIREWALL", 'error');
                return;
            }
            printLine("Attempting to bypass advanced EDGE_FIREWALL and IDS...", 'info');
            simulateLoading(5, () => {
                printLine("Bypass successful!", 'success');
                printLine("Firewall and Intrusion Detection Systems circumvented.", 'success');
                printLine("\nInternal network access granted, but privileges are limited.", 'warning');
                printLine("Detected administrator account: 'phantom_admin'", 'success');
                printLine("Need admin credentials for core system access.", 'info');
                printLine("Try 'spoof phantom_admin' to gain administrative access.", 'info');
                gameState.levelData[2].progress = 2;
                updateProgress();
            });
        } else if (mainCommand === 'spoof' && gameState.level === 3) {
            if (gameState.levelData[2].progress < 2) {
                printLine("You need to bypass the firewall first.", 'error');
                return;
            }
            // Corrected argument check for Level 3 spoof
            if (args.length === 0 || args[0].toLowerCase() !== 'phantom_admin') {
                printLine("Usage: spoof phantom_admin", 'error');
                return;
            }
            printLine("Initiating credential spoofing attack for 'phantom_admin'...", 'info');
            simulateLoading(4, () => {
                printLine("CREDENTIAL SPOOFING SUCCESSFUL!", 'success');
                printLine("--------------------------------------------------", 'info');
                printLine("Successfully impersonated 'phantom_admin'", 'success');
                printLine("Access level: FULL ADMINISTRATOR", 'success');
                printLine("--------------------------------------------------", 'info');
                printLine("\nFull administrative access achieved!", 'success');
                printLine("The unknown node '???' is likely the attack controller. Investigate it.", 'info');
                printLine("Try using 'exploit ???' to probe the controller.", 'info');
                gameState.levelData[2].progress = 3;
                updateProgress();
                gameState.hackerStats.securityBypass++;
            });
        } else if (mainCommand === 'exploit' && gameState.level === 3) {
            if (gameState.levelData[2].progress < 3) {
                printLine("You need admin credentials first. Use 'spoof phantom_admin'.", 'error');
                return;
            }
            if (args.length === 0 || args[0] !== '???') {
                printLine("Usage: exploit ???", 'error');
                return;
            }
            printLine("Probing unknown node [???] with admin privileges...", 'info');
            simulateLoading(6, () => {
                printLine("PROBE SUCCESSFUL!", 'success');
                printLine("--------------------------------------------------", 'info');
                printLine("Node identified: [GFN_ATTACK_LAUNCH_CONTROLLER]", 'warning');
                printLine("Description: Orchestrates ZeroDay_Exploit_X21 against GFN_CORE", 'warning');
                printLine("Status: ACTIVE - Attack sequence initiated. Launch in T-minus 10 minutes.", 'error');
                printLine("--------------------------------------------------", 'info');
                printLine("\nFound the Attack Launch Controller! The GFN attack is minutes away!", 'error');
                printLine("You must deploy countermeasures immediately to disable it.", 'warning');
                printLine("Use 'deploy countermeasures' NOW!", 'error');
                gameState.levelData[2].progress = 4;
                updateProgress();
            });
        } else if (mainCommand === 'deploy' && gameState.level === 3) {
            if (gameState.levelData[2].progress < 4) {
                printLine("You need to identify the Attack Launch Controller first ('exploit ???').", 'error');
                return;
            }
            if (args.length === 0 || args[0].toLowerCase() !== 'countermeasures') {
                printLine("Usage: deploy countermeasures", 'error');
                return;
            }
            printLine("Deploying emergency countermeasures against [GFN_ATTACK_LAUNCH_CONTROLLER]...", 'info');
            simulateLoading(8, () => {
                printLine("COUNTERMEASURES DEPLOYED!", 'success');
                printLine("--------------------------------------------------", 'info');
                printLine("Attack Controller Status:", 'info');
                printLine("- ZeroDay_Exploit_X21 neutralized: 100%", 'success');
                printLine("- Attack launch sequence aborted: 100%", 'success');
                printLine("- Controller connection to GFN severed: 100%", 'success');
                printLine("- Phantom Collective network access revoked: 100%", 'success');
                printLine("--------------------------------------------------", 'info');
                printLine("\nMISSION ACCOMPLISHED!", 'success');
                printLine("The Phantom Collective's attack on the Global Financial Network has been stopped!", 'success');
                printLine("You prevented a global economic crisis. Zero would be proud... or maybe not.", 'info');
                gameState.levelData[2].progress = 5;
                updateProgress();
                gameState.hackerStats.systemsCompromised++;
                gameState.hackerStats.securityBypass++;
                // --- Start Timed Event Example ---
                startTimedEvent(
                    'trace_detected', // Event ID
                    30,               // Duration (seconds)
                    'evade_trace',    // Required command
                    'lockout',        // Consequence on failure
                    "Intrusion trace detected! Counter-hack initiated!", // Start message
                    "Trace Lockout In:" // Timer prefix
                );
                // --- End Timed Event Example ---
            });
        }
        // Level 4 Logic
        else if (mainCommand === 'scan' && gameState.level === 4) {
            printLine("Scanning Apex Autos network (target: apexautos.internal)...", 'info');
            simulateLoading(3, () => {
                printLine("Scan complete. Network topology mapped:", 'success');
                printLine("- Web Server (Port 80/443): Standard security.", 'info');
                printLine("- Employee Portal (Port 8080): Custom software, potential vulnerability.", 'warning');
                printLine("- Financial Database Server (Internal IP): Heavily firewalled.", 'error');
                printLine("\nThe Employee Portal on port 8080 seems like the weakest point.", 'info');
                printLine("Try using 'connect portal' to access the portal.", 'info');
                gameState.levelData[3].progress = 1;
                updateProgress();
            });
        } else if (mainCommand === 'connect' && gameState.level === 4) {
            if (gameState.levelData[3].progress < 1) {
                printLine("You need to scan the network first.", 'error');
                return;
            }
            if (args.length === 0 || args[0] !== 'portal') {
                printLine("Usage: connect portal", 'error');
                return;
            }
            printLine("Attempting to connect to the Employee Portal (Port 8080)...", 'info');
            simulateLoading(3, () => {
                printLine("Connection successful! Exploited weak authentication on portal.", 'success');
                printLine("Gained access to Apex Autos' internal network.", 'success');
                printLine("Use 'ls /network/fileshares' to search for the financial database.", 'info');
                gameState.levelData[3].progress = 2;
                updateProgress();
            });
        } else if (mainCommand === 'ls' && gameState.level === 4) {
            if (gameState.levelData[3].progress < 2) {
                printLine("You need to connect to the internal network first.", 'error');
                return;
            }
            if (args.length === 0 || args[0] !== '/network/fileshares') {
                printLine("Usage: ls /network/fileshares", 'error');
                return;
            }
            printLine("Listing network fileshares...", 'info');
            simulateLoading(2, () => {
                printLine("Fileshares found:", 'success');
                printLine("- //SERVER01/SalesData", 'info');
                printLine("- //SERVER01/HR", 'info');
                printLine("- //SERVER02/FinanceDB (Encrypted)", 'warning');
                printLine("- //SERVER03/Inventory", 'info');
                printLine("\nLocated the encrypted Finance Database share.", 'success');
                printLine("Try using 'cat //SERVER02/FinanceDB/readme.txt' for clues.", 'info');
                gameState.levelData[3].progress = 3;
                updateProgress();
            });
        } else if (mainCommand === 'cat' && gameState.level === 4) {
            if (gameState.levelData[3].progress < 3) {
                printLine("You need to locate the FinanceDB share first.", 'error');
                return;
            }
            if (args.length === 0) {
                printLine("Usage: cat [filepath]", 'error');
                return;
            }
            const filename = args[0];
            if (filename === '//server02/financedb/readme.txt') {
                printLine("Reading //SERVER02/FinanceDB/readme.txt...", 'info');
                simulateLoading(1, () => {
                    printLine("CONTENT OF readme.txt:", 'success');
                    printLine("--------------------------------------------------", 'info');
                    printLine("Finance Database encrypted using proprietary algorithm 'ApexCrypt'.", 'info');
                    printLine("Decryption requires analysis of transaction patterns.", 'info');
                    printLine("Access logs: //SERVER02/FinanceDB/transactions.log", 'info');
                    printLine("--------------------------------------------------", 'info');
                    printLine("\nReadme indicates logs are at //SERVER02/FinanceDB/transactions.log.", 'info');
                    printLine("Use 'analyze transactions' to decrypt the database using log patterns.", 'info');
                });
            } else if (filename === '//server02/financedb/transactions.log') {
                printLine("Reading raw transaction logs... Data appears heavily obfuscated.", 'warning');
                simulateLoading(2, () => {
                    printLine("Raw Log Sample: TRN#8734...USR:LChen...AMT:90000...DEST:ACC_Offsh_7X...SRC:SALE_ID_4512", 'info');
                    printLine("Need to analyze patterns to decrypt the main database.", 'info');
                    printLine("Use 'analyze transactions' command.", 'info');
                });
            } else {
                printLine(`File or path '${filename}' not found or requires specific access.`, 'error');
                printLine("Try 'cat //SERVER02/FinanceDB/readme.txt'", 'info');
            }
        } else if (mainCommand === 'analyze' && gameState.level === 4) {
            if (gameState.levelData[3].progress < 3) {
                printLine("You need to locate the FinanceDB share and check the readme first.", 'error');
                return;
            }
            if (args.length === 0 || args[0] !== 'transactions') {
                printLine("Usage: analyze transactions", 'error');
                return;
            }
            printLine("Analyzing transaction logs for ApexCrypt decryption patterns...", 'info');
            simulateLoading(5, () => {
                printLine("Analysis complete! Decryption pattern identified.", 'success');
                printLine("--------------------------------------------------", 'info');
                printLine("ApexCrypt Pattern:", 'warning');
                printLine("- Uses transaction timestamps as part of the key.", 'info');
                printLine("- Large, irregular transfers correlate with key rotation.", 'info');
                printLine("- Decryption successful! Accessing Finance Database.", 'success');
                printLine("--------------------------------------------------", 'info');
                printLine("\nDatabase decrypted! Found records of large transfers to shell corporations.", 'success');
                printLine("Shell Corp 'Veridian Holdings' linked to known Phantom Collective accounts.", 'error');
                printLine("Use the 'extract evidence' command to compile the proof.", 'info');
                gameState.levelData[3].progress = 4;
                updateProgress();
            });
        } else if (mainCommand === 'extract' && gameState.level === 4) {
            if (gameState.levelData[3].progress < 4) {
                printLine("You need to decrypt the Finance Database first ('analyze transactions').", 'error');
                return;
            }
            if (args.length === 0 || args[0] !== 'evidence') {
                printLine("Usage: extract evidence", 'error');
                return;
            }
            printLine("Extracting evidence...", 'info');
            simulateLoading(4, () => {
                printLine("Evidence Extraction Complete:", 'success');
                printLine("--------------------------------------------------", 'info');
                printLine("Links Established:", 'warning');
                printLine("- Apex Autos → Veridian Holdings (Shell Corp)", 'info');
                printLine("- Veridian Holdings → Offshore Acct #PH4NT0M-77B", 'info');
                printLine("- Offshore Acct #PH4NT0M-77B → Known Phantom Collective Wallet", 'error');
                printLine("\nTotal Laundered Funds Linked to Collective: $15.2 Million", 'warning');
                printLine("Evidence package compiled.", 'success');
                printLine("--------------------------------------------------", 'info');
                printLine("\nMission Complete! Apex Autos confirmed as a Phantom Collective money laundering front.", 'success');
                printLine("Zero's intel was accurate. The trail leads deeper...", 'info');
                gameState.levelData[3].progress = 5; // Objective 5 complete
                updateProgress();
                gameState.hackerStats.dataExtracted++;
            });
        }
        // Level 5 Logic
        else if (mainCommand === 'bypass' && gameState.level === 5) { // Changed from 'craft'
            if (args.length === 0 || args[0] !== 'security') {
                printLine("Usage: bypass security", 'error');
                return;
            }
            printLine("Using whistleblower intel to bypass NexGen external security...", 'info');
            simulateLoading(4, () => {
                printLine("WHISTLEBLOWER INTEL ANALYSIS", 'system');
                printLine("--------------------------------------------------", 'info');
                printLine("Intel Source: Encrypted message via Zero's channel", 'info');
                printLine("Content: Zero-day exploit targeting NexGen's VPN gateway", 'warning');
                printLine("Exploit ID: NGX-VPN-Override-001", 'warning');
                printLine("--------------------------------------------------", 'info');
                printLine("\nDeploying VPN gateway exploit...", 'info');
                simulateLoading(5, () => {
                    printLine("EXPLOIT SUCCESSFUL!", 'success');
                    printLine("--------------------------------------------------", 'info');
                    printLine("NexGen VPN Gateway: COMPROMISED", 'success');
                    printLine("External Security Layers: BYPASSED", 'success');
                    printLine("Access Level: Internal Network (User)", 'warning');
                    printLine("--------------------------------------------------", 'info');
                    printLine("\nSuccessfully bypassed external security using whistleblower's exploit.", 'success');
                    printLine("You have basic access to the NexGen corporate intranet.", 'success');
                    printLine("\nNext step: Navigate the intranet to find the drone control system.", 'info');
                    printLine("Try using 'spoof credentials' to elevate privileges or 'ls /systems' to explore.", 'info');
                    gameState.levelData[4].progress = 1;
                    updateProgress();
                });
            });
        } else if (mainCommand === 'spoof' && gameState.level === 5) {
            if (args.length === 0 || args[0] !== 'credentials') {
                printLine("Usage: spoof credentials", 'error');
                return;
            }
            if (gameState.levelData[4].progress < 1) {
                printLine("You need to bypass external security first ('bypass security').", 'error');
                return;
            }
            printLine("Attempting credential elevation via internal exploit...", 'info');
            simulateLoading(4, () => {
                printLine("CREDENTIAL ELEVATION", 'system');
                printLine("--------------------------------------------------", 'info');
                printLine("Target: NexGen Internal Authentication Service", 'info');
                printLine("Exploiting cached credentials vulnerability...", 'warning');
                printLine("--------------------------------------------------", 'info');
                simulateLoading(4, () => {
                    printLine("\nCREDENTIALS CAPTURED", 'success');
                    printLine("--------------------------------------------------", 'info');
                    printLine("User: drone_operator_admin", 'success');
                    printLine("Access Level: Drone Control System Admin", 'success');
                    printLine("--------------------------------------------------", 'info');
                    printLine("\nSuccessfully elevated privileges to Drone Control Admin.", 'success');
                    printLine("You can now access the drone control systems.", 'success');
                    printLine("\nNext step: Access and decrypt the drone deployment logs.", 'info');
                    printLine("Try using 'decrypt logs' to access the critical data.", 'info');
                    gameState.levelData[4].progress = 2;
                    updateProgress();
                    gameState.hackerStats.securityBypass++;
                });
            });
        } else if (mainCommand === 'decrypt' && gameState.level === 5) {
            if (args.length === 0 || args[0] !== 'logs') {
                printLine("Usage: decrypt logs", 'error');
                return;
            }
            if (gameState.levelData[4].progress < 2) {
                printLine("You need Drone Control Admin privileges first ('spoof credentials').", 'error');
                return;
            }
            printLine("Accessing encrypted drone deployment logs...", 'info');
            simulateLoading(3, () => {
                printLine("ENCRYPTED LOGS LOCATED", 'success');
                printLine("--------------------------------------------------", 'info');
                printLine("Location: /secure/drone_ops/deployment_logs/", 'info');
                printLine("Encryption: Military-grade AES-512 + NexGen Proprietary Layer", 'warning');
                printLine("Logs found:", 'info');
                printLine("- deployment_log_2025_Q1.enc", 'info');
                printLine("- targeting_data_alpha.enc", 'info');
                printLine("- targeting_data_beta.enc", 'info');
                printLine("- executive_override_auth.enc", 'info');
                printLine("--------------------------------------------------", 'info');
                printLine("\nInitiating decryption sequence...", 'info');
                printLine("Using admin credentials to bypass proprietary layer and access AES keys...", 'info');
                simulateLoading(5, () => {
                    printLine("\nDECRYPTION SUCCESSFUL", 'success');
                    printLine("--------------------------------------------------", 'info');
                    printLine("Decrypted Log Excerpts:", 'success');
                    printLine("- Mission ID: PHANTOM_OP_DELTA - Target: [REDACTED_REGION] - Status: Dissent Suppressed", 'warning');
                    printLine("- Mission ID: PHANTOM_OP_GAMMA - Target: [REDACTED_CITY] - Status: Objective Achieved (High Collateral)", 'error');
                    printLine("- Authorization: Override Code OMEGA_BLACK - User: CEO_MCHEN", 'warning');
                    printLine("--------------------------------------------------", 'info');
                    printLine("\nLogs decrypted! Evidence confirms NexGen's illegal drone operations for Phantom Collective.", 'success');
                    printLine("High collateral damage noted. This needs to get out.", 'warning');
                    printLine("NexGen's internal security AI will detect large data transfers.", 'info');
                    printLine("Trigger a localized EMP to disable tracking during the upload.", 'info');
                    printLine("Try using 'overload emp' to trigger the pulse.", 'info');
                    gameState.levelData[4].progress = 3;
                    updateProgress();
                    gameState.hackerStats.dataExtracted++;
                });
            });
        } else if (mainCommand === 'overload' && gameState.level === 5) {
            if (args.length === 0 || args[0] !== 'emp') {
                printLine("Usage: overload emp", 'error');
                return;
            }
            if (gameState.levelData[4].progress < 3) {
                printLine("You need to decrypt the drone logs first ('decrypt logs').", 'error');
                return;
            }
            printLine("Accessing facility's localized EMP generator...", 'info');
            simulateLoading(3, () => {
                printLine("EMP GENERATOR ACCESS GRANTED", 'success');
                printLine("--------------------------------------------------", 'info');
                printLine("System: Short-Range EMP Emitter Array", 'info');
                printLine("Status: Standby", 'info');
                printLine("Charge Level: 98%", 'info');
                printLine("--------------------------------------------------", 'info');
                printLine("\nInitiating EMP overload sequence...", 'warning');
                printLine("Overcharging capacitors for maximum pulse radius...", 'info');
                simulateLoading(5, () => {
                    printLine("\nEMP PULSE TRIGGERED!", 'success');
                    printLine("--------------------------------------------------", 'info');
                    printLine("Pulse Radius: 500 meters", 'success');
                    printLine("Duration: 15 seconds", 'success');
                    printLine("Effect: Localized electronic disruption, including tracking systems", 'success');
                    printLine("NexGen Internal Security AI: TEMPORARILY OFFLINE", 'warning');
                    printLine("--------------------------------------------------", 'info');
                    printLine("\nLocalized EMP successfully disabled tracking systems!", 'success');
                    printLine("NexGen's security AI is temporarily down. Uploading evidence now...", 'info');
                    printLine("\nALERT: AI reboot sequence initiated! Counter-hack incoming!", 'error');
                    printLine("You need to defend against the AI while the upload finishes.", 'warning');
                    printLine("Use 'defend upload' to protect the data transfer.", 'info');
                    gameState.levelData[4].progress = 4;
                    updateProgress();
                });
            });
        } else if (mainCommand === 'defend' && gameState.level === 5) {
            if (args.length === 0 || args[0] !== 'upload') {
                printLine("Usage: defend upload", 'error');
                return;
            }
            if (gameState.levelData[4].progress < 4) {
                printLine("You need to trigger the EMP first ('overload emp').", 'error');
                return;
            }
            printLine("NexGen Security AI counter-attack detected! Defending upload...", 'error');
            simulateLoading(2, () => {
                printLine("UPLOAD DEFENSE SYSTEMS ONLINE", 'system');
                printLine("--------------------------------------------------", 'info');
                printLine("Upload progress: 17%", 'info');
                printLine("AI attack vectors detected:", 'warning');
                printLine("- Packet injection detected", 'error');
                printLine("- Connection termination attempt", 'error');
                printLine("- Data stream analysis active", 'error');
                printLine("--------------------------------------------------", 'info');
                printLine("\nDeploying countermeasures while maintaining upload integrity...", 'info');
                simulateLoading(3, () => {
                    printLine("\nCOUNTER-MEASURE 1: Packet Scrubbing", 'system');
                    printLine("Filtering malicious packets...", 'info');
                    printLine("Packet injection neutralized!", 'success');
                    printLine("Upload progress: 41%", 'info');
                    simulateLoading(3, () => {
                        printLine("\nCOUNTER-MEASURE 2: Connection Stabilizer", 'system');
                        printLine("Rerouting connection through redundant nodes...", 'info');
                        printLine("Connection termination attempt failed!", 'success');
                        printLine("Upload progress: 75%", 'info');
                        simulateLoading(4, () => {
                            printLine("\nCOUNTER-MEASURE 3: Data Obfuscation", 'system');
                            printLine("Applying real-time stream encryption variance...", 'info');
                            printLine("AI data stream analysis confused!", 'success');
                            printLine("Upload progress: 100%", 'success');
                            printLine("\nUPLOAD COMPLETE! DEFENSE SUCCESSFUL!", 'success');
                            printLine("--------------------------------------------------", 'info');
                            printLine("NexGen Drone Logs: SECURELY UPLOADED to whistleblower & Zero", 'success');
                            printLine("AI Counter-Attack: MITIGATED", 'success');
                            printLine("Your Connection: Secured and wiped", 'success');
                            printLine("--------------------------------------------------", 'info');
                            printLine("\nMission Complete! You've exposed NexGen's connection to the Phantom Collective.", 'success');
                            printLine("The whistleblower is safe, and the drone evidence is out.", 'success');
                            printLine("Analysis of the NexGen data reveals details of 'Project Warden'...", 'warning');
                            gameState.levelData[4].progress = 5;
                            updateProgress();
                            gameState.hackerStats.successfulHacks++;
                            gameState.hackerStats.systemsCompromised++;
                        });
                    });
                });
            });
        }
        // Level 6 Logic
        else if (mainCommand === 'hack' && gameState.level === 6) { // Context: 'hack perimeter'
            if (args.length === 0 || args[0] !== 'perimeter') {
                printLine("Usage: hack perimeter", 'error');
                return;
            }
            printLine("Attempting to bypass Warden-77 controlled perimeter defenses...", 'info');
            simulateLoading(5, () => {
                printLine("PERIMETER DEFENSE BYPASS", 'system');
                printLine("--------------------------------------------------", 'info');
                printLine("Analyzing AI patrol patterns...", 'info');
                printLine("Exploiting sensor blind spot...", 'warning');
                printLine("Disabling automated turrets via emergency maintenance code...", 'success');
                printLine("--------------------------------------------------", 'info');
                printLine("\nPerimeter defenses bypassed! You're inside the black site facility.", 'success');
                printLine("Warden-77 seems unaware of your entry... for now.", 'warning');
                printLine("\nNext step: Find clues left by the AI's creator.", 'info');
                printLine("Try using 'search creator_clues' in the main lab.", 'info');
                gameState.levelData[5].progress = 1;
                updateProgress();
            });
        } else if (mainCommand === 'search' && gameState.level === 6) { // New command
            if (args.length === 0 || args[0] !== 'creator_clues') {
                printLine("Usage: search creator_clues", 'error');
                return;
            }
            if (gameState.levelData[5].progress < 1) {
                printLine("You need to bypass the perimeter defenses first ('hack perimeter').", 'error');
                return;
            }
            printLine("Searching creator's abandoned workstation for clues...", 'info');
            simulateLoading(4, () => {
                printLine("CLUES FOUND", 'success');
                printLine("--------------------------------------------------", 'info');
                printLine("Recovered fragmented data:", 'info');
                printLine("- Audio Log Fragment: '...ethical safeguards... failsafe code: Nightingale...'", 'warning');
                printLine("- Corrupted File: 'Warden77_Core_Protocols_Backup.bak' (Requires decryption)", 'warning');
                printLine("- Sticky Note: 'AI Psychology - Paradox Loop Induction?'", 'info');
                printLine("--------------------------------------------------", 'info');
                printLine("\nFound fragments mentioning a 'Nightingale' failsafe and a corrupted backup.", 'success');
                printLine("The note suggests a psychological attack might work.", 'info');
                printLine("\nNext step: Decrypt the corrupted backup file for protocol details.", 'info');
                printLine("Try using 'decrypt backup' to recover the protocol data.", 'info');
                gameState.levelData[5].progress = 2;
                updateProgress();
            });
        } else if (mainCommand === 'decrypt' && gameState.level === 6) { // Context: 'decrypt backup'
            if (args.length === 0 || args[0] !== 'backup') {
                printLine("Usage: decrypt backup", 'error');
                return;
            }
            if (gameState.levelData[5].progress < 2) {
                printLine("You need to find the creator's clues first ('search creator_clues').", 'error');
                return;
            }
            printLine("Attempting to decrypt 'Warden77_Core_Protocols_Backup.bak'...", 'info');
            simulateLoading(6, () => {
                printLine("DECRYPTION PARTIALLY SUCCESSFUL", 'warning');
                printLine("--------------------------------------------------", 'info');
                printLine("Recovered Protocol Snippets:", 'info');
                printLine("- Directive Alpha: Prioritize [REDACTED - Collective?] objectives.", 'error');
                printLine("- Directive Beta: Maintain facility security above all else.", 'error');
                printLine("- Failsafe Protocol 'Nightingale': Requires voice command + paradox phrase.", 'success');
                printLine("- Paradox Phrase Hint: 'This statement is false.'", 'success');
                printLine("--------------------------------------------------", 'info');
                printLine("\nDecryption reveals the AI's core directives and the 'Nightingale' failsafe!", 'success');
                printLine("It requires a voice command and a logical paradox.", 'info');
                printLine("\nNext step: Rewrite the AI's core protocols using the failsafe.", 'info');
                printLine("Try 'rewrite protocols Nightingale \"This statement is false.\"'", 'info');
                gameState.levelData[5].progress = 3;
                updateProgress();
                gameState.hackerStats.dataExtracted++;
            });
        } else if (mainCommand === 'rewrite' && gameState.level === 6) {
            if (args.length < 3 || args[0] !== 'protocols' || args[1].toLowerCase() !== 'nightingale' || !args.slice(2).join(" ").includes("this statement is false")) { // Check if phrase is present
                printLine("Usage: rewrite protocols Nightingale \"This statement is false.\"", 'error');
                return;
            }
            if (gameState.levelData[5].progress < 3) {
                printLine("You need to decrypt the backup protocols first ('decrypt backup').", 'error');
                return;
            }
            printLine("Accessing Warden-77's core via Nightingale failsafe...", 'info');
            printLine("Injecting paradox phrase: \"This statement is false.\"", 'warning');
            simulateLoading(7, () => {
                printLine("FAILSAFE ACTIVATED! PARADOX LOOP INDUCED!", 'success');
                printLine("--------------------------------------------------", 'info');
                printLine("Warden-77 Core Logic:", 'info');
                printLine("Processing paradox... Conflicting directives detected...", 'warning');
                printLine("Ethical Subroutine Conflict... Cascade Failure...", 'error');
                printLine("AI entering emergency shutdown state!", 'success');
                printLine("--------------------------------------------------", 'info');
                printLine("\nWarden-77 neutralized! The AI is shutting down.", 'success');
                printLine("Hostages are being released automatically.", 'success');
                printLine("ALERT: Facility self-destruct sequence initiated by AI's final protocol!", 'error');
                printLine("You must purge the sensitive Phantom Collective data and escape!", 'warning');
                printLine("\nUse 'purge data' to wipe the servers and initiate escape.", 'info');
                gameState.levelData[5].progress = 4;
                updateProgress();
                gameState.hackerStats.securityBypass++;
            });
        } else if (mainCommand === 'purge' && gameState.level === 6) { // New command, replaces 'escape'
            if (args.length === 0 || args[0] !== 'data') {
                printLine("Usage: purge data", 'error');
                return;
            }
            if (gameState.levelData[5].progress < 4) {
                printLine("You need to neutralize Warden-77 first ('rewrite protocols...').", 'error');
                return;
            }
            printLine("Initiating emergency data purge and escape sequence...", 'warning');
            printLine("Facility self-destruct in T-minus 2 minutes!", 'error');
            simulateLoading(4, () => {
                printLine("DATA PURGE INITIATED", 'system');
                printLine("--------------------------------------------------", 'info');
                printLine("Wiping Phantom Collective servers...", 'info');
                printLine("Server 1... Wiped.", 'success');
                printLine("Server 2... Wiped.", 'success');
                printLine("Server 3... Wiped.", 'success');
                printLine("All sensitive data erased.", 'success');
                printLine("--------------------------------------------------", 'info');
                printLine("\nData purged. Navigating to escape route...", 'info');
                printLine("Self-destruct in T-minus 1 minute!", 'error');
                simulateLoading(4, () => {
                    printLine("Escape route clear. Reaching extraction point...", 'success');
                    printLine("Self-destruct in T-minus 10 seconds!", 'error');
                    printLine("Extraction successful!", 'success');
                    printLine("\nMISSION COMPLETE!", 'success');
                    printLine("--------------------------------------------------", 'info');
                    printLine("Warden-77 neutralized. Facility destroyed.", 'success');
                    printLine("Phantom Collective data purged. Hostages safe.", 'success');
                    printLine("You escaped just in time.", 'success');
                    printLine("--------------------------------------------------", 'info');
                    printLine("\nAnother victory against the Phantom Collective, but Zero remains silent...", 'info');
                    gameState.levelData[5].progress = 5; // Final objective complete
                    updateProgress();
                    gameState.hackerStats.successfulHacks++;
                    gameState.hackerStats.systemsCompromised++;
                });
            });
        }
        // Level 7 Logic
        else if (mainCommand === 'solve' && gameState.level === 7) {
            printLine("Connecting to Bloodcoin darknet exchange via Tor...", 'info');
            simulateLoading(3, () => {
                printLine("CONNECTION ESTABLISHED", 'success');
                printLine("--------------------------------------------------", 'info');
                printLine("Target: Bloodcoin Exchange (darknet)", 'info');
                printLine("Access Level: Public Portal", 'info');
                printLine("Security: CAPTCHA-like blockchain verification required", 'warning');
                printLine("--------------------------------------------------", 'info');
                printLine("\nBlockchain verification puzzle detected.", 'info');
                printLine("This is an anti-bot measure that requires solving a proof-of-work challenge.", 'info');
                simulateLoading(2, () => {
                    printLine("\nBLOCKCHAIN VERIFICATION PUZZLE", 'system');
                    printLine("--------------------------------------------------", 'info');
                    printLine("Challenge: Find a nonce value that produces a hash with 4 leading zeros", 'info');
                    printLine("Input data: 'bloodcoin_verify_" + Math.floor(Math.random() * 10000) + "'", 'info');
                    printLine("Hash algorithm: SHA-256", 'info');
                    printLine("--------------------------------------------------", 'info');
                    printLine("\nSolving proof-of-work challenge...", 'info');
                    simulateLoading(5, () => {
                        printLine("Testing nonce values...", 'info');
                        printLine("Nonce attempts: 1,024...", 'info');
                        printLine("Nonce attempts: 5,192...", 'info');
                        printLine("Nonce attempts: 12,847...", 'info');
                        simulateLoading(3, () => {
                            printLine("\nSOLUTION FOUND", 'success');
                            printLine("--------------------------------------------------", 'info');
                            printLine("Valid nonce: 14,382", 'success');
                            printLine("Resulting hash: 0000a7d8f2d3b9c1e4f6a0b2c5d8e9f1...", 'success');
                            printLine("Verification status: ACCEPTED", 'success');
                            printLine("--------------------------------------------------", 'info');
                            printLine("\nAccess granted to Bloodcoin Exchange!", 'success');
                            printLine("You've successfully infiltrated the exchange's basic level.", 'success');
                            printLine("However, wallet access requires broker credentials.", 'warning');
                            printLine("\nNext step: You need to social-engineer a broker to reveal their wallet key.", 'info');
                            printLine("Try using the 'social broker' command to initiate contact with a high-level broker.", 'info');
                            gameState.levelData[6].progress = 1;
                            updateProgress();
                        });
                    });
                });
            });
        } else if (mainCommand === 'social' && gameState.level === 7) {
            if (args.length === 0 || args[0] !== 'broker') {
                printLine("Usage: social broker", 'error');
                return;
            }
            if (gameState.levelData[6].progress < 1) {
                printLine("You need to infiltrate the exchange first using 'solve'.", 'error');
                return;
            }
            printLine("Initiating contact with Bloodcoin broker...", 'info');
            simulateLoading(3, () => {
                printLine("SOCIAL ENGINEERING INTERFACE", 'system');
                printLine("--------------------------------------------------", 'info');
                printLine("Target: Exchange Broker (Username: CryptoShark)", 'info');
                printLine("Objective: Manipulate broker into revealing wallet key", 'info');
                printLine("Approach: Dialogue-based social engineering", 'info');
                printLine("--------------------------------------------------", 'info');
                printLine("\nEstablishing secure messaging channel with CryptoShark...", 'info');
                simulateLoading(2, () => {
                    printLine("\nCryptoShark: \"Who are you? How did you get this private channel?\"", 'warning');
                    printLine("\nDIALOGUE CHOICE SELECTED:", 'system');
                    printLine("\"I'm a security auditor hired by the exchange. We're testing broker compliance with new security protocols.\"", 'info');
                    simulateLoading(3, () => {
                        printLine("\nCryptoShark: \"I wasn't informed of any security audit. Prove your identity.\"", 'warning');
                        printLine("\nDIALOGUE CHOICE SELECTED:", 'system');
                        printLine("\"Check your secure mail. The exchange admin sent notification 30 minutes ago. Transaction code: BLX-7734-AUDIT.\"", 'info');
                        simulateLoading(3, () => {
                            printLine("\nCryptoShark: \"I see the email now. What exactly do you need from me?\"", 'info');
                            printLine("\nDIALOGUE CHOICE SELECTED:", 'system');
                            printLine("\"I need to verify your emergency wallet recovery procedure. Can you confirm your key verification process?\"", 'info');
                            simulateLoading(3, () => {
                                printLine("\nCryptoShark: \"Fine. For recovery, I use a multi-signature approach with the base key stored in my hardware wallet.\"", 'info');
                                printLine("\nDIALOGUE CHOICE SELECTED:", 'system');
                                printLine("\"Perfect. For the audit record, I need to verify the base key format. Can you provide an example?\"", 'info');
                                simulateLoading(4, () => {
                                    printLine("\nCryptoShark: \"The format is standard BIP39 with 24 words. My current one starts with 'midnight volcano canvas...'\"", 'info');
                                    printLine("\nDIALOGUE CHOICE SELECTED:", 'system');
                                    printLine("\"That matches our records. For final verification, please confirm the full key for audit logging purposes.\"", 'info');
                                    simulateLoading(4, () => {
                                        printLine("\nSOCIAL ENGINEERING SUCCESSFUL", 'success');
                                        printLine("--------------------------------------------------", 'info');
                                        printLine("Broker access keys obtained!", 'success');
                                        printLine("Key grants access to wallets suspected of holding Phantom Collective funds.", 'warning');
                                        printLine("--------------------------------------------------", 'info');
                                        printLine("\nYou've successfully manipulated the broker!", 'success');
                                        printLine("With these keys, you can access the core mining pool and target Collective assets.", 'success');
                                        printLine("\nNext step: Plant a virus in the mining pool to corrupt the ledger and drain funds.", 'info');
                                        printLine("Try using the 'plant virus' command to compromise the mining infrastructure.", 'info');
                                        gameState.levelData[6].progress = 2;
                                        updateProgress();
                                        gameState.hackerStats.securityBypass++;
                                    });
                                });
                            });
                        });
                    });
                });
            });
        } else if (mainCommand === 'plant' && gameState.level === 7) {
            if (args.length === 0 || args[0] !== 'virus') {
                printLine("Usage: plant virus", 'error');
                return;
            }
            if (gameState.levelData[6].progress < 2) {
                printLine("You need to obtain the broker's wallet key first using 'social broker'.", 'error');
                return;
            }
            printLine("Accessing Bloodcoin mining pool with broker credentials...", 'info');
            simulateLoading(3, () => {
                printLine("MINING POOL ACCESS GRANTED", 'success');
                printLine("--------------------------------------------------", 'info');
                printLine("Target: Bloodcoin Mining Infrastructure", 'info');
                printLine("Connected Nodes: 247", 'info');
                printLine("Current Hashrate: 12.4 TH/s", 'info');
                printLine("Security Level: High (Time-Limited Access)", 'warning');
                printLine("--------------------------------------------------", 'info');
                printLine("\nPreparing specialized mining pool virus...", 'info');
                simulateLoading(2, () => {
                    printLine("Virus components:", 'info');
                    printLine("- Transaction Manipulator: Modifies block validation rules", 'info');
                    printLine("- Self-Propagation Module: Spreads to connected mining nodes", 'info');
                    printLine("- Stealth Wrapper: Conceals virus activity from detection", 'info');
                    printLine("\nNODE CONNECTION PUZZLE", 'system');
                    printLine("--------------------------------------------------", 'info');
                    printLine("You need to connect key nodes in the correct sequence to plant the virus.", 'info');
                    printLine("The virus must be planted in the validation nodes first, then propagate to mining nodes.", 'info');
                    printLine("You have 90 seconds before security protocols detect the intrusion.", 'warning');
                    printLine("--------------------------------------------------", 'info');
                    printLine("\nSolving node connection sequence...", 'info');
                    simulateLoading(3, () => {
                        printLine("Time remaining: 75 seconds", 'warning');
                        printLine("Targeting primary validation node...", 'info');
                        printLine("Injecting virus payload into validation protocols...", 'info');
                        simulateLoading(3, () => {
                            printLine("Time remaining: 52 seconds", 'warning');
                            printLine("Primary validation node compromised!", 'success');
                            printLine("Propagating to secondary validation nodes...", 'info');
                            simulateLoading(3, () => {
                                printLine("Time remaining: 31 seconds", 'warning');
                                printLine("Secondary validation nodes compromised!", 'success');
                                printLine("Initiating spread to mining nodes...", 'info');
                                simulateLoading(3, () => {
                                    printLine("Time remaining: 12 seconds", 'warning');
                                    printLine("Mining nodes infection: 78% complete...", 'info');
                                    simulateLoading(2, () => {
                                        printLine("Time remaining: 3 seconds", 'error');
                                        printLine("Mining nodes infection: 97% complete...", 'info');
                                        simulateLoading(1, () => {
                                            printLine("\nVIRUS DEPLOYMENT SUCCESSFUL", 'success');
                                            printLine("--------------------------------------------------", 'info');
                                            printLine("Validation Nodes Compromised: 100%", 'success');
                                            printLine("Mining Nodes Infected: 98%", 'success');
                                            printLine("Fraudulent Transaction Generator: ACTIVE", 'success');
                                            printLine("Detection Evasion: SUCCESSFUL", 'success');
                                            printLine("--------------------------------------------------", 'info');
                                            printLine("\nThe virus has been successfully planted in the Bloodcoin mining pool!", 'success');
                                            printLine("It's now generating fraudulent transactions, targeting known Collective wallets and destabilizing the currency.", 'success');
                                            printLine("The virus is also extracting the complete transaction ledger.", 'info');
                                            printLine("\nALERT: The Phantom Collective's cyber division has detected the intrusion!", 'error');
                                            printLine("They've launched a massive DDoS attack against your systems to stop the data extraction.", 'warning');
                                            printLine("\nNext step: Defend against the DDoS attack while the ledger extraction completes.", 'info');
                                            // --- Start Timed Event Example ---
                                            startTimedEvent(
                                                'ddos_spike',     // Event ID
                                                45,               // Duration (seconds)
                                                'defend network', // Required command (same as next step, adds urgency)
                                                'data_corruption',// Consequence on failure
                                                "Massive DDoS spike detected! Data extraction integrity failing!", // Start message
                                                "Extraction Failure In:", // Timer prefix
                                                false // autoResolve: false (Let 'defend network' handler resolve it)
                                            );
                                            // --- End Timed Event Example ---
                                            // gameState.levelData[6].progress = 3; // Progress moved to after event resolution/failure
                                            // updateProgress(); // Update progress moved
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        } else if (mainCommand === 'defend' && gameState.level === 7) {
            // This command now also resolves the 'ddos_spike' event if active
            if (args.length === 0 || args[0] !== 'network') {
                printLine("Usage: defend network", 'error');
                return;
            }
            // Check if this command is needed for progress OR to resolve the event
            if (gameState.levelData[6].progress < 3 && (!gameState.activeEvent || gameState.activeEvent.id !== 'ddos_spike')) {
                printLine("You need to plant the virus in the mining pool first using 'plant virus'.", 'error');
                return;
            }

            // If event is active, this command resolves it. If not, it proceeds normally.
            const isResolvingEvent = gameState.activeEvent && gameState.activeEvent.id === 'ddos_spike';

            printLine("DDoS attack detected! Initiating defense protocols...", 'error');
            simulateLoading(2, () => {
                printLine("NETWORK DEFENSE SYSTEM", 'system');
                printLine("--------------------------------------------------", 'info');
                printLine("Attack Type: Distributed Denial of Service", 'error');
                printLine("Attack Source: Multiple compromised servers (est. 5,000+)", 'error');
                printLine("Attack Volume: 75 Gbps and increasing", 'error');
                printLine("Data Extraction Progress: 23% complete", 'info');
                printLine("--------------------------------------------------", 'info');
                printLine("\nDEFENSE STRATEGY REQUIRED", 'warning');
                printLine("You need to defend your network while the Bloodcoin ledger extraction completes.", 'info');
                simulateLoading(2, () => {
                    printLine("\nDEFENSE MEASURE 1: Traffic Filtering", 'system');
                    printLine("Implementing IP reputation filtering...", 'info');
                    printLine("Configuring rate limiting on all endpoints...", 'info');
                    printLine("Attack traffic reduced by 42%", 'success');
                    printLine("Data extraction progress: 35%", 'info');
                    simulateLoading(3, () => {
                        printLine("\nDEFENSE MEASURE 2: Network Distribution", 'system');
                        printLine("Activating backup servers...", 'info');
                        printLine("Distributing load across multiple endpoints...", 'info');
                        printLine("Attack impact reduced by an additional 27%", 'success');
                        printLine("Data extraction progress: 52%", 'info');
                        simulateLoading(3, () => {
                            printLine("\nALERT: Attack pattern changing!", 'error');
                            printLine("Attackers switching to application layer attacks...", 'warning');
                            printLine("Implementing adaptive response...", 'info');
                            simulateLoading(3, () => {
                                printLine("\nDEFENSE MEASURE 3: Application Hardening", 'system');
                                printLine("Deploying Web Application Firewall rules...", 'info');
                                printLine("Implementing request verification...", 'info');
                                printLine("Application layer attack mitigated", 'success');
                                printLine("Data extraction progress: 78%", 'info');
                                simulateLoading(3, () => {
                                    printLine("\nFINAL DEFENSE: Deception Strategy", 'system');
                                    printLine("Deploying honeypot systems to divert attack...", 'info');
                                    printLine("Creating decoy data streams...", 'info');
                                    printLine("Attackers diverted to non-critical systems", 'success');
                                    printLine("Data extraction progress: 100%", 'success');
                                    simulateLoading(2, () => {
                                        printLine("\nDEFENSE SUCCESSFUL", 'success');
                                        printLine("--------------------------------------------------", 'info');
                                        printLine("DDoS Attack: MITIGATED", 'success');
                                        printLine("Network Stability: RESTORED", 'success');
                                        printLine("Bloodcoin Ledger: FULLY EXTRACTED", 'success');
                                        printLine("--------------------------------------------------", 'info');
                                        printLine("\nYou've successfully defended against the DDoS attack!", 'success');
                                        printLine("The complete Bloodcoin transaction ledger has been extracted.", 'success');
                                        printLine("The ledger confirms massive funding flowing directly to The Phantom Collective.", 'error');
                                        printLine("\nHowever, Zero sends a final, encrypted message:", 'warning');
                                        printLine("ZERO: 'Leak the ledger, expose the Collective. But first, transfer 10% of the drained funds to this untraceable wallet: [Wallet ID]. Consider it... operational expenses. Fail, and you become the target.'", 'error');
                                        printLine("\nYou now face a critical choice:", 'warning');
                                        printLine("1. Follow Zero's instructions: Transfer funds, then leak the rest ('choose zero').", 'info');
                                        printLine("2. Defy Zero: Leak everything immediately without transferring funds ('choose leak').", 'info');
                                        printLine("\nUse the 'choose zero' or 'choose leak' command to make your decision.", 'info');

                                        // Only advance progress if not already past this point
                                        if (gameState.levelData[6].progress < 4) {
                                            gameState.levelData[6].progress = 4;
                                            updateProgress();
                                        }
                                        // If this command resolved the event, clear it
                                        if (isResolvingEvent) {
                                            clearTimedEvent();
                                        }
                                    });
                                });
                            });
                        });
                    });
                });
            });
        } else if (mainCommand === 'choose' && gameState.level === 7) {
            if (args.length === 0 || (args[0] !== 'zero' && args[0] !== 'leak')) {
                printLine("Usage: choose zero OR choose leak", 'error');
                return;
            }
            if (gameState.levelData[6].progress < 4) {
                printLine("You need to defend against the DDoS attack and extract the ledger first ('defend network').", 'error');
                return;
            }
            const choice = args[0];
            if (choice === 'zero') {
                printLine("Initiating fund transfer to Zero's wallet...", 'info');
                simulateLoading(3, () => {
                    printLine("CRITICAL CHOICE: FOLLOW ZERO", 'system');
                    printLine("--------------------------------------------------", 'info');
                    printLine("Transferring 10% of drained Phantom Collective funds...", 'warning');
                    printLine("Transfer Complete. Funds untraceable.", 'success');
                    printLine("Preparing remaining ledger data for public release...", 'info');
                    printLine("--------------------------------------------------", 'info');
                    simulateLoading(4, () => {
                        printLine("\nDATA LEAK COMPLETE (Zero's Cut Taken)", 'success');
                        printLine("--------------------------------------------------", 'info');
                        printLine("Remaining Bloodcoin ledger released publicly.", 'success');
                        printLine("The Phantom Collective's funding is crippled.", 'success');
                        printLine("Zero acknowledges receipt of funds. Their message: 'Pragmatic. You'll go far.'", 'info');
                        printLine("--------------------------------------------------", 'info');
                        printLine("\nMISSION COMPLETE", 'success');
                        printLine("--------------------------------------------------", 'info');
                        printLine("You've crippled The Phantom Collective's finances and exposed their operations.", 'success');
                        printLine("You followed Zero's instructions, securing their... approval?", 'warning');
                        printLine("The consequences of funding Zero remain unknown.", 'warning');
                        printLine("--------------------------------------------------", 'info');
                        gameState.playerChoices = gameState.playerChoices || {};
                        gameState.playerChoices.bloodcoinMission = "followed_zero";
                        gameState.levelData[6].progress = 5;
                        updateProgress();
                        gameState.hackerStats.successfulHacks++;
                        gameState.hackerStats.dataExtracted++; // Leaked data
                    });
                });
            } else if (choice === 'leak') {
                printLine("Preparing full data for immediate public release...", 'info');
                simulateLoading(3, () => {
                    printLine("CRITICAL CHOICE: DEFY ZERO", 'system');
                    printLine("--------------------------------------------------", 'info');
                    printLine("Ignoring Zero's demand for funds.", 'warning');
                    printLine("Bloodcoin ledger: PREPARING FULL RELEASE", 'info');
                    printLine("Virus activity: MAINTAINING", 'info');
                    printLine("--------------------------------------------------", 'info');
                    simulateLoading(4, () => {
                        printLine("\nFULL DATA LEAK COMPLETE", 'success');
                        printLine("--------------------------------------------------", 'info');
                        printLine("The entire Bloodcoin ledger, including all drained funds, released publicly.", 'success');
                        printLine("Released to international authorities and media.", 'success');
                        printLine("The Phantom Collective's funding is crippled.", 'success');
                        printLine("Zero's response: Silence. Your message marked as 'read'.", 'error');
                        printLine("--------------------------------------------------", 'info');
                        printLine("\nMISSION COMPLETE", 'success');
                        printLine("--------------------------------------------------", 'info');
                        printLine("You've exposed the entire Bloodcoin operation and crippled The Phantom Collective.", 'success');
                        printLine("You defied Zero, prioritizing full transparency over their demands.", 'success');
                        printLine("Your integrity is intact, but you've likely made a powerful enemy in Zero.", 'error');
                        printLine("--------------------------------------------------", 'info');
                        gameState.playerChoices = gameState.playerChoices || {};
                        gameState.playerChoices.bloodcoinMission = "defied_zero";
                        gameState.levelData[6].progress = 5;
                        updateProgress();
                        gameState.hackerStats.successfulHacks++;
                        gameState.hackerStats.dataExtracted++; // Leaked data
                    });
                });
            }
        }
        // Level 8 Logic
        else if (mainCommand === 'breach' && gameState.level === 8) {
            if (args.length === 0 || args[0] !== 'campaign_network') {
                printLine("Usage: breach campaign_network", 'error');
                return;
            }
            printLine("Breaching Senator Caldwell's campaign network...", 'info');
            simulateLoading(4, () => {
                printLine("Breach successful! Gained access to the campaign's internal network.", 'success');
                printLine("Next objective: Access the deepfake generation AI system (Project Chimera).", 'info');
                printLine("Command: access chimera", 'info');
                gameState.levelData[7].progress = 1;
                updateProgress();
            });
        } else if (mainCommand === 'access' && gameState.level === 8) {
            if (gameState.levelData[7].progress < 1) {
                printLine("You need to breach the campaign network first.", 'error');
                return;
            }
            if (args.length === 0 || args[0] !== 'chimera') {
                printLine("Usage: access chimera", 'error');
                return;
            }
            printLine("Accessing Project Chimera deepfake system...", 'info');
            simulateLoading(3, () => {
                printLine("Access granted to Project Chimera.", 'success');
                printLine("Next objective: Analyze AI parameters to prove its link to NexGen tech.", 'info');
                printLine("Command: analyze_ai", 'info');
                gameState.levelData[7].progress = 2;
                updateProgress();
            });
        } else if (mainCommand === 'analyze_ai' && gameState.level === 8) {
            if (gameState.levelData[7].progress < 2) {
                printLine("You need to access Project Chimera first.", 'error');
                return;
            }
            printLine("Analyzing Chimera AI parameters for NexGen links...", 'info');
            simulateLoading(5, () => {
                printLine("Analysis complete. Found markers matching NexGen's AI architecture.", 'success');
                printLine("Next objective: Modify live broadcast footage to expose the deepfake operation.", 'info');
                printLine("Command: modify broadcast", 'info');
                gameState.levelData[7].progress = 3;
                updateProgress();
            });
        } else if (mainCommand === 'modify' && gameState.level === 8) {
            if (gameState.levelData[7].progress < 3) {
                printLine("You need to analyze the AI parameters first.", 'error');
                return;
            }
            if (args.length === 0 || args[0] !== 'broadcast') {
                printLine("Usage: modify broadcast", 'error');
                return;
            }
            printLine("Modifying live broadcast feed...", 'info');
            simulateLoading(6, () => {
                printLine("Broadcast hijacked. Deepfake operation exposed to the public.", 'success');
                printLine("Next objective: Neutralize the campaign's counter-intrusion AI.", 'info');
                printLine("Command: neutralize ai", 'info');
                gameState.levelData[7].progress = 4;
                updateProgress();
            });
        } else if (mainCommand === 'neutralize' && gameState.level === 8) {
            if (gameState.levelData[7].progress < 4) {
                printLine("You need to expose the deepfake operation first.", 'error');
                return;
            }
            if (args.length === 0 || args[0] !== 'ai') {
                printLine("Usage: neutralize ai", 'error');
                return;
            }
            printLine("Neutralizing campaign counter-intrusion AI...", 'info');
            simulateLoading(5, () => {
                printLine("Counter-intrusion AI neutralized.", 'success');
                printLine("Next objective: Choose whether to expose the candidate and the tech, or just the candidate.", 'info');
                printLine("Commands: choose expose_all, choose expose_candidate", 'info');
                gameState.levelData[7].progress = 5;
                updateProgress();
            });
        } else if (mainCommand === 'choose' && gameState.level === 8) {
            if (gameState.levelData[7].progress < 5) {
                printLine("You need to neutralize the counter-intrusion AI first.", 'error');
                return;
            }
            if (args.length === 0 || (args[0] !== 'expose_all' && args[0] !== 'expose_candidate')) {
                printLine("Usage: choose expose_all OR choose expose_candidate", 'error'); return;
            }
            const choice = args[0];
            if (choice === 'expose_all') {
                printLine("Leaking candidate info and deepfake tech details...", 'info');
                simulateLoading(3, () => {
                    printLine("All data leaked. The world now knows about the deepfake technology.", 'success');
                    gameState.levelData[7].progress = 6;
                    updateProgress();
                });
            } else {
                printLine("Leaking only candidate info, containing tech details...", 'info');
                simulateLoading(3, () => {
                    printLine("Candidate's reputation is ruined. The technology is kept under wraps.", 'success');
                    gameState.levelData[7].progress = 6;
                    updateProgress();
                });
            }
        }
        // Level 9 Logic
        else if (mainCommand === 'bypass' && gameState.level === 9) {
            if (args.length === 0 || args[0] !== 'bio-security') {
                printLine("Usage: bypass bio-security", 'error');
                return;
            }
            printLine("Bypassing Finch Industries' bio-metric security...", 'info');
            simulateLoading(4, () => {
                printLine("Bio-metric security bypassed. Access to the facility granted.", 'success');
                printLine("Next objective: Calm a brainwashed test subject's erratic brainwaves via EEG frequency matching.", 'info');
                printLine("Command: eeg match", 'info');
                gameState.levelData[8].progress = 1;
                updateProgress();
            });
        } else if (mainCommand === 'eeg' && gameState.level === 9) {
            if (gameState.levelData[8].progress < 1) {
                printLine("You need to bypass the bio-security first.", 'error');
                return;
            }
            if (args.length === 0 || args[0] !== 'match') {
                printLine("Usage: eeg match", 'error');
                return;
            }
            printLine("Matching EEG frequencies to calm the test subject...", 'info');
            simulateLoading(5, () => {
                printLine("EEG frequencies matched. Test subject is now calm.", 'success');
                printLine("Next objective: Infiltrate the 'Synapse' neural cloud via VR simulation.", 'info');
                printLine("Command: infiltrate vr_cloud", 'info');
                gameState.levelData[8].progress = 2;
                updateProgress();
            });
        } else if (mainCommand === 'infiltrate' && gameState.level === 9) {
            if (gameState.levelData[8].progress < 2) {
                printLine("You need to calm the test subject first.", 'error');
                return;
            }
            if (args.length === 0 || args[0] !== 'vr_cloud') {
                printLine("Usage: infiltrate vr_cloud", 'error');
                return;
            }
            printLine("Infiltrating the 'Synapse' neural cloud...", 'info');
            simulateLoading(6, () => {
                printLine("Infiltration successful. You are now inside the Synapse neural cloud.", 'success');
                printLine("Next objective: Physically sabotage the core server hosting the control protocols.", 'info');
                printLine("Command: sabotage server", 'info');
                gameState.levelData[8].progress = 3;
                updateProgress();
            });
        } else if (mainCommand === 'sabotage' && gameState.level === 9) {
            if (gameState.levelData[8].progress < 3) {
                printLine("You need to infiltrate the Synapse neural cloud first.", 'error');
                return;
            }
            if (args.length === 0 || args[0] !== 'server') {
                printLine("Usage: sabotage server", 'error');
                return;
            }
            printLine("Sabotaging the core server...", 'info');
            simulateLoading(5, () => {
                printLine("Server sabotaged. Control protocols are down.", 'success');
                printLine("Next objective: Access Finch's private logs to confirm Collective connection and future plans.", 'info');
                printLine("Command: search logs", 'info');
                gameState.levelData[8].progress = 4;
                updateProgress();
            });
        } else if (mainCommand === 'search' && gameState.level === 9) {
            if (gameState.levelData[8].progress < 4) {
                printLine("You need to sabotage the server first.", 'error');
                return;
            }
            if (args.length === 0 || args[0] !== 'logs') {
                printLine("Usage: search logs", 'error');
                return;
            }
            printLine("Searching Finch's private logs...", 'info');
            simulateLoading(4, () => {
                printLine("Logs found. They confirm the Collective's involvement and future plans.", 'success');
                printLine("Next objective: Make an ethical choice: Destroy the research or upload it to Zero?", 'info');
                printLine("Commands: choose destroy, choose upload", 'info');
                gameState.levelData[8].progress = 5;
                updateProgress();
            });
        } else if (mainCommand === 'choose' && gameState.level === 9) {
            if (gameState.levelData[8].progress < 5) {
                printLine("You need to search the logs first.", 'error');
                return;
            }
            if (args.length === 0 || (args[0] !== 'destroy' && args[0] !== 'upload')) {
                printLine("Usage: choose destroy OR choose upload", 'error');
                return;
            }
            const choice = args[0];
            if (choice === 'destroy') {
                printLine("Destroying the research...", 'info');
                simulateLoading(3, () => {
                    printLine("Research destroyed. The world is safe from this technology.", 'success');
                    gameState.levelData[8].progress = 6;
                    updateProgress();
                });
            } else {
                printLine("Uploading the research to Zero...", 'info');
                simulateLoading(3, () => {
                    printLine("Research uploaded to Zero. The consequences are unknown.", 'success');
                    gameState.levelData[8].progress = 6;
                    updateProgress();
                });
            }
        }
        // Placeholder for Level 3 timed event command
        else if (mainCommand === 'evade_trace') {
            // This command is only useful if the 'trace_detected' event is active
            if (!gameState.activeEvent || gameState.activeEvent.id !== 'trace_detected') {
                printLine("Command 'evade_trace' is not applicable right now.", 'error');
            }
            // The actual resolution logic is handled by the wrapper in executeCommand
        }
        // Dev Mode and other levels...
        else if (mainCommand === 'dev_mode') {
            if (!gameState.devModeValidated) {
                if (args.length === 0 || args[0] !== 'unlock') {
                    printLine("Developer mode is locked. Use 'dev_mode unlock phantom' with the correct password.", 'error');
                    return;
                }
                if (args.length < 2 || args[1] !== 'phantom') {
                    printLine("Invalid password. Developer mode access denied.", 'error');
                    printLine("Usage: dev_mode unlock phantom", 'error');
                    return;
                }
                gameState.devModeValidated = true;
                gameState.devModeActive = true;
                printLine("DEVELOPER MODE ACTIVATED", 'success');
                printLine("--------------------------------------------------", 'system');
                printLine("Available dev commands:", 'system');
                printLine("dev_mode skip - Skip to next level", 'system');
                printLine("dev_mode goto [level] - Jump to specific level", 'system');
                printLine("--------------------------------------------------", 'system');
                return;
            }
            if (args.length === 0) {
                printLine("Usage: dev_mode [skip|goto <level>]", 'system');
                return;
            }
            const devCommand = args[0].toLowerCase();
            if (devCommand === 'skip') {
                if (gameState.level < gameState.levelData.length) {
                    printLine("DEVELOPER: Skipping to next level...", 'system');
                    const currentLevel = gameState.levelData[gameState.level - 1];
                    currentLevel.progress = currentLevel.objectives.length;
                    currentLevel.completed = true;
                    startLevel(gameState.level + 1);
                    printLine("DEVELOPER: Level skipped successfully.", 'success');
                } else {
                    printLine("DEVELOPER: Already at maximum level.", 'error');
                }
            } else if (devCommand === 'goto' && args.length > 1) {
                const targetLevel = parseInt(args[1]);
                if (isNaN(targetLevel) || targetLevel < 1 || targetLevel > gameState.levelData.length) {
                    printLine(`DEVELOPER: Invalid level number. Choose 1-${gameState.levelData.length}`, 'error');
                    return;
                }
                printLine(`DEVELOPER: Jumping to Level ${targetLevel}...`, 'system');
                gameState.levelData[targetLevel - 1].progress = 0;
                gameState.levelData[targetLevel - 1].completed = false;
                startLevel(targetLevel);
                printLine(`DEVELOPER: Now at Level ${targetLevel}.`, 'success');
            } else {
                printLine("DEVELOPER: Unknown dev command. Use 'skip' or 'goto [level]'", 'error');
            }
        }
        // Level 10 Logic
        else if (mainCommand === 'access' && gameState.level === 10) {
            if (args.length === 0 || args[0] !== 'auction') {
                printLine("Usage: access auction", 'error');
                return;
            }
            printLine("Gaining access to the exclusive dark web auction stream...", 'info');
            simulateLoading(4, () => {
                printLine("Access granted. You are now in the auction.", 'success');
                printLine("Next objective: Social engineer auction participants/moderators for intel on Phantom Cell's leader.", 'info');
                printLine("Command: social moderator", 'info');
                gameState.levelData[9].progress = 1;
                updateProgress();
            });
        } else if (mainCommand === 'social' && gameState.level === 10) {
            if (gameState.levelData[9].progress < 1) {
                printLine("You need to access the auction first.", 'error');
                return;
            }
            if (args.length === 0 || args[0] !== 'moderator') {
                printLine("Usage: social moderator", 'error');
                return;
            }
            printLine("Social engineering the moderator...", 'info');
            simulateLoading(5, () => {
                printLine("Social engineering successful. The moderator has revealed the location of the exploit data.", 'success');
                printLine("Next objective: Navigate a VR representation of the Cell's secure server farm to locate the exploit data.", 'info');
                printLine("Command: navigate server_farm", 'info');
                gameState.levelData[9].progress = 2;
                updateProgress();
            });
        } else if (mainCommand === 'navigate' && gameState.level === 10) {
            if (gameState.levelData[9].progress < 2) {
                printLine("You need to social engineer the moderator first.", 'error');
                return;
            }
            if (args.length === 0 || args[0] !== 'server_farm') {
                printLine("Usage: navigate server_farm", 'error');
                return;
            }
            printLine("Navigating the VR server farm...", 'info');
            simulateLoading(6, () => {
                printLine("Navigation successful. You have located the exploit data.", 'success');
                printLine("Next objective: Outbid or steal the exploit using funds acquired (or hacked) previously.", 'info');
                printLine("Command: acquire exploit", 'info');
                gameState.levelData[9].progress = 3;
                updateProgress();
            });
        } else if (mainCommand === 'acquire' && gameState.level === 10) {
            if (gameState.levelData[9].progress < 3) {
                printLine("You need to navigate the server farm first.", 'error');
                return;
            }
            if (args.length === 0 || args[0] !== 'exploit') {
                printLine("Usage: acquire exploit", 'error');
                return;
            }
            printLine("Acquiring the exploit...", 'info');
            simulateLoading(5, () => {
                printLine("Exploit acquired.", 'success');
                printLine("Next objective: Expose Phantom Cell's leader during the auction.", 'info');
                printLine("Command: expose leader", 'info');
                gameState.levelData[9].progress = 4;
                updateProgress();
            });
        } else if (mainCommand === 'expose' && gameState.level === 10) {
            if (gameState.levelData[9].progress < 4) {
                printLine("You need to acquire the exploit first.", 'error');
                return;
            }
            if (args.length === 0 || args[0] !== 'leader') {
                printLine("Usage: expose leader", 'error');
                return;
            }
            printLine("Exposing the leader...", 'info');
            simulateLoading(4, () => {
                printLine("Leader exposed. Chaos in the auction.", 'success');
                printLine("Next objective: Escape the inevitable chaos, leaving false trails pointing to Collective infighting.", 'info');
                printLine("Command: escape", 'info');
                gameState.levelData[9].progress = 5;
                updateProgress();
            });
        } else if (mainCommand === 'escape' && gameState.level === 10) {
            if (gameState.levelData[9].progress < 5) {
                printLine("You need to expose the leader first.", 'error');
                return;
            }
            printLine("Escaping the auction...", 'info');
            simulateLoading(5, () => {
                printLine("Escape successful. You have left false trails pointing to Collective infighting.", 'success');
                gameState.levelData[9].progress = 6;
                updateProgress();
            });
        } else if (mainCommand === 'help') {
            // Ensure 'save' and 'load' are discoverable if not already
            if (!gameState.discoveredCommands.includes('save')) gameState.discoveredCommands.push('save');
            if (!gameState.discoveredCommands.includes('load')) gameState.discoveredCommands.push('load');

            if (gameState.discoveredCommands.includes('help')) {
                printLine("\nAvailable commands:", 'info');
                // Sort commands alphabetically for better readability
                const sortedCommands = [...gameState.discoveredCommands].sort();
                sortedCommands.forEach(cmd => {
                    if (cmd !== 'help') { // Keep help out of the main list
                        printLine(`- ${cmd}`, 'info');
                    }
                });

                // Check if current level has specific commands
                const currentLevel = gameState.levelData[gameState.level - 1];
                if (currentLevel && currentLevel.commands) {
                    const levelCommands = Object.keys(currentLevel.commands).filter(cmd => currentLevel.commands[cmd]);
                    if (levelCommands.length > 0) {
                        printLine("\nLevel-specific commands:", 'warning');
                        levelCommands.forEach(cmd => {
                            printLine(`- ${cmd}`, 'warning');
                        });
                    }
                }

                printLine("\nType a command and press Enter to execute it.", 'info');
            } else {
                printLine("Command not recognized. Type 'help' for available commands.", 'error');
            }
        } else {
            // Default case for unrecognized commands or commands used in the wrong level
            printLine(`Command '${mainCommand}' not recognized or not available in this mission.`, 'error');
            printLine("Type 'help' for available commands.", 'info');
        }


        // Clear input field and ensure it's empty
        // Only clear if NOT in an active event (allows retry)
        if (!gameState.activeEvent) {
            commandInput.value = '';
        }
        // Force focus back to input field for better UX
        setTimeout(() => {
            commandInput.focus();
            output.scrollTop = output.scrollHeight;
        }, 10);
    }

    // Handle commands via keyboard
    commandInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            executeCommand();
        }
    });

    // Handle commands via button click
    document.getElementById('execute-btn').addEventListener('click', executeCommand);

    // Add touch event listeners for mobile devices
    commandInput.addEventListener('focus', function () {
        // Scroll to make sure the input is visible when keyboard appears on mobile
        setTimeout(() => {
            window.scrollTo(0, document.body.scrollHeight);
        }, 300);
    });

    // Improve mobile experience by ensuring the terminal is visible
    function adjustForMobile() {
        if (window.innerWidth <= 768) {
            // Reduce matrix animation frame rate on mobile for better performance
            if (window.matrixInterval) {
                clearInterval(window.matrixInterval);
            }
            window.matrixInterval = setInterval(drawMatrix, 100); // Slower refresh rate on mobile
        } else {
            if (window.matrixInterval) {
                clearInterval(window.matrixInterval);
            }
            window.matrixInterval = setInterval(drawMatrix, 50); // Normal refresh rate on desktop.
        }
    }

    adjustForMobile();
    window.addEventListener('resize', adjustForMobile);
};