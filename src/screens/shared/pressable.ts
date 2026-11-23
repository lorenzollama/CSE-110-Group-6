/**
 * The menu screens' buttons: flat panels with a colored outline and a solid shadow that lift
 * off the shadow on hover and press down onto it when clicked, like physical arcade buttons.
 * Also pixel-art sprites to put on them.
 */
import Konva from "konva";

export const SHADOW = 6; // how far the solid shadow sits below and to the right of a button

/** How a button looks: its face color (normal and hovered), outline, and shadow color. */
export interface PressableLook {
  fill: string;
  hoverFill: string;
  accent: string;
  shade: string;
}

/** A dark panel with a colored outline; most buttons use this with their own colors. */
export function darkLook(accent: string, shade: string): PressableLook {
  return { fill: "#0f172a", hoverFill: "#1e293b", accent, shade };
}

/** Moves `node` to `to`, either smoothly or (for a reset) at once. */
export type Mover = (node: Konva.Node, to: Konva.NodeConfig) => void;

const glide: Mover = (node, to) =>
  new Konva.Tween({ node, duration: 0.12, easing: Konva.Easings.EaseOut, ...to }).play();
const jump: Mover = (node, to) => node.setAttrs(to);

export interface Pressable {
  /** Position this to place the button. */
  group: Konva.Group;
  /** Add the button's sprite and text here; it moves when the button lifts or is pressed. */
  face: Konva.Group;
  /** Puts the button back to how it looks when the mouse isn't on it. */
  reset: () => void;
}

/**
 * A button that lifts off its shadow while the mouse is over it and presses down onto it
 * when clicked. Clicking it only calls `onClick`.
 *
 * @param onHover called when the mouse comes on (true) or goes off (false), with a mover,
 *   to animate the button's own contents (e.g. make its sprite bob up)
 */
export function makePressable(
  width: number,
  height: number,
  look: PressableLook,
  onClick: () => void,
  onHover?: (hovered: boolean, move: Mover) => void,
): Pressable {
  const group = new Konva.Group();
  const shadow = new Konva.Rect({ x: SHADOW, y: SHADOW, width, height, cornerRadius: 4, fill: look.shade });
  const face = new Konva.Group();
  const body = new Konva.Rect({ width, height, cornerRadius: 4, fill: look.fill, stroke: look.accent, strokeWidth: 3 });
  face.add(body);
  group.add(shadow, face);

  const lift = () => {
    glide(face, { x: -2, y: -4 });
    body.fill(look.hoverFill);
    onHover?.(true, glide);
  };
  const drop = (move: Mover) => {
    move(face, { x: 0, y: 0 });
    body.fill(look.fill);
    onHover?.(false, move);
  };

  group.on("mouseenter", () => {
    document.body.style.cursor = "pointer";
    lift();
  });
  group.on("mouseleave", () => {
    document.body.style.cursor = "default";
    drop(glide);
  });
  group.on("mousedown touchstart", () => glide(face, { x: SHADOW - 2, y: SHADOW - 2 }));
  group.on("mouseup touchend", lift);
  group.on("click tap", onClick);
  return { group, face, reset: () => drop(jump) };
}

/**
 * Draws a pixel-art sprite as a group of squares, its top-left corner at 0, 0. `rows` has
 * one string per row; each letter is a color from `colors` and "." is see-through.
 */
export function makeSprite(rows: string[], colors: Record<string, string>, pixel: number): Konva.Group {
  const sprite = new Konva.Group({ listening: false });
  rows.forEach((row, y) => {
    [...row].forEach((letter, x) => {
      const fill = colors[letter];
      if (!fill) return;
      sprite.add(new Konva.Rect({ x: x * pixel, y: y * pixel, width: pixel, height: pixel, fill, perfectDrawEnabled: false }));
    });
  });
  return sprite;
}

/** A sprite's size in pixels, from its rows (see makeSprite). */
export function spriteSize(rows: string[], pixel: number): { width: number; height: number } {
  return { width: Math.max(...rows.map((row) => row.length)) * pixel, height: rows.length * pixel };
}

const LEFT_ARROW = [
  "...O",
  "..OO",
  ".OOO",
  "OOOO",
  ".OOO",
  "..OO",
  "...O",
];

export const BACK_BUTTON_WIDTH = 116;
export const BACK_BUTTON_HEIGHT = 44;

/**
 * The menu screens' BACK button: a small slate button with a pixel arrow that nudges left
 * on hover. Returns the button and its label (to switch to Orbitron when it loads).
 */
export function makeBackButton(onClick: () => void): { button: Pressable; label: Konva.Text } {
  const arrowX = 16;
  const arrow = makeSprite(LEFT_ARROW, { O: "#cbd5e1" }, 3);
  arrow.position({ x: arrowX, y: (BACK_BUTTON_HEIGHT - spriteSize(LEFT_ARROW, 3).height) / 2 });
  const label = new Konva.Text({
    x: 30,
    width: BACK_BUTTON_WIDTH - 36,
    height: BACK_BUTTON_HEIGHT,
    align: "center",
    verticalAlign: "middle",
    text: "BACK",
    fontSize: 15,
    fontStyle: "bold",
    fontFamily: "Arial",
    letterSpacing: 2,
    fill: "#e2e8f0",
    listening: false,
  });
  const button = makePressable(
    BACK_BUTTON_WIDTH, BACK_BUTTON_HEIGHT, darkLook("#64748b", "#1e293b"), onClick,
    (hovered, move) => move(arrow, { x: hovered ? arrowX - 4 : arrowX }),
  );
  button.face.add(arrow, label);
  return { button, label };
}
