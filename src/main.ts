import Konva from "konva";
import type { ScreenSwitcher, Screen } from "./types";
import { ScrapShooterController } from "./game/ScrapShooterController";

class App implements ScreenSwitcher {
  private stage: Konva.Stage;
  private screenLayer: Konva.Layer;
  private popupLayer: Konva.Layer;
  private gameLayer: Konva.Layer;
  private scrapShooter: ScrapShooterController;

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

    this.scrapShooter = new ScrapShooterController(this.popupLayer);
    this.gameLayer = new Konva.Layer();
    this.gameLayer.add(this.scrapShooter.getView().getGroup());
    this.gameLayer.hide();
    this.stage.add(this.gameLayer);
    this.popupLayer.moveToTop(); // popups above the game

    this.screenLayer.add(
      new Konva.Text({
        x: 20,
        y: 20,
        text: "CSE 110 Group 6 - shared skeleton",
        fontSize: 24,
        fontFamily: "Arial",
      }),
    );

    this.screenLayer.draw();

    window.addEventListener("resize", () => {
      this.stage.width(window.innerWidth);
      this.stage.height(window.innerHeight);
    });
  }

  switchToScreen(screen: Screen): void {
    this.scrapShooter.hide();
    this.gameLayer.hide();
    this.screenLayer.hide();

    switch (screen.type) {
      case "menu":
        this.screenLayer.show();
        break;

      case "game":
        this.gameLayer.show();
        this.scrapShooter.show();
        break;

      case "result":
        this.screenLayer.show();
        break;
    }

    this.stage.batchDraw();
  }
}

const app = new App("container");

// Temporary entry point for integration testing.
// The game will start automatically until menu navigation is implemented.
app.switchToScreen({ type: "game" });
