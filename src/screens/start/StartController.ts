/**
 * Start screen CONTROLLER: connects the StartView to the App and to the game's sounds.
 * The start screen is the first thing the game shows, so this is also where the music starts.
 * A game button plays the click sound and asks the App to switch to that game with
 * switchToScreen(). The sound button mutes or unmutes every sound.
 */
import { ScreenController } from "../../types";
import type { ScreenSwitcher } from "../../types";
import type { Screen } from "../../types";
import { sounds as sharedSounds } from "../../audio/sounds";
import type { SoundPlayer } from "../../audio/SoundPlayer";
import { StartView } from "./StartView";

export class StartController extends ScreenController {
  private view: StartView;
  private screenSwitcher: ScreenSwitcher;
  private sounds: SoundPlayer;

  /**
   * @param screenSwitcher the App, so a click can switch screens
   * @param sounds the game's shared sounds (tests can pass their own)
   */
  constructor(screenSwitcher: ScreenSwitcher, sounds: SoundPlayer = sharedSounds) {
    super();
    this.screenSwitcher = screenSwitcher;
    this.sounds = sounds;
    this.view = new StartView(
      (screen: Screen) => this.handleStartClick(screen),
      () => this.handleSoundClick(),
      () => this.handlePressStart(),
    );
    this.view.showSoundOn(!this.sounds.isMuted());
    // Try the music as soon as the game opens. Most browsers wait for the player's first click,
    // which the click-to-start screen asks for (see handlePressStart).
    this.sounds.startMusicWhenAllowed();
  }

  /** The player clicked (or pressed a key) on the click-to-start screen. */
  private handlePressStart(): void {
    this.sounds.startMusic(); // that click lets the browser play sound now
    this.view.revealMenu();
  }

  private handleStartClick(screen: Screen): void {
    this.sounds.playClick();
    this.screenSwitcher.switchToScreen(screen);
  }

  private handleSoundClick(): void {
    const muted = this.sounds.toggleMuted();
    if (!muted) this.sounds.playClick(); // a blip to confirm sound is back on
    this.view.showSoundOn(!muted);
  }

  getView(): StartView {
    return this.view;
  }
}
