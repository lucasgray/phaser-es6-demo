import Mission from "../../../missions/Mission";
import * as _ from 'lodash';
import PercentBar from "./PercentBar";
import Projectile from "../projectiles/Projectile";
import {AutoShot} from "../projectiles/Projectiles";
import {Targetable, WeaponSystem} from "../../state/WeaponSystem";
import DeathSequences from "../../../effects/DeathSequences";

export abstract class Enemy extends Phaser.Sprite implements Targetable {

    mission: Mission;

    abstract defaultWidth : number;
    abstract defaultHeight: number;
    abstract animationFrameRate: number;
    abstract rotatingSprite: boolean;

    scaleFactor = 1;

    randomVelocity: number;

    targetable: boolean;

    healthBar: PercentBar;
    explodeSound: () => Phaser.Sound;

    weaponSystem: WeaponSystem;
    deathSequences: DeathSequences;

    abstract range: number;
    abstract fireRate: number;

    constructor(game: Phaser.Game, mission: Mission, texture: string, speed: number) {
        super(game, 0, 0, texture);

        this.game.physics.enable(this, Phaser.Physics.ARCADE);

        this.mission = mission;

        this.randomVelocity =  speed + (Math.random() * (speed * .4));
        this.targetable = true;

        this.deathSequences = new DeathSequences(this, this.mission);

        this.explodeSound = () => {

            let sound;
            if (Math.random() > .5) {
                sound = game.add.audio('crash-1');
            } else {
                sound = game.add.audio('crash-2');
            }

            return sound;
        };
    }

    makeWeaponSystem() {
        this.weaponSystem = new WeaponSystem(this, this.mission, this.range, this.fireRate, this.mission.turrets, this.mission.enemyProjectiles, this.shoot);
    }

    paint(mission: Mission, row: number, col: number) {
        //get the right cell, then place into center of cell
        this.x = (row * mission.gridDescriptor.cellWidth) + (mission.gridDescriptor.cellWidth / 2);
        this.y = (col * mission.gridDescriptor.cellHeight) + (mission.gridDescriptor.cellHeight / 2);

        let defaultSize = {width: this.defaultWidth, height: this.defaultHeight};
        let scaleX = (this.mission.gridDescriptor.cellWidth / defaultSize.width) * this.scaleFactor;
        let scaleY = (this.mission.gridDescriptor.cellHeight / defaultSize.height) * this.scaleFactor;

        if (this.animationFrameRate != -1) {
            this.animations.add('move');
            this.animations.play('move', this.animationFrameRate, true);
        }
        this.scale.setTo(scaleX, scaleY);
        this.anchor.setTo(0.5, 0.5);

        if (this.rotatingSprite) {
            // default to immediately south
            this.angle = 180;
        }
    }

    addHealthbar(health: number) {
        this.health = health;
        this.maxHealth = health;
        //health bar starts off on top?
        this.healthBar = this.game.add.existing(new PercentBar(this.game, this, this, 5, this.scaleFactor, Phaser.TOP_LEFT));
    }

    shot(by: Projectile) {
        this.damage(by.damageAmount);
        by.playShotFx();
    }

    kill() {
        this.healthBar.hide();
        this.healthBar.destroy();
        this.explodeSound().play();
        this.targetable = false;
        this.alive = false;

        return this;
    }

    update() {
        super.update();
        this.weaponSystem.update();
    }

    shoot = (to: Targetable, mission: Mission) => {
        let bullet = mission.enemyProjectiles.getFirstDead(true);

        if (bullet) {
            bullet.reset(this.x, this.y);
            bullet.fromX = this.x;
            bullet.fromY = this.y;
            bullet.angle = this.angle;
            bullet.toSprite = to;
            bullet.gridDescriptor = mission.gridDescriptor;
            bullet.paint(mission.gridDescriptor);
            return bullet;
        } else {
            return new AutoShot(
                this.game,
                this.x,
                this.y,
                to,
                mission.gridDescriptor,
                mission.projectileExplosions
            );
        }
    };

    handleTurretKilled() {}
}

enum PathfindingMode { OpenPath, ClosedPath }

/**
 * Pathfinding enemy will operate in pure A* if there is an open path to the destination
 * After pathfindToBase is called, we'll periodically march towards our destination, shooting
 * as we go.
 *
 * If there is a CLOSED path to the destination, we try to pathfind again, as if the turrets don't exist.
 * When this happens, we switch the pathfindingMode which is very important.  If we're in "ClosedPath"
 * pathfinding mode, we stop the moment a turret is in range and keep shooting at it until that is
 * no longer true.
 *
 * When a turret dies, we should try to reset pathfinding to see if we can change modes back.
 */
export abstract class PathfindingEnemy extends Enemy {

    lastCalculation: number;

    pathfindingMode: PathfindingMode;

    pathToBase: {x: number; y: number, seen: boolean}[];

    constructor(game: Phaser.Game, mission: Mission, texture: string, speed: number) {
        super(game, mission, texture, speed);


        this.lastCalculation = 0;
    }

