import Konva from "konva";
import type { View } from "../../types.ts";
export const STAGE_WIDTH = 800;
export const STAGE_HEIGHT = 600;
/**
 * Start screen VIEW: draws the start screen with Konva.
 * It shows what it's told and decides nothing. When a button is clicked,
 * it only reports the click; the controller decides what happens.
 */
export class StartView implements View {
  private group = new Konva.Group();

  constructor(onStartClick: () => void) {
    // TODO: add a background and a title to this.group
    this.group = new Konva.Group({visible:true})

    // Title text
		const title = new Konva.Text({
			x: STAGE_WIDTH / 2,
			y: 150,
			text: "Games",
			fontSize: 48,
			fontFamily: "Arial",
			fill: "purple",
			stroke: "purple",
			strokeWidth: 2,
			align: "center",
		});
    title.offsetX(title.width() / 2);
		this.group.add(title);
    // TODO (later): one button per button in the model, reusing makeButton from PopupView
    const mainButtonGroup = new Konva.Group();
    const mainButton = new Konva.Rect({
      x: STAGE_WIDTH / 2 - 100,
			y: 300,
			width: 200,
			height: 60,
			fill: "green",
			cornerRadius: 10,
			stroke: "darkgreen",
			strokeWidth: 3,
		});
  	const startText = new Konva.Text({
			x: STAGE_WIDTH / 2,
			y: 315,
			text: "MAIN GAME",
			fontSize: 24,
			fontFamily: "Arial",
			fill: "white",
			align: "center",
		});
		startText.offsetX(startText.width() / 2);
		mainButtonGroup.add(mainButton);
		mainButtonGroup.add(startText);
		mainButtonGroup.on("click", onStartClick);
		this.group.add(mainButtonGroup);

    const m1ButtonGroup = new Konva.Group();
    const m1Button = new Konva.Rect({
      x: STAGE_WIDTH / 25,
			y: 300,
			width: 200,
			height: 60,
			fill: "blue",
			cornerRadius: 10,
			stroke: "darkgreen",
			strokeWidth: 3,
		});
  	const m1Text = new Konva.Text({
			x: STAGE_WIDTH / 6,
			y: 315,
			text: "MINI GAME 1",
			fontSize: 24,
			fontFamily: "Arial",
			fill: "white",
			align: "center",
		});
		m1Text.offsetX(m1Text.width() / 2);
		m1ButtonGroup.add(m1Button);
		m1ButtonGroup.add(m1Text);
		// TODO: the minigame 1 team connects this button to their game
		this.group.add(m1ButtonGroup);

    const m2ButtonGroup = new Konva.Group();
    const m2Button = new Konva.Rect({
      x: STAGE_WIDTH / 1.4,
			y: 300,
			width: 200,
			height: 60,
			fill: "black",
			cornerRadius: 10,
			stroke: "darkgreen",
			strokeWidth: 3,
		});
  	const m2Text = new Konva.Text({
			x: STAGE_WIDTH / 1.19,
			y: 315,
			text: "MINI GAME 2",
			fontSize: 24,
			fontFamily: "Arial",
			fill: "white",
			align: "center",
		});
		m2Text.offsetX(m2Text.width() / 2);
		m2ButtonGroup.add(m2Button);
		m2ButtonGroup.add(m2Text);
		// TODO: the minigame 2 team connects this button to their game
		this.group.add(m2ButtonGroup);
	}

  

 

  show(): void {
    // TODO
    this.group.visible(true);
    this.group.getLayer()?.draw();
  }

  hide(): void {
    // TODO
    this.group.visible(false);
      this.group.getLayer()?.draw();
  }
   getGroup(): Konva.Group {
    // TODO
    return this.group;
  }
}
