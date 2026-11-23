import Konva from "konva";
import type { Screen, View } from "../../types.ts";
import { SpaceBackdrop, STAGE_WIDTH, makeTitle, useTitleFont } from "../shared/space.ts";
import { darkLook, makePressable, makeSprite, spriteSize, type Pressable } from "../shared/pressable.ts";

export { STAGE_HEIGHT, STAGE_WIDTH } from "../shared/space.ts";

const TITLE_SIZE = 72;
const SOUND_BUTTON_SIZE = 48;
const SOUND_BUTTON_MARGIN = 20; // gap between the sound button and the window's top-right corner

// The game cards: a row of three under the title.
const CARD_WIDTH = 200;
const CARD_HEIGHT = 220;
const CARD_GAP = 60; // between one card and the next
const CARD_TOP = 250;
const PIXEL = 8; // the size of one sprite pixel
const SPRITE_TOP = 28; // from the card's top edge

/**
 * Pixel-art sprites, one string per row; each letter is a color from the game's `colors`
 * and "." is see-through.
 */
const ROCKET = [
  ".....RR.....",
  "....RRRR....",
  "....WWWW....",
  "...WWBBWW...",
  "...WBBBBW...",
  "...WWBBWW...",
  "...WWWWWW...",
  "..RWWWWWWR..",
  ".RRWWWWWWRR.",
  ".RR.WWWW.RR.",
  "....OYYO....",
  ".....OO.....",
];
const MEMORY_GRID = [
  "LLL.DDD.DDD",
  "LLL.DDD.DDD",
  "LLL.DDD.DDD",
  "...........",
  "DDD.LLL.DDD",
  "DDD.LLL.DDD",
  "DDD.LLL.DDD",
  "...........",
  "DDD.DDD.LLL",
  "DDD.DDD.LLL",
  "DDD.DDD.LLL",
];
const TILES = [
  "AAAAA.BBBBB",
  "AAAAA.BBBBB",
  "AAAAA.BBBBB",
  "AAAAA.BBBBB",
  "AAAAA.BBBBB",
  "...........",
  "CCCCC.DDDDD",
  "CCCCC.DDDDD",
  "CCCCC.DDDDD",
  "CCCCC.DDDDD",
  "CCCCC.DDDDD",
];

/**
 * The menu's game cards, left to right: the label (\n for a second line), the sprite and its
 * colors, the card's accent (outline) and shadow colors, and the screen it opens.
 */
const GAMES: {
  label: string;
  sprite: string[];
  colors: Record<string, string>;
  accent: string;
  shade: string;
  screen: Screen;
}[] = [
  {
    label: "SPACESHIP\nSHOOTER",
    sprite: ROCKET,
    colors: { W: "#e2e8f0", R: "#ef4444", B: "#38bdf8", O: "#f97316", Y: "#facc15" },
    accent: "#fb923c",
    shade: "#7c2d12",
    screen: { type: "topic select" },
  },
  {
    label: "MEMORY",
    sprite: MEMORY_GRID,
    colors: { L: "#2dd4bf", D: "#334155" },
    accent: "#2dd4bf",
    shade: "#134e4a",
    screen: { type: "minigame1" },
  },
  {
    label: "POWERS",
    sprite: TILES,
    colors: { A: "#fbcfe8", B: "#f9a8d4", C: "#f472b6", D: "#db2777" }, // tiles getting "bigger" as they darken
    accent: "#f472b6",
    shade: "#831843",
    screen: { type: "minigame2" },
  },
];

/** The sound button's look: a dark glass circle. */
const SOUND_LOOK = { fill: "rgba(15,23,42,0.75)", outline: "#64748b", glow: "#38bdf8", restingGlow: 0 };

interface SoundButton {
  group: Konva.Group;
  body: Konva.Rect;
  icon: Konva.Text;
}

/**
 * A game card: a flat panel with a colored outline, a solid shadow, the game's sprite and its
 * name. On hover the card lifts off its shadow and the sprite bobs up; pressing pushes it down
 * onto the shadow, like a physical button. Clicking it only calls `onClick`.
 */
