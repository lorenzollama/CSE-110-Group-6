import type Konva from 'konva';
import { getHighScore, submitHighScore } from '../api/highScore';
import { PopupController } from '../popups/PopupController';
import { PopupView } from '../popups/PopupView';
import { ScreenController, type ScreenSwitcher, type Topic } from '../types';
import { MAX_HEALTH, ScrapShooterModel } from './ScrapShooterModel';
import { ScrapShooterView } from './ScrapShooterView';
import {TOTAL_LEVELS, type LevelsByTopic} from "../screens/levels/LevelsModel";

/**
 * Scraps sit on screen and the first one in the list is the target. Type its answer
 * and press Enter. Right: the ship shoots it and a new scrap takes its place.
 * Wrong: the input box border thickens briefly.
 */
export class ScrapShooterController extends ScreenController {
  private view = new ScrapShooterView();
  private model: ScrapShooterModel | null = null;
  private popups: PopupController;
  private topic: Topic = 'multiplication';
  private level = 1;

  constructor(
    private screenSwitcher: ScreenSwitcher,
    popupLayer: Konva.Layer,
    private levelsByTopic: LevelsByTopic,
  ) {
    super();
    this.popups = new PopupController(new PopupView(popupLayer));
  }

  getView(): ScrapShooterView {
    return this.view;
  }

  show(): void {
    if (this.model) return;
    this.view.show();
    const model = new ScrapShooterModel(this.topic);
    this.model = model;

    this.view.build(() => this.backToLevels());
    model.getScraps().forEach(scrap => this.view.addScrap(scrap));
    this.view.highlightTarget(model.getScraps());
    this.view.showTyped(model.getTyped());
    this.view.showHealth(model.getHealth(), MAX_HEALTH);

    window.addEventListener('keydown', this.onKeyDown);

    getHighScore()
      .then(highScore => {
        if (this.model === model) this.view.showHighScore(highScore); // skip if the game was left meanwhile
      })
      .catch(err => console.warn('Could not load high score', err));
  }

  hide(): void {
    this.popups.close();
    window.removeEventListener('keydown', this.onKeyDown);
    this.view.destroy();
    this.model = null;
    this.view.hide();
  }

  // --------------------------------------------------------------- input

  private onKeyDown = (e: KeyboardEvent): void => {
    if (!this.model || this.popups.isOpen()) return; // typing pauses while a popup is open
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (/^[0-9/]$/.test(e.key)) {
      e.preventDefault(); // also stops "/" from opening Firefox's quick find
      this.model.typeKey(e.key);
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
    this.view.showHealth(model.getHealth(), MAX_HEALTH);

    if (result.type === 'correct') {
      this.view.shoot(result.hit.slot);
      this.view.removeScrap(result.hit.slot);
      this.view.addScrap(result.spawned);
      this.view.highlightTarget(model.getScraps());
    } else {
      this.view.flashWrong();
      const { question } = result.target;
      this.popups.showWrongAnswer(
        {
          question: question.prompt,
          playerAnswer: result.answer,
          correctAnswer: question.answer,
          explanation: question.explanation,
        },
        // If this was the last answer, show the level-complete popup after "Got it". and if the player lost all health, show the game-over popup after "Got it".
        () => {
          if (model.isLost()) this.gameOver(model);
          else if(model.isOver()) this.endGame(model);
        },
      );
      return;
    }

    if (model.isOver()) this.endGame(model);
  }

  private endGame(model: ScrapShooterModel): void {
    window.removeEventListener('keydown', this.onKeyDown);
    this.levelsByTopic[this.topic].completeLevel(this.level);

    this.popups.showLevelComplete(
      { level: this.level, score: model.getScore(), accuracy: model.getAccuracy() },
      {
        onNextLevel: () =>{
          if(this.level < TOTAL_LEVELS) this.startLevel(this.topic, this.level + 1);
          else this.backToLevels();
        },
        onMenu: () => this.backToLevels(),
      },
    );
    
    submitHighScore(model.getScore())
      .then(({ highScore }) => {
        if (this.model === model) this.view.showHighScore(highScore);
      })
      .catch(err => console.warn('Could not save high score', err));
  }

  private gameOver(model: ScrapShooterModel): void {
    window.removeEventListener('keydown', this.onKeyDown);

    this.popups.showGameOver(
      {  score: model.getScore(), accuracy: model.getAccuracy() },
      {
        onTryAgain: () => this.restart(),
        onMenu: () => this.backToLevels(),
      },
    );
    
    submitHighScore(model.getScore())
      .then(({ highScore }) => {
        if (this.model === model) this.view.showHighScore(highScore);
      })
      .catch(err => console.warn('Could not save high score', err));
  }

  /** Starts a fresh game of the given topic and level. */
  startLevel(topic: Topic, level: number): void {
    this.topic = topic;
    this.level = level;
    this.restart();
  }

  /** Goes back to the level map of the topic being played. */
  private backToLevels(): void {
    this.screenSwitcher.switchToScreen({ type: 'levels', topic: this.topic });
  }

  private restart(): void {
    this.hide();
    this.show();
  }
}
