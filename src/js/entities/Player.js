import { SpellManager } from '../spells/SpellManager.js';

export class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        this.stats = {
            health: 100,
            mana: 100
        };
        
        // Create player sprite
        this.sprite = scene.add.circle(x, y, 15, 0x0000FF);
        this.sprite.setDepth(4);
        scene.physics.add.existing(this.sprite);
        this.sprite.body.setCollideWorldBounds(true);
        
        // Add player shadow
        this.shadow = scene.add.ellipse(x + 5, y + 5, 30, 15, 0x000000, 0.3);
        this.shadow.setDepth(3);

        // Initialize spell manager
        this.spellManager = new SpellManager(scene);
        this.lastCastTime = 0;
        this.isCasting = false;
    }

    update(isMoving, pointer) {
        if (isMoving && pointer) {
            const distance = Phaser.Math.Distance.Between(
                this.sprite.x, this.sprite.y,
                pointer.x, pointer.y
            );

            if (distance < 5) {
                this.sprite.body.setVelocity(0, 0);
            } else {
                const angle = Phaser.Math.Angle.Between(
                    this.sprite.x, this.sprite.y,
                    pointer.x, pointer.y
                );
                
                const velocity = new Phaser.Math.Vector2();
                velocity.setToPolar(angle, this.scene.PLAYER_SPEED);
                
                this.sprite.body.setVelocity(velocity.x, velocity.y);
            }
        } else {
            this.sprite.body.setVelocity(0, 0);
        }

        // Update shadow position
        this.shadow.setPosition(this.sprite.x + 5, this.sprite.y + 5);

        // Regenerate stats
        this.stats.health = Math.min(100, this.stats.health + 0.1);
        this.stats.mana = Math.min(100, this.stats.mana + 0.2);
    }

    castSpell(spellType, target) {
        if (!target || this.isCasting) {
            return;
        }

        const spellConfig = {
            magic_arrow: { manaCost: 20, castTime: 700, damage: 20 },
            lightning: { manaCost: 30, castTime: 900, damage: 35 },
            flame_strike: { manaCost: 40, castTime: 1200, damage: 45 }
        }[spellType];

        if (!spellConfig || this.stats.mana < spellConfig.manaCost) {
            return;
        }

        const currentTime = this.scene.time.now;
        if (currentTime - this.lastCastTime < spellConfig.castTime) {
            this.spellManager.createFizzleEffect(this.sprite.x, this.sprite.y);
            return;
        }

        this.isCasting = true;
        this.lastCastTime = currentTime;
        this.stats.mana -= spellConfig.manaCost;

        this.spellManager.castSpell(
            spellType,
            this.sprite,
            target,
            spellConfig,
            () => this.isCasting = false
        );
    }

    takeDamage(amount) {
        this.stats.health = Math.max(0, this.stats.health - amount);
    }
}
