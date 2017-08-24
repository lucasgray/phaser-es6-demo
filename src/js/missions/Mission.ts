import GridDescriptor from "../models/state/GridDescriptor";
import * as EasyStar from 'easystarjs';
import {PlacedLootInfo} from "../models/state/GameData";
import Drone from "../models/sprites/enemies/Drone";

//this is a little big, maybe we can break it up somehow

abstract class Mission {

    abstract name: string;
    abstract gridDescriptor: GridDescriptor;
    abstract background: () => Phaser.Sprite;
    abstract enemyArray: Array<object>;

    game: Phaser.Game;
    easystar: EasyStar.js;

    enemies: Phaser.Group;
    projectiles: Phaser.Group;

    placedItems: Array<PlacedLootInfo>;

    curEnemy: number = 0;
    allDeployed: boolean;

    winTime: number;

    lastDeployment: number = Date.now();

    constructor(game: Phaser.Game, placedItems: Array<PlacedLootInfo>) {

        this.game = game;
        this.placedItems = placedItems;

        this.enemies = game.add.group();
        this.projectiles = game.add.group();
    }

    recalculateGrid() {

        let easystar = new EasyStar.js();

        let grid = Array<Array<number>>();
        for (let y = 0; y < this.gridDescriptor.y; y++) {
            let f = Array<number>();
            for (let x = 0; x < this.gridDescriptor.x; x++) {
                f.push(0);
            }
            grid.push(f);
        }

        this.placedItems.forEach((i) =>{
           grid[i.col][i.row] = 1;
        });

        easystar.setGrid(grid);
        easystar.setAcceptableTiles([0]);
        easystar.calculate();
        easystar.enableDiagonals();
        easystar.disableCornerCutting();
        easystar.calculate();

        this.easystar = easystar;
    }

    update() {

        this.easystar.calculate();

        this.deploy();

        this.checkBulletCollisions();

        this.checkWinCondition();
    }

    deploy() {

        if (!this.allDeployed && Date.now() - this.lastDeployment > this.enemyArray[this.curEnemy]['delay']) {

            console.log('new drone');

            let drone = new Drone(this.game, this, this.enemyArray[this.curEnemy]['at'], 0);
            this.game.add.existing(drone);
            this.enemies.add(drone);

            this.curEnemy++;
            if (this.curEnemy >= this.enemyArray.length) {
                this.allDeployed = true;
            }
            this.lastDeployment = Date.now();
        }
    }

    checkWinCondition() {
        if (this.allDeployed && !this.enemies.getFirstAlive()) {
            if (this.winTime) {
                if (Date.now() - this.winTime > 2000) {
                    this.game.state.start('Victory');
                }
            } else {
                this.winTime = Date.now();
            }
        }
    }

    //every bullet can kill one drone.
    checkBulletCollisions() {

        let bulletsThatCollided = Array<Phaser.Sprite>();

        //this is NOT an observer!  It fires once in the update loop.
        this.game.physics.arcade.overlap(this.projectiles, this.enemies, (bullet, sprite) => {
            if(sprite.alive && bulletsThatCollided.indexOf(bullet) == -1){
                sprite.shot();
                bulletsThatCollided.push(bullet);
                bullet.kill();
            }
        });

    }

    shutdown() {
        this.enemies.destroy();
        this.projectiles.destroy();
    }
}

export default Mission;
