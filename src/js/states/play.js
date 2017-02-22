import * as easystar from "easystarjs";
import _ from 'lodash';
import Buttons from "../extensions/Buttons";

export default class Play extends Phaser.State {

    preload() {
        this.game.create.grid('grid', this.game.width, this.game.height, 64, 64, '#ffffff');
        this.sprites = [];

        this.graphics = this.game.add.graphics(0, 0);
    }

    create() {

        this.game.add.sprite(0,0,'grid');

        console.log('width: ' + this.game.world.width)
        console.log('height: ' + this.game.world.height)

        this.cellWidth = this.game.world.width / 10;
        this.cellHeight = this.game.world.height / 15;

        this.bulletsGroup = this.game.add.physicsGroup();
        this.spritesGroup = this.game.add.physicsGroup();
        this.spritesGroup.enableBody = true;
        this.spritesGroup.physicsBodyType = Phaser.Physics.ARCADE;

        this.game.stage.backgroundColor = 0x000000;

        this.setupGlobalListeners();

        this.setupGrid();

        this.drawHealth();

        this.drawInput();

        this.drawPlacedItems();

        this.drawEnemies();

        // this.drawInventory();

        // this.drawBase();

        //??

    }

    setupGrid() {

        //10x15 grid
        let x = 10;
        let y = 15;

        //10x15 grid to make it easy.

        var easystar = new EasyStar.js();

        var grid = [];

        Array.from(new Array(y)).forEach(() => {
            grid.push(new Array(x).fill(0));
        });

        this.game.gameData.placedItems.forEach((i) => {
           grid[i.y][i.x] = 1;
        });

        easystar.setGrid(grid);
        easystar.setAcceptableTiles([0]);
        easystar.calculate();
        easystar.enableDiagonals();
        easystar.disableCornerCutting();

        this.easystar = easystar;
    }

    drawHealth() {
        //Draw rectangles for health of enemy army
        // this.graphics.beginFill(0x00FF00);
        // this.graphics.lineStyle(2, 0x0000FF, 1);
        // this.graphics.drawRect(0, 0, 80, 1080);

        let w = this.game.world.width;
        let h = this.game.world.height;

        //Draw rectangles for health of player army
        // this.graphics.beginFill(0x00FF00);
        // this.graphics.lineStyle(2, 0x0000FF, 1);
        // this.graphics.drawRect(w-80, 0, 80, 1080);
    }

    drawInput() {
        // var wallIcon = game.add.sprite(90, 10, 'wall_icon');
        // wallIcon.scale.setTo(1,1);
        // wallIcon.inputEnabled = true;
        // wallIcon.events.onInputDown.add(wallListener, this);

        var hackIcon = this.game.add.sprite(90, 160, 'hack_icon');
        hackIcon.scale.setTo(1, 1);
        hackIcon.inputEnabled = true;
        hackIcon.events.onInputDown.add(this.hackListener, this);

        var bombIcon = this.game.add.sprite(90, 310, 'bomb_icon');
        bombIcon.scale.setTo(1, 1);
        bombIcon.inputEnabled = true;
        bombIcon.events.onInputDown.add(this.bombListener, this);
        // var iconMask = game.make.bitmapData(128,128);
        // iconMask.circle(64,64,64);
        // iconMask.alphaMask('wall_icon');
        // var wallIcon = game.add.sprite(90, 10, iconMask);
        // wallIcon.scale.setTo(.75,.75);

        this.btnDownSound = this.add.sound('menuDown');
        Buttons.makeButton(
            this.game,
            100,
            this.game.height - 40,
            100,
            20,
            this.btnDownSound,
            'back', ()=>{
                console.log("asking to go to menu");
                this.state.start('Menu');
            }
        );
    }

