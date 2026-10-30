// All the game's popups. The only file teammates need to import from.
import Konva from "konva";

// ---------- Types ----------
// The data the main game hands to the popups.
// Share these with your team: they're the "contract".

export interface WrongAnswerInfo {
  question: string;      // e.g. "1/2 + 1/4"
  playerAnswer: string;  // what they typed, e.g. "2/6"
  correctAnswer: string; // e.g. "3/4"
  explanation: string;   // why, e.g. "Use a common denominator: 2/4 + 1/4 = 3/4"
}

export interface LevelCompleteInfo {
  level: number;
  score: number;
  accuracy: number; // 0–100
}

export interface PopupHandle {
  close: () => void;
}

// ---------- Shared helpers (not exported) ----------

// Dark background + centered white box.
// Every popup uses this so they all look the same.
function makePopupFrame(layer: Konva.Layer, boxW: number, boxH: number) {
  const { width, height } = layer.getStage().size();
  const root = new Konva.Group();
  root.add(new Konva.Rect({ width, height, fill: "black", opacity: 0.55 })); // blocks clicks to the game

  const box = new Konva.Group({ x: (width - boxW) / 2, y: (height - boxH) / 2 });
  box.add(new Konva.Rect({
    width: boxW, height: boxH, fill: "white", cornerRadius: 16,
    shadowColor: "black", shadowBlur: 20, shadowOpacity: 0.3,
  }));
  root.add(box);

  // little fade-in
  root.opacity(0);
  layer.add(root);
  new Konva.Tween({ node: root, opacity: 1, duration: 0.2 }).play();

  // reset cursor too: mouseleave never fires when a button is destroyed under the mouse
  const close = () => { document.body.style.cursor = "default"; root.destroy(); layer.batchDraw(); };
  return { root, box, close };
}

function makeButton(
  x: number, y: number, label: string, onClick: () => void,
  color = "#4f46e5", width = 150
): Konva.Group {
  const group = new Konva.Group({ x, y });
  group.add(new Konva.Rect({ width, height: 44, fill: color, cornerRadius: 10 }));
  group.add(new Konva.Text({
    width, y: 13, text: label, fontSize: 18, fill: "white", align: "center",
  }));
  group.on("click tap", onClick);
  group.on("mouseenter", () => { document.body.style.cursor = "pointer"; });
  group.on("mouseleave", () => { document.body.style.cursor = "default"; });
  return group;
}

// ---------- Popups ----------

// Shows: "Not quite!", the question, what they typed, the right answer, and WHY.
export function showWrongAnswer(
  layer: Konva.Layer,
  info: WrongAnswerInfo,
  onContinue: () => void
): PopupHandle {
  const W = 420, H = 320;
  const { box, close } = makePopupFrame(layer, W, H);

  box.add(new Konva.Text({
    y: 22, width: W, text: "Not quite!", fontSize: 28, fontStyle: "bold",
    fill: "#dc2626", align: "center",
  }));
  box.add(new Konva.Text({
    x: 30, y: 70, width: W - 60, fontSize: 18, lineHeight: 1.5,
    text: `Question: ${info.question}\nYou answered: ${info.playerAnswer}\nCorrect answer: ${info.correctAnswer}`,
  }));
  box.add(new Konva.Text({
    x: 30, y: 160, width: W - 60, fontSize: 16, lineHeight: 1.4, fill: "#374151",
    text: `Why: ${info.explanation}`,   // wraps automatically because width is set
  }));

  box.add(makeButton((W - 150) / 2, H - 66, "Got it", () => { close(); onContinue(); }));
  layer.batchDraw();
  return { close };
}

export function showLevelComplete(
  layer: Konva.Layer,
  info: LevelCompleteInfo,
  actions: { onNextLevel: () => void; onMenu: () => void }
): PopupHandle {
  const W = 420, H = 300;
  const { box, close } = makePopupFrame(layer, W, H);

  const title = new Konva.Text({
    y: 28, width: W, text: "🎉 Congrats!", fontSize: 34, fontStyle: "bold",
    fill: "#16a34a", align: "center",
  });
  box.add(title);
  box.add(new Konva.Text({
    y: 80, width: W, fontSize: 20, align: "center",
    text: `You passed Level ${info.level}`,
  }));
  box.add(new Konva.Text({
    y: 125, width: W, fontSize: 18, align: "center", fill: "#374151", lineHeight: 1.5,
    text: `Score: ${info.score}\nAccuracy: ${info.accuracy}%`,
  }));

  box.add(makeButton(40, H - 70, "Next level", () => { close(); actions.onNextLevel(); }, "#16a34a"));
  box.add(makeButton(230, H - 70, "Menu", () => { close(); actions.onMenu(); }, "#6b7280"));

  // small "pop" on the title
  title.scale({ x: 0.6, y: 0.6 });
  new Konva.Tween({ node: title, scaleX: 1, scaleY: 1, duration: 0.3, easing: Konva.Easings.BackEaseOut }).play();

  layer.batchDraw();
  return { close };
}
