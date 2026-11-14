import { ScreenController } from "../../types.ts";
import type { Direction, GameLogic, GameState } from "./types.ts";
import type { Minigame2View } from "./view.ts";

/**
 * Turns the name of a pressed key into the direction the tiles should move
 *
 * W A S D and the arrow keys are the game keys. Capital letters count too, so
 * the keys still work with Caps Lock or Shift on. Any other key gives null.
 */
export function keyToDirection(key: string): Direction | null {
  switch (key) {
    case "w":
    case "W":
    case "ArrowUp":
      return "up";
    case "a":
    case "A":
    case "ArrowLeft":
      return "left";
    case "s":
    case "S":
    case "ArrowDown":
      return "down";
    case "d":
    case "D":
    case "ArrowRight":
      return "right";
    default:
      return null;
  }
}

// 9^6 = 531441 is the biggest answer, so 7 digits is plenty
const MAX_ANSWER_DIGITS = 7;

/**
 * Minigame2Controller - connects the game logic to the view
 *
 * It starts new games and turns key presses into moves. While a question is
 * up, the keys type the answer instead.
 */
export class Minigame2Controller extends ScreenController {
  private game: GameLogic;
  private view: Minigame2View;
  // addEventListener and removeEventListener need the same function, so it is made once here
  private onKeyDown = (event: KeyboardEvent): void => this.handleKeyDown(event);
  // the question being asked, or null when the board can move
  private question: string | null = null;
  // the digits typed so far for the current question
  private typed = "";

  constructor(game: GameLogic, view: Minigame2View) {
    super();
    this.game = game;
    this.view = view;
    this.view.onNewGameClick(() => this.startNewGame());
  }

  /**
   * Starts a new game and draws its first board
   */
  startNewGame(): void {
    this.render(this.game.newGame());
  }

  /**
   * Handles one keydown event from the browser
   *
   * A game key makes one move and redraws the board. Other keys are left alone.
   */
  handleKeyDown(event: KeyboardEvent): void {
    // leave shortcuts like Ctrl+D (bookmark) or Cmd+S (save) to the browser
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    if (this.question !== null) {
      this.handleAnswerKey(event);
      return;
    }

    const direction = keyToDirection(event.key);
    if (direction === null) {
      return; // not a game key, so let the browser handle it as usual
    }

    // stop the arrow keys from scrolling the page
    event.preventDefault();

    // holding a key down makes the browser repeat it, so count only the first press
    if (event.repeat) {
      return;
    }

    this.render(this.game.move(direction));
  }

  // While a question is up: digits type, Backspace erases and Enter sends the answer
  private handleAnswerKey(event: KeyboardEvent): void {
    // arrows would scroll the page, and keep the board from moving under the question
    if (keyToDirection(event.key) !== null) {
      event.preventDefault();
      return;
    }

    if (/^[0-9]$/.test(event.key) && this.typed.length < MAX_ANSWER_DIGITS) {
      this.typed += event.key;
    } else if (event.key === "Backspace") {
      this.typed = this.typed.slice(0, -1);
    } else if (event.key === "Enter" && this.typed !== "") {
      this.render(this.game.answer(Number(this.typed)));
      return;
    } else {
      return;
    }

    event.preventDefault();
    this.view.drawAnswer(this.typed);
  }

  // Draws a new state and starts each question with an empty answer
  private render(state: GameState): void {
    this.question = state.question;
    this.typed = "";
    this.view.draw(state);
    this.view.drawAnswer(this.typed);
  }

  /**
   * Shows Minigame 2 and starts listening for key presses
   */
  show(): void {
    this.view.show();
    window.addEventListener("keydown", this.onKeyDown);
  }

  /**
   * Stops listening for key presses and hides Minigame 2
   */
  hide(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    this.view.hide();
  }

  getView(): Minigame2View {
    return this.view;
  }
}