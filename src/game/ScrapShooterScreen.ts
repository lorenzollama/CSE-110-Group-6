
import Konva from "konva";
import { GameEngine } from "./engine/GameEngine";
import type { View } from "../types";
import type { Group } from "konva/lib/Group";

export class ScrapShooterScreen implements View {
  private gameLayer: Konva.Layer;
  private engine: GameEngine | null = null;

  constructor() {
    this.gameLayer = new Konva.Layer();
  }

  getGroup(): Group {
    return this.gameLayer as unknown as Group;
  }

  getLayer(): Konva.Layer {
    return this.gameLayer;
  }

  show(): void {
    if (this.engine) return;
    this.gameLayer.show();
    this.engine = new GameEngine(this.gameLayer);
  }

  hide(): void {
    this.engine?.destroy();
    this.engine = null;
    this.gameLayer.hide();
  }
}
