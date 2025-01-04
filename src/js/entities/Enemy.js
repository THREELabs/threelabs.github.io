import { SpellManager } from '../spells/SpellManager.js';

export class Enemy {
    constructor(scene, x, y) {
        this.scene = scene;
        this.stats = {
            health: 100,
            mana: 100
        };
        
        // Create enemy sprite
        this.sprite = scene.add.circle(x, y, 15, 0xFF0000);
        this.sprite.setDepth(4);
        scene.physics.add.existing(this.sprite);
        this.sprite.body.setCollideWorldBounds(true);
        
        // Add enemy shadow
        this.shadow = scene.add.ellipse(x + 5, y + 5, 30, 15, 0x000000, 0.3);
        this.shadow.setDepth(3);

        // Initialize AI properties
        this.spellManager = new SpellManager(scene);
        this.lastCastTime = 0;
        this.isCasting = false;
        this.nextSpellTime = 0;
        this.avoidanceTimer = 0;
        this.currentTarget = null;
    }

    update(player) {
        this.currentTarget = player.sprite;
        this.updateMovement(player);
        this.updateCasting(player);

        // Update shadow position
        this.shadow.setPosition(this.sprite.x + 5, this.sprite.y + 5);

        // Regenerate stats
        this.stats.health = Math.min(100, this.stats.health + 0.1);
        this.stats.mana = Math.min(100, this.stats.mana + 0.2);
    }

    updateMovement(player) {
        const currentTime = this.scene.time.now;
        
        // Check for nearby spells to avoid
        if (currentTime > this.avoidanceTimer) {
            const distance = Phaser.Math.Distance.Between(
                this.sprite.x, this.sprite.y,
                player.sprite.x, player.sprite.y
            );

            if (distance > 200) {
                // Move closer to player
                this.scene.physics.moveTo(
                    this.sprite,
                    player.sprite.x,
                    player.sprite.y,
                    this.scene.PLAYER_SPEED * 0.8
                );
            } else if (distance < 150) {
                // Move away from player
                const angle = Phaser.Math.Angle.Between(
                    player.sprite.x, player.sprite.y,
                    this.sprite.x, this.sprite.y
                );
                this.sprite.body.setVelocity(
                    Math.cos(angle) * this.scene.PLAYER_SPEED,
                    Math.sin(angle) * this.scene.PLAYER_SPEED
                );
            } else {
                // Strafe around player
                const angle = Phaser.Math.Angle.Between(
                    player.sprite.x, player.sprite.y,
                    this.sprite.x, this.sprite.y
                );
                const strafeAngle = angle + Math.PI / 2;
                this.sprite.body.setVelocity(
                    Math.cos(strafeAngle) * this.scene.PLAYER_SPEED,
                    Math.sin(strafeAngle) * this.scene.PLAYER_SPEED
                );
            }
        }
    }

    updateCasting(player) {
        if (this.isCasting || this.stats.mana < 20 || this.scene.time.now < this.nextSpellTime) {
            return;
        }

        const distance = Phaser.Math.Distance.Between(
            this.sprite.x, this.sprite.y,
            player.sprite.x, player.sprite.y
        );

        // Only cast if player is within range and there's line of sight
        if (distance < 300 && this.scene.hasLineOfSight(this.sprite, player.sprite)) {
            this.isCasting = true;
            this.nextSpellTime = this.scene.time.now + Phaser.Math.Between(1000, 2000);

            const spellConfig = {
                manaCost: 20,
                castTime: 700,
                damage: 20
            };

            this.stats.mana -= spellConfig.manaCost;

            // Cast magic arrow at player
            this.spellManager.castSpell(
                'magic_arrow',
                this.sprite,
                player.sprite,
                spellConfig,
                () => {
                    this.isCasting = false;
                },
                true // isEnemySpell
            );
        }
    }

    takeDamage(amount) {
        this.stats.health = Math.max(0, this.stats.health - amount);
    }
}
