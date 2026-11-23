import type Konva from 'konva';
import { PopupController } from '../popups/PopupController';
import { PopupView } from '../popups/PopupView';
import { ScreenController, type ScreenSwitcher, type Topic } from '../types';
import { MAX_HEALTH, ScrapShooterModel } from './ScrapShooterModel';
import { ScrapShooterView } from './ScrapShooterView';
import { TOTAL_WAVES } from './logic/waves';
import {TOTAL_LEVELS, type LevelsByTopic} from "../screens/levels/LevelsModel";
import { submitLevelScore, submitUnlockedLevel } from "../api/progress";
import type { HighScoresModel } from "../screens/levels/HighScoresModel";

// A long gap between frames (like a hidden tab) must not make the scraps jump.
const MAX_FRAME_SECONDS = 0.1;

/**
 * Scraps fall down the screen in waves. The lowest one is the target. Type its answer and
 * press Enter. Right: the ship shoots it. Wrong: the input box border thickens briefly and a
 * popup explains the answer (no health is lost). A scrap that reaches the front line costs
 * 1 health. The game loop moves the model forward each frame and stops while a popup is
 * open or the game is paused (the Pause button, or Esc / P).
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
  private paused = false;

  constructor(
    private screenSwitcher: ScreenSwitcher,
    popupLayer: Konva.Layer,
    private levelsByTopic: LevelsByTopic,
    private highScores: HighScoresModel, // the same one the level map shows
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

    this.paused = false;
    this.view.build(() => this.backToLevels(), () => this.togglePause());
    this.view.render(model.getScraps(), model.getTarget());
    this.view.showTyped(model.getTyped());
    this.view.showHealth(model.getHealth(), MAX_HEALTH);
    this.view.showWave(model.getWave(), TOTAL_WAVES);

    window.addEventListener('keydown', this.onKeyDown);
    this.startLoop();
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

    // Time stops while a popup is open or the game is paused.
    if (!this.popups.isOpen() && !this.paused) this.step(this.model, seconds);
    if (this.looping) this.frameId = requestAnimationFrame(this.onFrame);
  };

  /** Moves the game forward and updates the screen. */
  private step(model: ScrapShooterModel, seconds: number): void {
    const result = model.tick(seconds);
    if (result.newWave !== null) this.view.showWave(result.newWave, TOTAL_WAVES);
    if (result.missed.length > 0) this.view.showHealth(model.getHealth(), MAX_HEALTH);
    this.view.render(model.getScraps(), model.getTarget());

    if (model.isLost()) this.gameOver(model);
    else if (model.isOver()) this.endGame(model);
  }

  // --------------------------------------------------------------- input

  private onKeyDown = (e: KeyboardEvent): void => {
    if (!this.model || this.popups.isOpen()) return; // typing pauses while a popup is open
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      this.togglePause();
      return;
    }
    if (this.paused) return; // no typing while paused

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
        () => {}, // a wrong answer costs no health, so the game just carries on after "Got it"
      );
    }
  }

  private endGame(model: ScrapShooterModel): void {
    this.stopLoop();
    window.removeEventListener('keydown', this.onKeyDown);
    this.levelsByTopic[this.topic].completeLevel(this.level);
    // Save the unlock on the server so it survives a refresh. If saving fails, the game keeps going.
    submitUnlockedLevel(this.topic, this.levelsByTopic[this.topic].getUnlockedLevels())
      .catch(err => console.warn('Could not save level progress', err));

    // Only wins count toward the topic's high score, so it's recorded here and not in gameOver.
    // The level map shows the topic's total; it only changes when this level's best is beaten.
    const score = model.getScore();
    if (this.highScores.recordWin(this.topic, this.level, score)) {
      submitLevelScore(this.topic, this.level, score)
        .catch(err => console.warn('Could not save the score', err));
    }

    this.popups.showLevelComplete(
      { level: this.level, score, accuracy: model.getAccuracy() },
      {
        onNextLevel: () =>{
          if(this.level < TOTAL_LEVELS) this.startLevel(this.topic, this.level + 1);
          else this.backToLevels();
        },
        onMenu: () => this.backToLevels(),
      },
    );
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
    // A lost game doesn't count toward the level's high score.
  }

  /**
   * Pauses or resumes the game. Does nothing while a popup is open or once the game has
   * ended (the loop has stopped), since time isn't moving then anyway.
   */
  private togglePause(): void {
    if (!this.model || !this.looping || this.popups.isOpen()) return;
    this.paused = !this.paused;
    this.view.showPaused(this.paused);
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