function makeGameCard(game: (typeof GAMES)[number], onClick: () => void): { card: Pressable; label: Konva.Text } {
  const sprite = makeSprite(game.sprite, game.colors, PIXEL);
  sprite.position({ x: Math.round((CARD_WIDTH - spriteSize(game.sprite, PIXEL).width) / 2), y: SPRITE_TOP });
  const label = new Konva.Text({
    y: 140,
    width: CARD_WIDTH,
    height: 60,
    align: "center",
    verticalAlign: "middle",
    text: game.label,
    fontSize: 16,
    lineHeight: 1.35,
    fontStyle: "bold",
    fontFamily: "Arial",
    letterSpacing: 2,
    fill: "white",
    listening: false,
  });
  const card = makePressable(
    CARD_WIDTH, CARD_HEIGHT, darkLook(game.accent, game.shade), onClick,
    (hovered, move) => move(sprite, { y: hovered ? SPRITE_TOP - 6 : SPRITE_TOP }),
  );
  card.face.add(sprite, label);
  return { card, label };
}

/**
 * The round sound button for the top-right corner: a speaker icon (🔊 or 🔇, see
 * StartView.showSoundOn) in a dark glass circle. It grows and glows while the mouse is over
 * it and dips slightly when pressed. Clicking it only calls `onClick`.
 */
function makeSoundButton(onClick: () => void): SoundButton {
  const look = SOUND_LOOK;
  const group = new Konva.Group(); // its origin is the circle's center
  const body = new Konva.Rect({
    x: -SOUND_BUTTON_SIZE / 2,
    y: -SOUND_BUTTON_SIZE / 2,
    width: SOUND_BUTTON_SIZE,
    height: SOUND_BUTTON_SIZE,
    cornerRadius: SOUND_BUTTON_SIZE / 2, // fully rounded: a circle
    fill: look.fill,
    stroke: look.outline,
    strokeWidth: 1.5,
    shadowColor: look.glow,
    shadowBlur: look.restingGlow,
    shadowOpacity: 0.9,
  });
  const icon = new Konva.Text({
    x: -SOUND_BUTTON_SIZE / 2,
    y: -SOUND_BUTTON_SIZE / 2,
    width: SOUND_BUTTON_SIZE,
    height: SOUND_BUTTON_SIZE,
    align: "center",
    verticalAlign: "middle",
    text: "🔊",
    fontSize: 22,
    listening: false,
  });
  group.add(body, icon);

  const animateTo = (scale: number, glow: number) => {
    new Konva.Tween({ node: group, duration: 0.15, scaleX: scale, scaleY: scale, easing: Konva.Easings.EaseOut }).play();
    body.shadowBlur(glow);
  };
  group.on("mouseenter", () => {
    document.body.style.cursor = "pointer";
    animateTo(1.12, 28);
  });
  group.on("mouseleave", () => {
    document.body.style.cursor = "default";
    animateTo(1, look.restingGlow);
  });
  group.on("mousedown touchstart", () => animateTo(0.95, 28));
  group.on("mouseup touchend", () => animateTo(1.12, 28));
  group.on("click tap", onClick);
  return { group, body, icon };
}

/**
 * Start screen VIEW: draws the start screen with Konva: the night sky (see SpaceBackdrop),
 * the SPACEBLAST title, and one card per game.
 * The sky fills the whole window; the title and cards stay in the centered 800×600 area
 * like every other screen.
 * It shows what it's told and decides nothing. When a card is clicked, it only reports
 * the click; the controller decides what happens.
 */
export class StartView implements View {
  private group = new Konva.Group();
  private sky: SpaceBackdrop;
  private title: Konva.Text;
  private cards: Pressable[] = [];
  private soundButton: SoundButton; // in the window's top-right corner (see placeSoundButton)

  // The click-to-start screen. Browsers only allow sound after the player clicks or presses a
  // key, so the game opens on "CLICK ANYWHERE TO START" and that first click starts the music.
  // The game cards appear after it, once per visit.
  private prompt: Konva.Text;
  private waitingForStart = true;
  private onPressStart: () => void;

