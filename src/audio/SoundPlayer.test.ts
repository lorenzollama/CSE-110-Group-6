import { describe, expect, it, vi } from "vitest";
import { CLICK_VOLUME, MUSIC_VOLUME, SoundPlayer, type AudioTrack } from "./SoundPlayer";

/** A fake <audio> element that records what was done to it. */
function fakeTrack(playResult: Promise<void> = Promise.resolve()) {
  return { play: vi.fn(() => playResult), pause: vi.fn(), loop: false, volume: 1 };
}

/** A SoundPlayer with fake audio. `made` lists every fake track it made, with its file. */
function setup(urls: Partial<Record<"click" | "music", string>> = { click: "/click.mp3", music: "/music.mp3" }) {
  const made: { url: string; track: ReturnType<typeof fakeTrack> }[] = [];
  const player = new SoundPlayer(urls, (url) => {
    const track = fakeTrack();
    made.push({ url, track });
    return track;
  });
  return { player, made };
}

describe("SoundPlayer: muting", () => {
  it("starts with sound on", () => {
    expect(setup().player.isMuted()).toBe(false);
  });

  it("toggles between muted and unmuted, and says which it is now", () => {
    const { player } = setup();
    expect(player.toggleMuted()).toBe(true);
    expect(player.isMuted()).toBe(true);
    expect(player.toggleMuted()).toBe(false);
    expect(player.isMuted()).toBe(false);
  });
});

describe("SoundPlayer: click", () => {
  // Success path.
  it("plays the click file", () => {
    const { player, made } = setup();
    player.playClick();
    expect(made).toHaveLength(1);
    expect(made[0].url).toBe("/click.mp3");
    expect(made[0].track.play).toHaveBeenCalledOnce();
    expect(made[0].track.volume).toBe(CLICK_VOLUME);
  });

  it("stays silent while muted", () => {
    const { player, made } = setup();
    player.toggleMuted();
    player.playClick();
    expect(made).toHaveLength(0);
  });

  // Edge case: the click file hasn't been added yet.
  it("does nothing when there's no click file", () => {
    const { player, made } = setup({ music: "/music.mp3" });
    expect(() => player.playClick()).not.toThrow();
    expect(made).toHaveLength(0);
  });
});

describe("SoundPlayer: music", () => {
  it("plays the music on a loop, quieter than clicks", () => {
    const { player, made } = setup();
    player.startMusic();
    expect(made[0].url).toBe("/music.mp3");
    expect(made[0].track.loop).toBe(true);
    expect(made[0].track.volume).toBe(MUSIC_VOLUME);
    expect(made[0].track.play).toHaveBeenCalledOnce();
  });

  // Edge case: opening a second game doesn't start a second copy of the music.
  it("only ever has one copy of the music", () => {
    const { player, made } = setup();
    player.startMusic();
    player.startMusic();
    expect(made.filter((m) => m.url === "/music.mp3")).toHaveLength(1);
  });

  it("pauses when muted and continues when unmuted", () => {
    const { player, made } = setup();
    player.startMusic();
    const music = made[0].track;

    player.toggleMuted();
    expect(music.pause).toHaveBeenCalledOnce();

    player.toggleMuted();
    expect(music.play).toHaveBeenCalledTimes(2); // the same track, so it continues where it paused
    expect(made).toHaveLength(1);
  });

  // Edge case: the music was started while muted, so it waits for unmute.
  it("waits until unmuted when started while muted", () => {
    const { player, made } = setup();
    player.toggleMuted();
    player.startMusic();
    expect(made).toHaveLength(0);
    player.toggleMuted();
    expect(made).toHaveLength(1);
    expect(made[0].track.play).toHaveBeenCalledOnce();
  });

  // Unmuting before any game was opened doesn't start the music early.
  it("doesn't start the music just because sound was unmuted", () => {
    const { player, made } = setup();
    player.toggleMuted();
    player.toggleMuted();
    expect(made).toHaveLength(0);
  });
});

describe("SoundPlayer: music when the game opens", () => {
  /** A fake page that remembers its listeners, so a test can "click" it. */
  function fakePage() {
    const listeners = new Map<string, () => void>();
    return {
      addEventListener: vi.fn((type: string, fn: () => void) => listeners.set(type, fn)),
      removeEventListener: vi.fn((type: string) => listeners.delete(type)),
      press: (type: string) => listeners.get(type)?.(),
      listening: () => listeners.size,
    };
  }

  it("tries to start the music right away", () => {
    const { player, made } = setup();
    player.startMusicWhenAllowed(fakePage());
    expect(made[0].url).toBe("/music.mp3");
    expect(made[0].track.play).toHaveBeenCalledOnce();
  });

  // The browser may block that first try, so the first click or key press tries again.
  it("tries again on the first click, then stops listening", () => {
    const { player, made } = setup();
    const page = fakePage();
    player.startMusicWhenAllowed(page);
    page.press("pointerdown");
    expect(made[0].track.play).toHaveBeenCalledTimes(2);
    expect(page.listening()).toBe(0);
  });

  it("also tries again on the first key press", () => {
    const { player, made } = setup();
    const page = fakePage();
    player.startMusicWhenAllowed(page);
    page.press("keydown");
    expect(made[0].track.play).toHaveBeenCalledTimes(2);
    expect(page.listening()).toBe(0);
  });

  // Edge case: if the player mutes before the music could start, it stays silent.
  it("stays silent if the player muted first", () => {
    const { player, made } = setup();
    const page = fakePage();
    player.toggleMuted();
    player.startMusicWhenAllowed(page);
    page.press("pointerdown");
    expect(made).toHaveLength(0);
  });
});

describe("SoundPlayer: problems", () => {
  // Unsuccessful path: the browser blocks sound before the player has clicked. That's expected,
  // so it's quiet about it.
  it("keeps going quietly when the browser refuses to play yet", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const refusal = Object.assign(new Error("play() needs a click first"), { name: "NotAllowedError" });
    const blocked: AudioTrack = fakeTrack(Promise.reject(refusal));
    const player = new SoundPlayer({ click: "/click.mp3" }, () => blocked);
    expect(() => player.playClick()).not.toThrow();
    await new Promise((r) => setTimeout(r)); // let the rejected play() settle
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  // Unsuccessful path: the file is missing or broken. The game keeps going, with a warning.
  it("warns when a sound file can't be played", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const broken = Object.assign(new Error("no supported source"), { name: "NotSupportedError" });
    const player = new SoundPlayer({ click: "/click.mp3" }, () => fakeTrack(Promise.reject(broken)));
    expect(() => player.playClick()).not.toThrow();
    await new Promise((r) => setTimeout(r));
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  // Unsuccessful path: no <audio> support at all.
  it("keeps going when audio can't be made", () => {
    const player = new SoundPlayer({ click: "/click.mp3", music: "/music.mp3" }, () => {
      throw new Error("Audio is not defined");
    });
    expect(() => player.playClick()).not.toThrow();
    expect(() => player.startMusic()).not.toThrow();
  });
});
