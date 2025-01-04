import MainScene from './MainScene.js';

const config = {
    type: Phaser.AUTO,
    parent: 'gameCanvas',
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: MainScene
};

export const game = new Phaser.Game(config);