  /**
   * @param onStartClick called with the screen a game card opens
   * @param onSoundClick called when the sound (mute) button is clicked
   * @param onPressStart called once, on the player's first click or key press on the start screen
   */
  constructor(onStartClick: (screen: Screen) => void, onSoundClick: () => void, onPressStart: () => void) {
    this.onPressStart = onPressStart;
    this.sky = new SpaceBackdrop(
      // The click-to-start prompt gently pulses between dim and bright.
      (seconds) => {
        if (this.waitingForStart) this.prompt.opacity(0.45 + 0.55 * (Math.sin(seconds * 3) + 1) / 2);
      },
      (windowWidth, _windowHeight, left, top) => this.placeSoundButton(windowWidth, left, top),
    );
    this.group.add(this.sky.group);

    this.title = makeTitle("SPACEBLAST", 120, TITLE_SIZE);
    this.title.letterSpacing(4);
    this.title.shadowBlur(24);
    this.group.add(this.title);

    // One card per game, in a centered row. Hidden until the player clicks to start.
    const labels: Konva.Text[] = [];
    const rowWidth = GAMES.length * CARD_WIDTH + (GAMES.length - 1) * CARD_GAP;
    const rowLeft = (STAGE_WIDTH - rowWidth) / 2;
    GAMES.forEach((game, i) => {
      const { card, label } = makeGameCard(game, () => onStartClick(game.screen));
      card.group.position({ x: rowLeft + i * (CARD_WIDTH + CARD_GAP), y: CARD_TOP });
      card.group.visible(false);
      this.cards.push(card);
      labels.push(label);
      this.group.add(card.group);
    });

    // Where the cards will be: the click-to-start prompt. It pulses (see the sky's onFrame).
    this.prompt = new Konva.Text({
      y: 330,
      width: STAGE_WIDTH,
      align: "center",
      text: "CLICK ANYWHERE TO START",
      fontSize: 22,
      fontStyle: "bold",
      fontFamily: "Arial",
      letterSpacing: 3,
      fill: "#c7d2fe",
      shadowColor: "#818cf8",
      shadowBlur: 12,
      listening: false,
    });
    this.group.add(this.prompt);

    this.soundButton = makeSoundButton(onSoundClick);
    this.group.add(this.soundButton.group);
    this.placeSoundButton(STAGE_WIDTH); // until it's on screen and knows the window size

    useTitleFont([this.title, ...labels, this.prompt], () => this.group.getLayer()?.batchDraw());
  }

  /** Shows the speaker icon for sound on (🔊) or muted (🔇). The controller decides which. */
  showSoundOn(on: boolean): void {
    this.soundButton.icon.text(on ? "🔊" : "🔇");
    this.group.getLayer()?.batchDraw();
  }

  /** Ends the click-to-start screen: the prompt fades out and the game cards fade in. */
  revealMenu(): void {
    if (!this.waitingForStart) return;
    this.waitingForStart = false;
    this.stopWaitingForStart();
    new Konva.Tween({ node: this.prompt, opacity: 0, duration: 0.25, onFinish: () => this.prompt.visible(false) }).play();
    // The cards fade in left to right, 80 ms apart.
    this.cards.forEach((card, i) => {
      card.group.opacity(0);
      card.group.visible(true);
      setTimeout(() => {
        new Konva.Tween({ node: card.group, opacity: 1, duration: 0.35, easing: Konva.Easings.EaseOut }).play();
      }, 80 * i);
    });
    this.group.getLayer()?.batchDraw();
  }

  show(): void {
    this.group.visible(true);
    this.sky.start();
    if (this.waitingForStart) this.waitForStart();
    this.group.getLayer()?.batchDraw();
  }

  hide(): void {
    this.sky.stop();
    this.stopWaitingForStart();
    // A clicked card is hidden while the mouse is still on it, so its "mouse left" never comes:
    // put every card, the sound button and the cursor back to normal for next time.
    document.body.style.cursor = "default";
    for (const card of this.cards) card.reset();
    this.soundButton.group.scale({ x: 1, y: 1 });
    this.soundButton.body.shadowBlur(SOUND_LOOK.restingGlow);
    this.group.visible(false);
    this.group.getLayer()?.batchDraw();
  }

  getGroup(): Konva.Group {
    return this.group;
  }

  // -------------------------------------------------------------- the click-to-start screen

  // "click" (not "pointerdown") on purpose: the cards appear only after the click is over,
  // so the click that starts the game can't also press a card that appears under the mouse.
  private waitForStart(): void {
    window.addEventListener("click", this.pressStart);
    window.addEventListener("keydown", this.pressStart);
  }

  private stopWaitingForStart(): void {
    window.removeEventListener("click", this.pressStart);
    window.removeEventListener("keydown", this.pressStart);
  }

  /** The player clicked or pressed a key: report it; the controller decides what happens. */
  private pressStart = (): void => {
    this.stopWaitingForStart();
    this.onPressStart();
  };

  /**
   * Puts the sound button in the window's top-right corner. Like the sky, it's shifted back by
   * the layer's centering offset (`left`, `top`) so it sits at the window's edge, not the 800×600 area's.
   */
  private placeSoundButton(windowWidth: number, left = 0, top = 0): void {
    const fromEdge = SOUND_BUTTON_MARGIN + SOUND_BUTTON_SIZE / 2;
    this.soundButton.group.position({ x: left + windowWidth - fromEdge, y: top + fromEdge });
  }
}
