/**
 * Plays the game's sounds and remembers whether sound is muted.
 * Every sound should go through one shared SoundPlayer (see sounds.ts), so the mute button
 * silences all of them. No drawing here, and the <audio> maker is passed in, so it's unit tested.
 */

/** What the player needs from an <audio> element. Tests pass a fake with the same parts. */
export interface AudioTrack {
  play(): Promise<void>;
  pause(): void;
  loop: boolean;
  volume: number;
}

export type SoundName = "click" | "music";

// Louder clicks than music, so the music stays in the background.
export const CLICK_VOLUME = 0.8;
export const MUSIC_VOLUME = 0.35;

export class SoundPlayer {
  private muted = false;
  private music: AudioTrack | null = null;
  private musicWanted = false; // true once the music was started, so unmuting brings it back

  /**
   * @param urls where each sound's file is; a sound without a file is skipped
   * @param makeAudio makes an <audio> element for a file (tests pass a fake)
   */
  constructor(
    private urls: Partial<Record<SoundName, string>>,
    private makeAudio: (url: string) => AudioTrack = (url) => new Audio(url),
  ) {}

  isMuted(): boolean {
    return this.muted;
  }

  /** Mutes or unmutes every sound. Returns true if sound is now muted. */
  toggleMuted(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) this.music?.pause();
    else if (this.musicWanted) this.startMusic(); // picks up where it paused
  }

  /** Plays the button click sound once, unless muted. */
  playClick(): void {
    if (this.muted) return;
    const click = this.load("click");
    if (!click) return;
    click.volume = CLICK_VOLUME;
    this.play(click);
  }

  /**
   * Starts the background music on a loop. Safe to call again: there's only ever one copy
   * playing. If sound is muted, the music starts when it's unmuted.
   */
  startMusic(): void {
    this.musicWanted = true;
    if (this.muted) return;
    this.music ??= this.load("music");
    if (!this.music) return;
    this.music.loop = true;
    this.music.volume = MUSIC_VOLUME;
    this.play(this.music);
  }

  /**
   * Starts the music as soon as the game opens. Browsers don't let a page play sound until the
   * player has clicked or pressed a key on it, so this tries right away and, in case the browser
   * said no, tries again on the player's first click or key press anywhere on the page.
   * @param page where to listen for that first click or key press (tests pass a fake)
   */
  startMusicWhenAllowed(page: Pick<EventTarget, "addEventListener" | "removeEventListener"> = window): void {
    this.startMusic();
    const tryAgain = () => {
      page.removeEventListener("pointerdown", tryAgain);
      page.removeEventListener("keydown", tryAgain);
      this.startMusic(); // does nothing new if it's already playing
    };
    page.addEventListener("pointerdown", tryAgain);
    page.addEventListener("keydown", tryAgain);
  }

  /** Makes an <audio> element for a sound, or null if its file isn't there. */
  private load(name: SoundName): AudioTrack | null {
    const url = this.urls[name];
    if (!url) return null;
    try {
      return this.makeAudio(url);
    } catch {
      return null; // no audio support (e.g. outside a browser)
    }
  }

  private play(track: AudioTrack): void {
    // Neither problem below should break the game, so the error is caught either way.
    track.play().catch((err: unknown) => {
      // The browser refusing before the player has clicked anything is expected (see
      // startMusicWhenAllowed). Anything else, like a missing or broken file, is worth a warning.
      if ((err as { name?: string } | null)?.name === "NotAllowedError") return;
      console.warn("A sound couldn't play:", err);
    });
  }
}
