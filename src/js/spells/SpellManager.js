export class SpellManager {
    constructor(scene) {
        this.scene = scene;
    }

    castSpell(spellType, source, target, config, onComplete, isEnemySpell = false) {
        // Create casting circle indicator
        const color = isEnemySpell ? 0xFF0000 : this.getSpellColor(spellType);
        const castingCircle = this.scene.add.circle(
            source.x, source.y,
            this.scene.PLAYER_SIZE + 5,
            color,
            0.3
        );
        
        // Start casting animation
        this.scene.tweens.add({
            targets: castingCircle,
            alpha: 0.6,
            yoyo: true,
            repeat: 2,
            duration: config.castTime / 2,
            onComplete: () => {
                castingCircle.destroy();
            }
        });

        // After cast time, launch the spell
        this.scene.time.delayedCall(config.castTime, () => {
            if (source.active && target.active) {
                const spell = this.scene.add.circle(
                    source.x, source.y,
                    this.getSpellSize(spellType),
                    color
                );
                this.scene.physics.add.existing(spell);

                // Calculate lead target position for enemy spells
                let targetX = target.x;
                let targetY = target.y;
                if (isEnemySpell) {
                    const leadFactor = 0.5;
                    targetX += target.body.velocity.x * leadFactor;
                    targetY += target.body.velocity.y * leadFactor;
                }
                
                this.scene.physics.moveTo(
                    spell,
                    targetX,
                    targetY,
                    this.getSpellSpeed(spellType)
                );
                
                // Add collisions with walls and houses
                this.scene.physics.add.collider(spell, this.scene.worldManager.walls, (spellObj) => {
                    this.createSpellEffect(spellType, spellObj.x, spellObj.y);
                    spellObj.destroy();
                });
                
                this.scene.physics.add.collider(spell, this.scene.worldManager.houses, (spellObj) => {
                    this.createSpellEffect(spellType, spellObj.x, spellObj.y);
                    spellObj.destroy();
                });

                // Check for hits on target
                this.scene.physics.add.overlap(spell, target, (spellObj) => {
                    if (isEnemySpell) {
                        this.scene.player.takeDamage(config.damage);
                    } else {
                        this.scene.enemy.takeDamage(config.damage);
                    }
                    this.createSpellEffect(spellType, spellObj.x, spellObj.y);
                    spellObj.destroy();
                });

                // Destroy spell after 1 second if it hasn't hit anything
                this.scene.time.delayedCall(1000, () => {
                    if (spell.active) {
                        this.createSpellEffect(spellType, spell.x, spell.y);
                        spell.destroy();
                    }
                });
            }
            
            if (onComplete) onComplete();
        });
    }

    getSpellColor(spellType) {
        return {
            magic_arrow: 0xFF9900,
            lightning: 0x00FFFF,
            flame_strike: 0xFF4500
        }[spellType];
    }

    getSpellSize(spellType) {
        return {
            magic_arrow: 5,
            lightning: 7,
            flame_strike: 10
        }[spellType];
    }

    getSpellSpeed(spellType) {
        return {
            magic_arrow: 300,
            lightning: 400,
            flame_strike: 350
        }[spellType];
    }

    createSpellEffect(spellType, x, y) {
        switch (spellType) {
            case 'magic_arrow':
                this.createFizzleEffect(x, y);
                break;
            case 'lightning':
                this.createLightningEffect(x, y);
                break;
            case 'flame_strike':
                this.createFlameEffect(x, y);
                break;
        }
    }

    createFizzleEffect(x, y) {
        const particles = this.scene.add.particles(x, y, {
            speed: 100,
            scale: { start: 0.5, end: 0 },
            quantity: 5,
            lifespan: 300,
            tint: 0xFF9900
        });

        this.scene.time.delayedCall(300, () => {
            particles.destroy();
        });
    }

    createLightningEffect(x, y) {
        const particles = this.scene.add.particles(x, y, {
            speed: 150,
            scale: { start: 0.7, end: 0 },
            quantity: 8,
            lifespan: 400,
            tint: 0x00FFFF,
            angle: { min: 0, max: 360 }
        });

        const flash = this.scene.add.circle(x, y, 20, 0x00FFFF, 0.6);
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 1.5,
            duration: 200,
            onComplete: () => {
                flash.destroy();
            }
        });

        this.scene.time.delayedCall(400, () => {
            particles.destroy();
        });
    }

    createFlameEffect(x, y) {
        const particles = this.scene.add.particles(x, y, {
            speed: { min: 100, max: 200 },
            scale: { start: 0.8, end: 0 },
            quantity: 12,
            lifespan: 600,
            tint: [0xFF4500, 0xFF6B00, 0xFF8C00],
            angle: { min: 0, max: 360 }
        });

        const burst = this.scene.add.circle(x, y, 25, 0xFF4500, 0.7);
        this.scene.tweens.add({
            targets: burst,
            alpha: 0,
            scale: 1.8,
            duration: 300,
            onComplete: () => {
                burst.destroy();
            }
        });

        this.scene.time.delayedCall(600, () => {
            particles.destroy();
        });
    }
}
