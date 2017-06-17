import * as easystar from "easystarjs";
import Buttons from "../extensions/Buttons";
import * as gameObjects from "../objects";

export default class Setup extends Phaser.State {

    preload() {
    }

    create() {

        this.objects = [];
        this.game.enemies = this.game.add.physicsGroup();

        this.game.add.sprite(this.game.mission.gridSize.offsetX,0,'grid');
        this.btnDownSound = this.add.sound('menuDown');

        this.game.stage.backgroundColor = 0x000000;

        console.log(this.game.gameData.placedItems);
        this.game.gameData.placedItems.filter(it => it.mission === this.game.mission.constructor.name).forEach((it) => {
          new gameObjects[it.type](this.game, (this.game.mission.gridSize.offsetX + (it.x * this.game.mission.gridSize.cellWidth)), it.y * this.game.mission.gridSize.cellHeight, [this.objects]);
        });

        this.drawInputs();
    }

    drawInputs() {
        var turret = new gameObjects["Turret"](this.game, 0, 0, [this.objects]);
        turret.events.onInputDown.add((sprite, pointer) => {
          this.curTurret = new gameObjects["Turret"](this.game, pointer.x, pointer.y, [this.objects]);
        }, this);
        turret.gun.events.onInputDown.add((sprite, pointer) => {
          this.curTurret = new gameObjects["Turret"](this.game, pointer.x, pointer.y, [this.objects]);
        }, this);
        this.drawColor(0x0000FF, 0, 64, () => {
            this.curWall = this.drawColor(0x0000FF, this.game.input.x - (this.game.mission.gridSize.cellWidth / 2), this.game.input.y - (this.game.mission.gridSize.cellheight * 1.5));
        });

        Buttons.makeButton(
            this.game,
            100,
            this.game.height - 40,
            100,
            30,
            this.btnDownSound,
            'Back', ()=>{
                console.log("asking to go back");
                this.state.start('Missions');
            }
        );

        Buttons.makeButton(
            this.game,
            this.game.width - 80,
            this.game.height - 40,
            100,
            30,
            this.btnDownSound,
            'Defend', ()=>{
                console.log("asking to defend");
                this.state.start('Play');
            }
        );
    }

    drawColor(color, x, y, callback) {
        var g = this.game.add.graphics(0, 0);
        g.lineStyle(2, color, 0.5);
        g.beginFill(color, 1);
        g.drawRect(x, y, this.game.mission.gridSize.cellWidth, this.game.mission.gridSize.cellHeight); //no anchor, need to move it!
        g.endFill();

        g.inputEnabled = true;

        if (callback) {
            g.events.onInputDown.add(callback, this.game);
        }

        return g;
    }

    update() {

        if (this.game.input.activePointer.isDown)
        {
          console.log('moving turret');
          console.log(this.curTurret);
            if (this.curTurret) {
                this.curTurret.x = this.game.input.x;
                this.curTurret.y = this.game.input.y;
            } else if (this.curWall) {
                this.curWall.x = this.game.input.x - (this.game.mission.gridSize.cellWidth / 2);
                this.curWall.y = this.game.input.y - (this.game.mission.gridSize.cellWidth / 2);
            }
        } else {
            if (this.curTurret) {

                console.log("placing turret!");
                this.curTurret.destroy();
                this.curTurret = null;

                let gridLoc = this.getGridLocation(this.game.input);

                this.game.dao.placeItem('Turret',  this.game.mission.constructor.name, gridLoc.x, gridLoc.y);

                new gameObjects["Turret"](this.game, (this.game.mission.gridSize.offsetX + (gridLoc.x * this.game.mission.gridSize.cellWidth)), gridLoc.y * this.game.mission.gridSize.cellHeight, [this.objects]);

            } else if (this.curWall) {
                console.log("placing wall!");
                this.curWall.destroy();
                this.curWall = null;

                let gridLoc = this.getGridLocation(this.game.input);

                this.game.dao.placeItem('Wall',  this.game.mission.constructor.name, gridLoc.x, gridLoc.y);

                new gameObjects["Wall"](this.game, (this.game.mission.gridSize.offsetX + (gridLoc.x * this.game.mission.gridSize.cellWidth)), gridLoc.y * this.game.mission.gridSize.cellHeight, [this.objects]);
            }
        }

    }

    getGridLocation(input){
      let gridX = Math.floor((input.x - this.game.mission.gridSize.offsetX)/ this.game.mission.gridSize.cellWidth);
      if(gridX < 0){
        gridX = 0;
      }
      if(gridX >= this.game.mission.gridSize.x){
        gridX = this.game.mission.gridSize.x-1;
      }
      let gridY = Math.floor(input.y / this.game.mission.gridSize.cellHeight);
      if(gridY < 0){
        gridY = 0;
      }
      if(gridY >= this.game.mission.gridSize.y){
        gridY = this.game.mission.gridSize.y -1;
      }
      return {x: gridX, y: gridY};
    }
}
