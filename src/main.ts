import Konva from "konva";
import type { ScreenSwitcher, Screen } from "./types";
import { ScrapShooterScreen } from "./game/ScrapShooterScreen";
import { StartController } from "./screens/start/StartController";

const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 600;

class App implements ScreenSwitcher {
  private stage: Konva.Stage;
  private screenLayer: Konva.Layer;
  private popupLayer: Konva.Layer;
  private scrapShooter: ScrapShooterScreen;
  private startController: StartController;

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

    this.scrapShooter = new ScrapShooterScreen();
    this.scrapShooter.getLayer().hide();
    this.stage.add(this.scrapShooter.getLayer());

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
    this.scrapShooter.getLayer().hide();
    this.screenLayer.hide();

    switch (screen.type) {
      case "menu":
        this.screenLayer.show();
        break;

      case "minigame1":
        this.scrapShooter.getLayer().show();
        this.scrapShooter.show();
        break;

      case "minigame2":
        this.screenLayer.show();
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
      this.scrapShooter.getLayer().position(offset);
      this.stage.batchDraw();
    }

}

const app = new App("container");

// Temporary entry point for integration testing.
// The game will start automatically until menu navigation is implemented.
app.switchToScreen({ type: "menu" });
app.switchToScreen({ type: "minigame1" });
app.switchToScreen({ type: "minigame2" });
