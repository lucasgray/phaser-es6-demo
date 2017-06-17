import InputHandler from './InputHandler';

export default class GrenadeHandler extends InputHandler {
    constructor(game, x, y) {
        super(game);

        var graphics = game.add.graphics(x, y);
        graphics.beginFill(0xffffff, 1);
        graphics.lineStyle(3, 0xF1235B);
        graphics.drawCircle(0, 0, 60);

        var parentSprite = game.add.sprite(x, y, graphics.generateTexture());
        parentSprite.anchor.set(.5);
        graphics.destroy();

        var grenadeIcon = game.add.sprite(0, 0, 'grenade_icon');
        grenadeIcon.anchor.set(0.5);
        grenadeIcon.scale.setTo(.25, .25);

        parentSprite.addChild(grenadeIcon);

        var graphics = game.add.graphics(x, y);
        graphics.beginFill(0xffffff, 1);
        graphics.lineStyle(3, 0xF1235B);
        graphics.drawCircle(0, 0, 25);

        var itemSprite = game.add.sprite(0, 0, graphics.generateTexture());
        graphics.destroy();
        itemSprite.anchor.set(.5);
        parentSprite.addChild(itemSprite);
        itemSprite.alignInParent(Phaser.BOTTOM_RIGHT);

        var text = game.add.text(0, 0, this.num(), {
            font: '12px Joystix',
            fill: "#F1235B",
            align: "center"
        });
        text.anchor.set(.5);
        itemSprite.addChild(text);

        parentSprite.inputEnabled = true;
        parentSprite.events.onInputDown.add(this.inputListener, parentSprite);

        parentSprite.inputListener = this.inputListener;
        parentSprite.action = this.action;
        parentSprite.text = text;
        parentSprite.num = this.num;
    }

    update() {
    }

    inputListener() {
        this.firstEvent = true;
        this.game.input.onTap.removeAll();
        if (this.game.activeInputHandler) {
            this.game.add.tween(this.game.activeInputHandler.scale)
                .to({ x: 1.0, y: 1.0}, 200, Phaser.Easing.Exponential.In).start();
        }
        this.game.input.onTap.add(this.action, this);
        this.game.add.tween(this.scale).to({ x: 1.2, y: 1.2}, 600, Phaser.Easing.Bounce.Out).start();
        this.game.activeInputHandler = this;
    }

    action(pointer, doubleTap, sprite) {
        if (this.firstEvent) {
            this.firstEvent = false;
            this.game.activeInputHandler = this;
            return;
        }
        if (sprite && sprite.alive) {
            sprite.shot();
            let hack = this.game.add.sprite(sprite.x, sprite.y, 'hack');
            hack.anchor.setTo(0.5, 0.5);
            hack.scale.setTo(0.6, 0.6);
            let hackAnimation = hack.animations.add('fly');
            hack.animations.play('fly', 30, false);
            hackAnimation.onComplete.add(() => {
                hack.destroy();
            });

            this.game.dao.useItem("Grenade");
            this.text.setText(this.num());
        }
    }

    num() {
        let grenades = this.game.gameData.inventoryItems.find(it => it.type === 'grenade');

        if (grenades) {
            return grenades.amount + "";
        } else {
            return "0";
        }
    }

}