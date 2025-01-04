export class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.targetingIndicator = null;
        this.createPlayerUI();
        this.createEnemyUI();
    }

    createPlayerUI() {
        // Player label
        this.scene.add.text(
            this.scene.player.sprite.x,
            this.scene.player.sprite.y - 35,
            'YOU',
            {
                font: '12px Arial',
                fill: '#000'
            }
        ).setOrigin(0.5);

        // Player status bars container
        this.playerBars = this.scene.add.container(
            this.scene.player.sprite.x,
            this.scene.player.sprite.y - 40
        );
        
        // Player health bar
        this.playerHealthBar = this.scene.add.rectangle(-25, 0, 50, 5, 0x00FF00);
        this.playerHealthBarBg = this.scene.add.rectangle(-25, 0, 50, 5, 0x000000);
        this.playerHealthBarBg.setStrokeStyle(1, 0x000000);
        
        // Player mana bar
        this.playerManaBar = this.scene.add.rectangle(-25, 5, 50, 5, 0x0000FF);
        this.playerManaBarBg = this.scene.add.rectangle(-25, 5, 50, 5, 0x000000);
        this.playerManaBarBg.setStrokeStyle(1, 0x000000);
        
        this.playerBars.add([
            this.playerHealthBarBg,
            this.playerHealthBar,
            this.playerManaBarBg,
            this.playerManaBar
        ]);
    }

    createEnemyUI() {
        // Enemy label
        this.scene.add.text(
            this.scene.enemy.sprite.x,
            this.scene.enemy.sprite.y - 35,
            'ENEMY',
            {
                font: '12px Arial',
                fill: '#000'
            }
        ).setOrigin(0.5);

        // Enemy status bars container
        this.enemyBars = this.scene.add.container(
            this.scene.enemy.sprite.x,
            this.scene.enemy.sprite.y - 40
        );
        
        // Enemy health bar
        this.enemyHealthBar = this.scene.add.rectangle(-25, 0, 50, 5, 0x00FF00);
        this.enemyHealthBarBg = this.scene.add.rectangle(-25, 0, 50, 5, 0x000000);
        this.enemyHealthBarBg.setStrokeStyle(1, 0x000000);
        
        // Enemy mana bar
        this.enemyManaBar = this.scene.add.rectangle(-25, 5, 50, 5, 0x0000FF);
        this.enemyManaBarBg = this.scene.add.rectangle(-25, 5, 50, 5, 0x000000);
        this.enemyManaBarBg.setStrokeStyle(1, 0x000000);
        
        this.enemyBars.add([
            this.enemyHealthBarBg,
            this.enemyHealthBar,
            this.enemyManaBarBg,
            this.enemyManaBar
        ]);
    }

    updateTargetingIndicator(target) {
        // Remove previous targeting indicator if it exists
        if (this.targetingIndicator) {
            this.targetingIndicator.destroy();
        }

        const graphics = this.scene.add.graphics();
        graphics.lineStyle(2, 0xFF0000);

        // Draw pulsing circle
        const time = this.scene.time.now * 0.003;
        const size = this.scene.PLAYER_SIZE + 5 + Math.sin(time) * 3;
        graphics.strokeCircle(target.x, target.y, size);

        // Draw crosshair
        const crosshairSize = 10;
        graphics.moveTo(target.x - crosshairSize, target.y);
        graphics.lineTo(target.x + crosshairSize, target.y);
        graphics.moveTo(target.x, target.y - crosshairSize);
        graphics.lineTo(target.x, target.y + crosshairSize);
        graphics.strokePath();

        this.targetingIndicator = graphics;
    }

    update() {
        // Update status bars position
        this.playerBars.setPosition(
            this.scene.player.sprite.x,
            this.scene.player.sprite.y - 40
        );
        this.enemyBars.setPosition(
            this.scene.enemy.sprite.x,
            this.scene.enemy.sprite.y - 40
        );

        // Update status bars scale
        this.playerHealthBar.scaleX = this.scene.player.stats.health / 100;
        this.playerManaBar.scaleX = this.scene.player.stats.mana / 100;
        this.enemyHealthBar.scaleX = this.scene.enemy.stats.health / 100;
        this.enemyManaBar.scaleX = this.scene.enemy.stats.mana / 100;
    }
}