    update() {
        super.update();
        this.doPathfinding();
    }

    pathfindToBase(mission: Mission, row: number, col: number) {

        //TODO base doesnt need to be in center bottom of map

        var toGoX = Math.floor(mission.gridDescriptor.rows / 2);
        var toGoY = Math.floor(mission.gridDescriptor.columns - 1);

        this.mission.totalGrid.findPath(row, col, toGoX, toGoY, (path) => {
            if (!path) {
                console.log("The path to the base is blocked.  Going into closed path mode");

                this.mission.passableTerrainGrid.findPath(row, col, toGoX, toGoY, (closedPath) => {
                    console.log("closed path success. ");
                    // path.forEach((p) => console.log(JSON.stringify(p)));
                    this.pathfindingMode = PathfindingMode.ClosedPath;
                    this.pathToBase = closedPath.map(i => { return {...i, seen: false}});
                });
            } else {
                console.log("open path success. ");
                // path.forEach((p) => console.log(JSON.stringify(p)));
                this.pathfindingMode = PathfindingMode.OpenPath;
                this.pathToBase = path.map(i => { return {...i, seen: false}});
            }
            this.lastCalculation = Date.now();
        });
    }

    doPathfinding() {
        if (this.alive && this.targetable
            && this.pathToBase && this.pathToBase.length > 0
            && _.some(this.pathToBase, _ => !_.seen)) {

            if (this.pathfindingMode === PathfindingMode.OpenPath) {
                this.doOpenPathPathfinding();
            } else {
                this.doClosedPathPathfinding();
            }
        }
    }

    doOpenPathPathfinding() {
        //if we're in the process of moving from loc a to b, keep going
        //otherwise prep the next step

        let cur = this.pathToBase.filter(_ => !_.seen)[0];

        if (cur) {

            //we want to move towards the CENTER of the next cell..
            let xToGo = cur.x * this.mission.gridDescriptor.cellWidth + Math.floor(this.mission.gridDescriptor.cellWidth / 2);
            let yToGo = cur.y * this.mission.gridDescriptor.cellHeight + Math.floor(this.mission.gridDescriptor.cellHeight / 2);

            //have we made it yet, or are we going for the first time?
            if (_.every(this.pathToBase, _ => !_.seen) || Phaser.Math.distance(this.x, this.y, xToGo, yToGo) < 10) {
                console.log('got to next!');
                cur.seen = true;
                let next = this.pathToBase.filter(_ => !_.seen)[0];

                if (next) {
                    xToGo = next.x * this.mission.gridDescriptor.cellWidth + Math.floor(this.mission.gridDescriptor.cellWidth / 2);
                    yToGo = next.y * this.mission.gridDescriptor.cellHeight + Math.floor(this.mission.gridDescriptor.cellHeight / 2);

                    let a = this.game.physics.arcade.moveToXY(this, xToGo, yToGo, this.randomVelocity);

                    if (this.rotatingSprite) {
                        let b = Phaser.Math.getShortestAngle(this.angle, Phaser.Math.radToDeg(a) + 90);
                        this.game.add.tween(this).to({angle: this.angle + b}, 200, Phaser.Easing.Linear.None, true, 0, 0, false);
                    }
                }
            }
        }
    }

    doClosedPathPathfinding() {
        //do basically open path, unless we're have just entered the range of a turret!

        if (this.pathToBase.length > 0 && _.some(this.pathToBase, _ => !_.seen)) {

            let closest = this.mission.turrets.getClosestTo(this);

            if (closest && closest.alive && Phaser.Math.distance(this.x, this.y, closest.x, closest.y) < this.range) {
                this.pathToBase = []; //we're done!!
            } else {
                this.doOpenPathPathfinding();
            }
        }
    }

    handleTurretKilled() {
        this.pathToBase = [];
        var whereImAt = this.mission.gridDescriptor.getGridLocation({x:this.x, y:this.y});
        this.pathfindToBase(this.mission, whereImAt.x, whereImAt.y);
    }
}

export abstract class FlyingEnemy extends Enemy {

    rotatingSprite: boolean = true;

    constructor(game: Phaser.Game, mission: Mission, texture: string, speed: number) {
        super(game, mission, texture, speed);
    }

    flyTowardsBase() {

        //TODO base could be anywhere
        let xToGo = ((this.mission.gridDescriptor.rows / 2) * this.mission.gridDescriptor.cellWidth)
            + (this.mission.gridDescriptor.cellWidth / 2);
        let yToGo = ((this.mission.gridDescriptor.columns - 1) * this.mission.gridDescriptor.cellHeight)
            + (this.mission.gridDescriptor.cellHeight / 2);

        let a = this.game.physics.arcade.moveToXY(this, xToGo, yToGo, this.randomVelocity);

        let b = Phaser.Math.getShortestAngle(this.angle, Phaser.Math.radToDeg(a) + 90);
        this.game.add.tween(this).to({angle: this.angle + b}, 200, Phaser.Easing.Linear.None, true, 0, 0, false);
    }

}
