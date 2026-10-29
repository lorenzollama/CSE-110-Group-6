
import Konva from "konva";
import type { Group } from "konva/lib/Group";
import { GameEngine } from "./engine/GameEngine";
import type { View } from "../../types";

export class ScrapShooterScreen implements View {
  private group = new Konva.Group();
  private gameLayer: Konva.Layer;
  private engine: GameEngine | null = null;

  constructor() {
    this.gameLayer = new Konva.Layer();
    this.gameLayer.add(this.group);
  }

  getGroup(): Group {
    return this.group;
  }

getLayer(): Konva.Layer {
  return this.gameLayer;
}

  show(): void {
    if (this.engine) return;

    this.engine = new GameEngine(this.gameLayer);
    this.group.show();
  }

  hide(): void {
    this.engine?.destroy();
    this.engine = null;
    this.group.hide();
  }
}
