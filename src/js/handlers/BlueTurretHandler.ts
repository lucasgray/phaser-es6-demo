import BlueTurret from "../models/sprites/turrets/BlueTurret";
import Mission from "../missions/Mission";
import {GameState} from "../models/state/GameData";
import InputHandler from "./InputHandler";

export default class BlueTurretHandler extends InputHandler {

    icon: string = 'blue-turret';
    lootType: string = 'Blue-Turret';
    spriteScaling: number = 1;

    constructor(mission: Mission,
                gameState: GameState,
                allHandlers: Array<InputHandler>,
                backgroundSprite: Phaser.Sprite,
                game: Phaser.Game,
                x: number,
                y: number) {

        super(mission, gameState, allHandlers, backgroundSprite, game, x, y);

        super.paint();
    }

    action(sprite: Phaser.Sprite, pointer: Phaser.Pointer) {

        let grid = this.mission.gridDescriptor.getGridLocation(pointer);

        //check if currently there is a turret there.
        //if so, were we closer to the top/down/left/right of current,
        //and is there a problem placing there?
        //if not, use one of those

        //make turret
        let turret = new BlueTurret(this.mission, this.game, grid.x, grid.y);
        this.game.add.existing(turret);

        this.gameState.placeItem(this.lootType, this.mission.name, grid.x, grid.y);
        this.text.setText(this.num());

        let place = this.game.add.audio('place-item');
        place.play();
    }
}
