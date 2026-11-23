import { SoundPlayer } from "./SoundPlayer";

// Vite finds every audio file in src/sounds/ and gives back the URL to load it from.
// A file that hasn't been added yet just isn't in this list, so its sound is skipped
// instead of breaking the game.
const files = import.meta.glob("../sounds/*.{mp3,ogg,wav}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

/**
 * The URL of a sound in src/sounds/, whatever its file type. If there are several (say
 * menu-click.mp3 and menu-click.wav), the first type in this list wins: mp3, then ogg, then wav.
 */
const fileUrl = (name: string): string | undefined =>
  ["mp3", "ogg", "wav"].map((type) => files[`../sounds/${name}.${type}`]).find(Boolean);

/**
 * The one SoundPlayer the whole game shares, so the mute button silences every sound.
 * To add a sound: put the file in src/sounds/, name it here, and credit it in src/sounds/CREDITS.md.
 */
export const sounds = new SoundPlayer({
  click: fileUrl("menu-click"),
  music: fileUrl("heroic-music"),
});
