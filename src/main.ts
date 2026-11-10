import Konva from "konva";
import type { ScreenSwitcher, Screen } from "./types";
import { ScrapShooterController } from "./game/ScrapShooterController";
import { Minigame1Controller } from "./minigames/minigame1/main";
import { StartController } from "./screens/start/StartController";
import { TopicSelectController } from "./screens/topicSelect/TopicSelectController";
import { Minigame2Controller } from "./minigames/minigame2/controller.ts";
import { Game } from "./minigames/minigame2/model.ts";
import { Minigame2View } from "./minigames/minigame2/view.ts";

const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 600;

class App implements ScreenSwitcher {
  private stage: Konva.Stage;
  private screenLayer: Konva.Layer;
  private popupLayer: Konva.Layer;
  private gameLayer: Konva.Layer;
  private minigame1Layer: Konva.Layer;
  private scrapShooter: ScrapShooterController;
  private minigame1: Minigame1Controller;
  private minigame2: Minigame2Controller;
  private startController: StartController;
  private topicSelect: TopicSelectController;

  constructor(container: string) {
    this.stage = new Konva.Stage({
      container,
      width: window.innerWidth,
      height: window.innerHeight,
    });

    this.screenLayer = new Konva.Layer();
    this.popupLayer = new Konva.Layer();

    this.stage.add(this.screenLayer);
    this.stage.add(this.popupLayer);

    this.scrapShooter = new ScrapShooterController(this, this.popupLayer);
    this.gameLayer = new Konva.Layer();
    this.gameLayer.add(this.scrapShooter.getView().getGroup());

    this.minigame2 = new Minigame2Controller(new Game(), new Minigame2View());
    this.gameLayer.add(this.minigame2.getView().getGroup());
    this.minigame2.hide();
    this.gameLayer.hide();
    this.stage.add(this.gameLayer);
    this.popupLayer.moveToTop(); // popups above the game

    this.minigame1Layer = new Konva.Layer();
    this.stage.add(this.minigame1Layer);
    this.minigame1 = new Minigame1Controller(this.stage, this.minigame1Layer);

    this.screenLayer.add(
      new Konva.Text({
        x: 20,
        y: 20,
        text: "CSE 110 Group 6 - shared skeleton",
        fontSize: 24,
        fontFamily: "Arial",
      }),
    );

    this.startController = new StartController(this);
    this.screenLayer.add(this.startController.getView().getGroup());
    this.topicSelect = new TopicSelectController(this);
    this.screenLayer.add(this.topicSelect.getView().getGroup());
    this.centerScreens();
    this.screenLayer.draw();

    window.addEventListener("resize", () => {
      this.stage.width(window.innerWidth);
      this.stage.height(window.innerHeight);
      this.centerScreens();
    });
  }

  switchToScreen(screen: Screen): void {
    this.scrapShooter.hide();
    this.minigame2.hide();
    this.gameLayer.hide();
    this.screenLayer.hide();
    this.startController.hide();
    this.topicSelect.hide();
    this.minigame1.hide();

    switch (screen.type) {
      case "menu":
        this.screenLayer.show();
        this.startController.show();
        break;

      case "topic select":
        this.screenLayer.show();
        this.topicSelect.show();
        break;

      case "main game":
        this.gameLayer.show();
        this.scrapShooter.show();
        break;

      case "minigame1":
        // TODO: the minigame 1 team shows their screen here
        this.gameLayer.hide();
        this.minigame1.show();
        break;

      case "minigame2":
        this.gameLayer.show();
        this.minigame2.show();
        this.minigame2.startNewGame();
        break;

      case "result":
        this.screenLayer.show();
        this.startController.show();
        break;
    }

    this.stage.batchDraw();
  }

  /** Moves the screens to the middle of the window. */
  private centerScreens(): void {
    const offset = {
      x: Math.max(0, (this.stage.width() - SCREEN_WIDTH) / 2),
      y: Math.max(0, (this.stage.height() - SCREEN_HEIGHT) / 2),
    };
    this.screenLayer.position(offset);
    this.gameLayer.position(offset);
    this.stage.batchDraw();
  }
}

const app = new App("container");

// Open on the start screen; its buttons switch to the games.
app.switchToScreen({ type: "menu" });
