import type Konva from 'konva';
import { getHighScore, submitHighScore } from '../api/highScore';
import { type PopupHandle, showLevelComplete } from '../popups/popups';
import { ScreenController } from '../types';
import { ScrapShooterModel } from './ScrapShooterModel';
import { ScrapShooterView } from './ScrapShooterView';

/**
 * Scraps sit on screen and the first one in the list is the target. Type its answer
 * and press Enter. Right: the ship shoots it and a new scrap takes its place.
 * Wrong: the input box border thickens briefly.
 */
export class ScrapShooterController extends ScreenController {
  private view = new ScrapShooterView();
  private model: ScrapShooterModel | null = null;
  private popup: PopupHandle | null = null;

  constructor(private popupLayer: Konva.Layer) {
    super();
  }

  getView(): ScrapShooterView {
    return this.view;
  }

  show(): void {
    if (this.model) return;
    this.view.show();
    const model = new ScrapShooterModel();
    this.model = model;

    this.view.build();
    model.getScraps().forEach(scrap => this.view.addScrap(scrap));
    this.view.highlightTarget(model.getScraps());
    this.view.showTyped(model.getTyped());

    window.addEventListener('keydown', this.onKeyDown);

    getHighScore()
      .then(highScore => {
        if (this.model === model) this.view.showHighScore(highScore); // skip if the game was left meanwhile
      })
      .catch(err => console.warn('Could not load high score', err));
  }

  hide(): void {
    this.popup?.close();
    this.popup = null;
    window.removeEventListener('keydown', this.onKeyDown);
    this.view.destroy();
    this.model = null;
    this.view.hide();
  }

  // --------------------------------------------------------------- input

  private onKeyDown = (e: KeyboardEvent): void => {
    if (!this.model) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      this.model.typeDigit(e.key);
      this.view.showTyped(this.model.getTyped());
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      this.model.backspace();
      this.view.showTyped(this.model.getTyped());
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (!e.repeat) this.submit(this.model);
    }
  };

  private submit(model: ScrapShooterModel): void {
    const result = model.submit();
    if (result.type === 'ignored') return;
    this.view.showTyped(model.getTyped());

    if (result.type === 'correct') {
      this.view.shoot(result.hit.slot);
      this.view.removeScrap(result.hit.slot);
      this.view.addScrap(result.spawned);
      this.view.highlightTarget(model.getScraps());
    } else {
      this.view.flashWrong();
    }

    if (model.isOver()) this.endGame(model);
  }

  private endGame(model: ScrapShooterModel): void {
    window.removeEventListener('keydown', this.onKeyDown);

    this.popup = showLevelComplete(
      this.popupLayer,
      { level: 1, score: model.getScore(), accuracy: model.getAccuracy() },
      {
        onNextLevel: () => this.restart(),
        onMenu: () => this.restart(), // TODO: go to the menu once it exists
      },
    );

    submitHighScore(model.getScore())
      .then(({ highScore }) => {
        if (this.model === model) this.view.showHighScore(highScore);
      })
      .catch(err => console.warn('Could not save high score', err));
  }

  private restart(): void {
    this.popup = null; // the popup already closed itself before calling back
    this.hide();
    this.show();
  }
}
