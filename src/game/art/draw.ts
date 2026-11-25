import Konva from 'konva';

// Each picture is drawn onto a canvas once and shared, so a scrap costs one image, not 200 squares.
const canvases = new WeakMap<string[], HTMLCanvasElement>();

function spriteCanvas(rows: string[], colors: Record<string, string>, pixel: number): HTMLCanvasElement {
  const cached = canvases.get(rows);
  if (cached) return cached;

  // Draw at the screen's sharpness (2x on a Retina display) so the squares stay crisp.
  const sharpness = Math.ceil(window.devicePixelRatio || 1);
  const square = pixel * sharpness;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(...rows.map(row => row.length)) * square;
  canvas.height = rows.length * square;

  const context = canvas.getContext('2d')!;
  rows.forEach((row, y) => {
    [...row].forEach((letter, x) => {
      const fill = colors[letter];
      if (!fill) return; // "." is see-through
      context.fillStyle = fill;
      context.fillRect(x * square, y * square, square, square);
    });
  });

  canvases.set(rows, canvas);
  return canvas;
}

/** A pixel-art picture as one Konva image, its top-left corner at 0, 0 and `pixel` screen pixels per square. */
export function spriteImage(rows: string[], colors: Record<string, string>, pixel: number): Konva.Image {
  const canvas = spriteCanvas(rows, colors, pixel);
  const sharpness = Math.ceil(window.devicePixelRatio || 1);
  return new Konva.Image({
    image: canvas,
    width: canvas.width / sharpness,
    height: canvas.height / sharpness,
    listening: false,
  });
}
