export class WorldManager {
    constructor(scene) {
        this.scene = scene;
        this.walls = null;
        this.houses = null;
        this.trees = null;
    }

    createWorld() {
        this.createGround();
        this.createWalls();
        this.createHouses();
        this.createTrees();
    }

    createGround() {
        // Create tiled grass ground
        const groundTiles = this.scene.add.tileSprite(
            0, 0,
            this.scene.GAME_WIDTH,
            this.scene.GAME_HEIGHT,
            'grass'
        );
        groundTiles.setOrigin(0, 0);
        groundTiles.setDepth(0);
        
        // Debug output
        console.log('Ground created:', {
            width: this.scene.GAME_WIDTH,
            height: this.scene.GAME_HEIGHT,
            texture: 'grass'
        });
    }

    createWalls() {
        this.walls = this.scene.physics.add.staticGroup();
        [
            { x: 200, y: 100, width: 20, height: 200 },
            { x: 500, y: 300, width: 200, height: 20 }
        ].forEach(wall => {
            const wallRect = this.scene.add.rectangle(
                wall.x, wall.y,
                wall.width, wall.height,
                0x808080
            );
            wallRect.setOrigin(0, 0);
            wallRect.setDepth(2);
            this.scene.physics.add.existing(wallRect, true);
            this.walls.add(wallRect);
        });
    }

    createHouses() {
        this.houses = this.scene.physics.add.staticGroup();
        [
            { x: 100, y: 100, width: 60, height: 60 },
            { x: 600, y: 400, width: 80, height: 80 }
        ].forEach(house => {
            const houseRect = this.scene.add.rectangle(
                house.x, house.y,
                house.width, house.height,
                0xA0522D
            );
            houseRect.setOrigin(0, 0);
            houseRect.setDepth(2);
            this.scene.physics.add.existing(houseRect, true);
            this.houses.add(houseRect);
        });
    }

    createTrees() {
        this.trees = this.scene.add.group();
        [
            { x: 300, y: 150, radius: 20 },
            { x: 450, y: 250, radius: 25 },
            { x: 150, y: 450, radius: 18 }
        ].forEach(tree => {
            // Add shadow
            const shadow = this.scene.add.ellipse(
                tree.x + 5, tree.y + 5,
                tree.radius * 2, tree.radius,
                0x000000, 0.3
            );
            shadow.setDepth(1);

            // Add tree
            const treeCircle = this.scene.add.circle(
                tree.x, tree.y,
                tree.radius,
                0x228B22
            );
            treeCircle.setDepth(3);
            this.trees.add(treeCircle);
        });
    }
}