    drawEnemies() {

        let gameData = this.game.gameData;

        gameData.shadows.forEach((shadow) => {
            shadow.amount = 0;

            //TODO scale with levels!
            if (shadow.size === 'large') {
                shadow.total = 30;
            } else if (shadow.size === 'medium') {
                shadow.total = 15;
            } else if (shadow.size === 'small') {
                shadow.total = 5;
            }
        });

        this.baddieInterval = setInterval(() => {
            gameData.shadows.forEach((shadow) => {

                if (shadow.total >= shadow.amount) {

                    console.log("shadow "  + JSON.stringify(shadow));

                    let weight = 0;

                    if (shadow.size === 'large') {
                        weight = .7;
                    } else if (shadow.size === 'medium') {
                        weight = .4;
                    } else if (shadow.size === 'small') {
                        weight = .2;
                    }

                    let baddiesToMake = Math.floor(Math.random() / weight);

                    let baddies = [];

                    [... new Array(baddiesToMake)].map((_, i) => {
                        console.log(i);

                        //somewhere in a 500 range
                        var offset = Math.floor(Math.random() * 500) - 250;

                        let x = shadow.at + offset;

                        if (x < 0) {
                            x = 0;
                        } if (x >= this.game.width) {
                            x = this.game.width-1;
                        }

                        //center cell of cell 5 (index)
                        baddies.push(this.makeDrone(x));
                        shadow.amount = shadow.amount + baddiesToMake;
                    });

                    baddies.forEach((curSprite) => {

                        let curXCell = Math.floor((curSprite.x / 640) * 10);
                        let curYCell = Math.floor((curSprite.y / 960) * 15);

                        // console.log("where am i? " + curXCell + " , " + curYCell)

                        //640x960 find path to bottom left of the screen
                        this.easystar.findPath(curXCell, curYCell, 5, 14, (path) => {

                            if (path === null) {
                                // console.log("The path to the destination point was not found.");
                            } else {
                                // console.log("easystar success. ");

                                // path.forEach((p) => console.log(JSON.stringify(p)));
                                curSprite.path = path;
                            }
                        });
                    });
                } else {
                    // console.log("shadow " + JSON.stringify(shadow) + "done generating enemies");
                }
            });
        }, 300);

        this.pathfindingInterval = setInterval(() => {
            this.checkPathfinding();
        }, 300);
    }

    checkPathfinding() {
        if (this.sprites) {

            this.sprites.forEach((sprite) => {

                if (!sprite.lastMove && !sprite.dead) {

                    //if we're in the process of moving from loc a to b, keep going
                    //otherwise prep the next step

                    var path = sprite.path;

                    if (!sprite.path) return;

                    var first = path[0];
                    var second = path[1];

                    //negative is left, positive is right.
                    var xDirection = second.x - first.x;

                    //second.y * 64 to convert to cells
                    if (sprite.body.y >= (second.y * 64)
                    ) {
                        // console.log("we made it! altering path");

                        path = path.slice(1);
                        sprite.path = path;

                        first = path[0];
                        second = path[1];
                    }

                    //we want to move towards the CENTER of the next cell.. plus a little randomness
                    let xToGo = (second.x * 64 + 32) + (Math.random() * 20);
                    let yToGo = (second.y * 64 + 32) + (Math.random() * 20);


                    let velocity = sprite.randomVelocity;

                    if (yToGo >= this.game.height - 64) {
                        sprite.lastMove = true;
                        console.log("last move. moving to " + xToGo + "," + this.game.height)
                        this.game.physics.arcade.moveToXY(sprite, xToGo, this.game.height, velocity);
                    }

                    // console.log("moving to " + xToGo + "," + yToGo)
                    this.game.physics.arcade.moveToXY(sprite, xToGo, yToGo, velocity);
                } else {
                    // console.log('lastmoved.')
                }
            });
        }
    }

    drawPlacedItems() {
        let gameData = this.game.gameData;

        let turrets = gameData.placedItems.filter((it) => it.type === 'turret');
        let walls = gameData.placedItems.filter((it) => it.type === 'wall');

        walls.forEach((it) => this.makeWall(it.x * this.cellWidth, it.y * this.cellHeight));

        this.turretIntervals = [];
        turrets.forEach((it) => this.makeTurret(it.x * this.cellWidth, it.y * this.cellHeight));

    }

    makeDrone(where) {
        let sprite = this.spritesGroup.create(where, 0, 'drone');
        sprite.animations.add('fly');
        sprite.animations.play('fly', 30, true);
        sprite.scale.setTo(.25, .25);
        sprite.anchor.setTo(.5, .5);
        sprite.inputEnabled = true;
        sprite.events.onInputDown.add(() => {
            if (this.inputMode === 'hack') {
                this.killSprite(sprite);
            }
        }, this);

        sprite.randomVelocity = 50 + (Math.random() * 30);

        this.game.physics.enable(sprite, Phaser.Physics.ARCADE);

        this.sprites.push(sprite);

        return sprite;
    }

