import Preload from "./Preload";
import * as Phaser from 'phaser-ce';


export default class Boot extends Phaser.State {

    constructor() {
        super();
    }

    preload() {
        this.game.stage.backgroundColor = '#000';
        this.load.image('loaderBg', require('../../img/loader-bg.png'));
        this.load.image('loaderBar', require('../../img/loader-bar.png'));
    }

    create() {

        this.game.physics.startSystem(Phaser.Physics.ARCADE);

        this.game.scale.scaleMode = Phaser.ScaleManager.EXACT_FIT;

        this.game.state.add('Preload', new Preload());
        this.state.start('Preload');
    }
}
