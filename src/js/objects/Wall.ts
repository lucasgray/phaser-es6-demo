
export default class Wall extends Phaser.Sprite {

    constructor(game, x, y) {
        super(game, x, y);
        var g = game.add.graphics(0, 0);
        g.lineStyle(2, 0x0000FF, 0.5);
        g.beginFill(0x0000FF, 1);
        g.drawRect(x, y, game.mission.gridSize.cellWidth, game.mission.gridSize.cellHeight); //no anchor, need to move it!
        g.endFill();
        g.inputEnabled = true;
        // this.addToGroup(groups);
    }
}
