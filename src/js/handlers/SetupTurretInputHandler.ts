
import InputHandler from "./InputHandler";
import SetupTurret from "../models/sprites/turrets/setup/SetupTurret";
import * as _ from 'lodash';
import Turret from "../models/sprites/turrets/Turret";
import {GameState} from "../models/state/GameData";
import Mission from "../missions/Mission";

export default abstract class SetupTurretInputHandler extends InputHandler {

    abstract spawnSetupTurret: (grid: {x: number, y: number}) => SetupTurret;

    protected constructor(mission: Mission,
                gameState: GameState,
                allHandlers: InputHandler[],
                backgroundSprite: Phaser.Sprite,
                game: Phaser.Game,
                x: number,
                y: number) {
        super(mission, gameState, allHandlers, [backgroundSprite], game, x, y);
    }

    inputListener() {
        super.inputListener();
    }

     /**
     * The action performed if you choose this handler and click on the background!
     *
     * @param pointer
     * @param sprite
     */
    action(sprite: Phaser.Sprite, pointer: Phaser.Pointer) {

        let loot = _.find(this.gameState.inventoryItems, i => i.type === this.lootType);
        let grid = this.mission.gridDescriptor.getGridLocation(pointer);

        if (loot !== undefined && loot.amount > 0 &&
            this.mission.gridDescriptor.placeableTerrain[grid.y][grid.x] === 0
            && !this.mission.turrets.all().some(t => t.row === grid.x && t.col === grid.y)
        ) {

            let turret = this.spawnSetupTurret(grid);
            this.game.add.existing(turret);
            this.mission.turrets.add(turret);
            this.mission.doodads.add(turret.base);

            this.gameState.placeItem(this.lootType, grid.x, grid.y);
            this.updateText();

            let place = this.game.add.audio('place-item');
            place.play();
        } else {
            let cantplace = this.game.add.audio('wrong-choice');
            cantplace.play();
        }
    }

}
