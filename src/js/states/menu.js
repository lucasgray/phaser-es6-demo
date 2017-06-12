import Buttons from "../extensions/Buttons";

export default class Menu extends Phaser.State {

    create() {

        this.game.music = this.game.add.audio('futureMusic');
        this.graphics = this.game.add.graphics(0, 0);
        this.btnDownSound = this.add.sound('menuDown');

        this.title = this.game.add.text(
            this.game.world.centerX,
            this.game.world.centerY-200,
            "WAR ROOM", {
            font: '50px Joystix',
            fill: 'white',
            align: 'center'
        });
        this.title.anchor.setTo(0.5);

        if (typeof(DATA) !== "undefined") {
            this.debug = this.game.add.text(
                this.game.world.centerX,
                this.game.world.centerY-300,
                "data "+ JSON.stringify(DATA), {
                    font: '5px Joystix',
                    fill: 'white',
                    align: 'center'
                });
            this.debug.anchor.setTo(0.5);
        }

        Buttons.makeButton(
            this.game,
            this.game.world.centerX,
            this.game.world.centerY+70,
            this.game.width * 0.8,
            60,
            this.btnDownSound,
            'missions', ()=>{
                console.log("asking to start mission select!");
                this.state.start('Missions');
            }
        );

        Buttons.makeButton(
            this.game,
            this.game.world.centerX,
            this.game.world.centerY+140,
            this.game.width * .8,
            60,
            this.btnDownSound,
            'debug data', ()=>{
                console.log("going to data!");
                this.state.start('Debug');
            }
        );
    }
}
