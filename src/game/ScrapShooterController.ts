import type Konva from 'konva';
import { getHighScore, submitHighScore } from '../api/highScore';
import { PopupController } from '../popups/PopupController';
import { PopupView } from '../popups/PopupView';
import { ScreenController, type ScreenSwitcher, type Topic } from '../types';
import { MAX_HEALTH, ScrapShooterModel } from './ScrapShooterModel';
import { ScrapShooterView } from './ScrapShooterView';
import { TOTAL_WAVES } from './logic/waves';
import {TOTAL_LEVELS, type LevelsByTopic} from "../screens/levels/LevelsModel";

// A long gap between frames (like a hidden tab) must not make the scraps jump.
const MAX_FRAME_SECONDS = 0.1;

/**
 * Scraps fall down the screen in waves. The lowest one is the target. Type its answer and
 * press Enter. Right: the ship shoots it. Wrong: the input box border thickens briefly, a
 * popup explains the answer and the player loses 1 health.
 * The game loop moves the model forward each frame and pauses while a popup is open.
 */
export class ScrapShooterController extends ScreenController {
  private view = new ScrapShooterView();
  private model: ScrapShooterModel | null = null;
  private popups: PopupController;
  private topic: Topic = 'multiplication';
  private level = 1;
  private looping = false;
  private frameId = 0;
  private lastFrame = 0;

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
    const model = new ScrapShooterModel(this.topic, this.level);
    this.model = model;

    this.view.build(() => this.backToLevels());
    this.view.render(model.getScraps(), model.getTarget());
    this.view.showTyped(model.getTyped());
    this.view.showHealth(model.getHealth(), MAX_HEALTH);
    this.view.showWave(model.getWave(), TOTAL_WAVES);

    window.addEventListener('keydown', this.onKeyDown);
    this.startLoop();

    getHighScore()
      .then(highScore => {
        if (this.model === model) this.view.showHighScore(highScore); // skip if the game was left meanwhile
      })
      .catch(err => console.warn('Could not load high score', err));
  }

  hide(): void {
    this.stopLoop();
    this.popups.close();
    window.removeEventListener('keydown', this.onKeyDown);
    this.view.destroy();
    this.model = null;
    this.view.hide();
  }

  // ----------------------------------------------------------- game loop

  private startLoop(): void {
    this.looping = true;
    this.lastFrame = performance.now();
    this.frameId = requestAnimationFrame(this.onFrame);
  }

  private stopLoop(): void {
    this.looping = false;
    cancelAnimationFrame(this.frameId);
  }

  private onFrame = (now: number): void => {
    if (!this.looping || !this.model) return;
    const seconds = Math.max(0, Math.min((now - this.lastFrame) / 1000, MAX_FRAME_SECONDS));
    this.lastFrame = now;

    if (!this.popups.isOpen()) this.step(this.model, seconds); // time stops while a popup is open
    if (this.looping) this.frameId = requestAnimationFrame(this.onFrame);
  };

  /** Moves the game forward and updates the screen. */
  private step(model: ScrapShooterModel, seconds: number): void {
    const result = model.tick(seconds);
    if (result.newWave !== null) this.view.showWave(result.newWave, TOTAL_WAVES);
    this.view.render(model.getScraps(), model.getTarget());

    if (model.isLost()) this.gameOver(model);
    else if (model.isOver()) this.endGame(model);
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
      this.view.shoot(result.hit);
      this.view.render(model.getScraps(), model.getTarget());
      if (model.isOver()) this.endGame(model);
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
        // If the player lost all health, show the game-over popup after "Got it".
        () => {
          if (model.isLost()) this.gameOver(model);
        },
      );
    }
  }

  private endGame(model: ScrapShooterModel): void {
    this.stopLoop();
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
    this.stopLoop();
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
