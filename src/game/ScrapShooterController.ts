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

  getView(): ScrapShooterView {
    return this.view;
  }

  show(): void {
    if (this.model) return;
    this.view.show();
    this.model = new ScrapShooterModel();

    this.view.build();
    this.model.getScraps().forEach(scrap => this.view.addScrap(scrap));
    this.view.highlightTarget(this.model.getScraps());
    this.view.showTyped(this.model.getTyped());

    window.addEventListener('keydown', this.onKeyDown);
  }

  hide(): void {
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
  }
}
