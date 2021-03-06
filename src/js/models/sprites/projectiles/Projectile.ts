
import GridDescriptor from "../../state/GridDescriptor";

abstract class Projectile extends Phaser.Sprite {

    fromX: number;
    fromY: number;
    toSprite: Phaser.Sprite;
    scaleFactor: number = 1;
    projectileExplosionGroup: Phaser.Group;

    abstract range: number;
    abstract speed: number;
    abstract defaultWidth: number;
    abstract defaultHeight: number;
    abstract shootSound: string;
    abstract damageAmount: number;

    constructor(game: Phaser.Game, fromX: number, fromY: number, toSprite: Phaser.Sprite, texture: string, projectileExplosionGroup: Phaser.Group) {

        super(game, fromX, fromY, texture);

        this.fromX = fromX;
        this.fromY = fromY;
        this.toSprite = toSprite;
        this.projectileExplosionGroup = projectileExplosionGroup;
    }

    paint(gridDescriptor: GridDescriptor) {

        let defaultSize = {width: this.defaultWidth, height: this.defaultHeight};
        let scaleX = (gridDescriptor.cellWidth / defaultSize.width) * this.scaleFactor;
        let scaleY = (gridDescriptor.cellHeight / defaultSize.height) * this.scaleFactor;
        this.scale.setTo(scaleX, scaleY);

        this.animations.add('bullet');
        this.animations.play('bullet', 8, false);

        this.anchor.setTo(0.5);
        this.game.physics.arcade.enable(this);

        let halfXVelocity = this.toSprite.body.velocity.x / 2;
        let halfYVelocity = this.toSprite.body.velocity.y / 2;

        let toX = this.toSprite.x + halfXVelocity;
        let toY = this.toSprite.y + halfYVelocity;

        this.angle = Phaser.Math.radToDeg(this.game.physics.arcade.moveToXY(this, toX, toY, this.speed)) + 90;

        // let shootAudio = this.game.add.audio(this.shootSound);
        // shootAudio.play();

        this.checkWorldBounds = true;
        this.outOfBoundsKill = true;
    }

    /**
     * Cull if the projectile gets too far away from the base.
     * Note: Bullet + Sprite collisions are currently handled by the Mission
     */
    // update() {
        // if (Phaser.Math.distance(this.x, this.y, this.fromX, this.fromY) > this.range) {
        //     this.kill();
        // }
    // }

    abstract playShotFx(): void
}

export default Projectile;



