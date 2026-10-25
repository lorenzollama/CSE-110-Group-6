import Konva from "konva";
import { STAGE_WIDTH, STAGE_HEIGHT } from "./constants.ts";

class App {
	private stage: Konva.Stage;
	private layer: Konva.Layer;

	constructor(container: string) {
		// Initialize Konva stage (the main canvas)
		this.stage = new Konva.Stage({
			container,
			width: STAGE_WIDTH,
			height: STAGE_HEIGHT,
		});

		// Create a layer (shapes and groups get added to this layer)
		this.layer = new Konva.Layer();
		this.stage.add(this.layer);

		// Draw the layer (render everything to the canvas)
		this.layer.draw();
	}
}

// Initialize the application
new App("container");