    makeTurret(x, y) {
        this.graphics.lineStyle(2, 0x00FF00, 1);
        this.graphics.drawRect(x, y, 64, 64);

        let center = {x: x + 32, y: y + 32};

        this.turretIntervals.push(setInterval(() => {

            let turretX = x;
            let turretY = y;

            let spriteDistances = this.sprites.map((sprite) => {
                return {
                    distance: Math.abs(sprite.x - center.x) + Math.abs(sprite.y - center.y),
                    sprite: sprite
                }
            });

            let spritesInRange = spriteDistances.filter(s => !s.sprite.dead && s.distance <= 300);

            let rslt = _.minBy(spritesInRange, (s) => s.distance);

            if (rslt) {
                this.shootBulletFromTo(turretX, turretY, rslt.sprite);
            }
        }, 1000));

    }

    shootBulletFromTo(x, y, sprite) {

        //TODO properly figure out where that sprite was going
        let fudge = 50;

        let bullet = this.game.add.sprite(x, y, 'bullet');
        this.game.physics.arcade.enable(bullet);
        this.bulletsGroup.add(bullet);

        this.game.physics.arcade.moveToXY(bullet, sprite.x, sprite.y+fudge, 300);
    }

    makeWall(x, y) {
        this.graphics.lineStyle(2, 0x0000FF, 1);
        this.graphics.drawRect(x, y, 64, 64);
    }

    hackListener() {
        console.log('hack!');
        this.inputMode = 'hack';
    }

    bombListener() {
        console.log('bomb!');
        this.inputMode = 'bomb';
    }

    setupGlobalListeners() {
        this.game.input.onTap.add((pointer, doubleTap) => {
            if (this.inputMode === 'bomb') {

                let explosion = this.game.add.sprite(pointer.position.x, pointer.position.y, 'explosion');
                explosion.anchor.setTo(.5, .5);
                let explosionAnimation = explosion.animations.add('fly');
                explosion.animations.play('fly', 30, false);

                this.sprites.forEach((sprite) => {

                    let dist = Math.sqrt((Math.abs(sprite.position.y - pointer.position.y) * Math.abs(sprite.position.y - pointer.position.y)) + (Math.abs(sprite.position.x - pointer.position.x) * Math.abs(sprite.position.x - pointer.position.x)));

                    //FIXME
                    //for now we just kills em
                    if (dist <= 50) {
                        this.killSprite(sprite);
                    }
                });

                explosionAnimation.onComplete.add(() => {
                    explosion.destroy();
                });
            }
        }, this);

    }

    killSprite(sprite) {
        sprite.dead = true;

        this.game.add.tween(sprite).to({angle: 360}, 1500, Phaser.Easing.Linear.None, true, 0, 0, false);
        var fall = this.game.add.tween(sprite.scale).to({
            x: 0,
            y: 0
        }, 1500, Phaser.Easing.Linear.None, true, 0, 0, false);
        fall.onComplete.add(() => {
            let explosion = this.game.add.sprite(sprite.x, sprite.y, 'explosion');
            explosion.anchor.setTo(.2, .2);
            explosion.scale.setTo(.2, .2);
            let explosionAnimation = explosion.animations.add('fly');
            explosion.animations.play('fly', 30, false);
            sprite.destroy();
            explosionAnimation.onComplete.add(() => {
                explosion.destroy();
            })
        });
    }

    update() {
        this.game.physics.arcade.overlap(this.bulletsGroup, this.spritesGroup, (bullet, sprite) => {
            // console.log("BULLET COLLISION!");
            this.killSprite(sprite);
            bullet.kill();
        }, null, this);

        this.easystar.calculate();
        this.cleanUp();
    }

    cleanUp() {
        this.bulletsGroup.forEachDead((i) => i.destroy())
    }

    shutdown() {
        console.log("shut down called")

        this.turretIntervals.forEach((it) => clearInterval(it));
        clearInterval(this.baddieInterval);
        clearInterval(this.pathfindingInterval);
    }
}