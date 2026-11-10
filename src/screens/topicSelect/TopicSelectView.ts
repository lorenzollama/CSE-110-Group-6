import Konva from "konva";
import type { Topic, View } from "../../types";
import type { TopicOption } from "./TopicSelectModel";
import { makeButton } from "../../popups/PopupView";
import { STAGE_WIDTH } from "../start/StartView";

const BUTTON_WIDTH = 260;
const FIRST_BUTTON_Y = 220;
const BUTTON_GAP = 70;

/**
 * Topic select VIEW: draws a title and one button per topic with Konva.
 * It decides nothing. Clicks are only reported; the controller decides what happens.
 */
export class TopicSelectView implements View {
  private group = new Konva.Group({ visible: false });

  constructor(
    options: readonly TopicOption[],
    onTopicClick: (topic: Topic) => void,
    onBackClick: () => void,
  ) {
    this.group.add(new Konva.Text({
      y: 120, width: STAGE_WIDTH, text: "Choose a Topic", fontSize: 48,
      fontFamily: "Arial", fill: "purple", stroke: "purple", strokeWidth: 2,
      align: "center",
    }));

    const buttonX = (STAGE_WIDTH - BUTTON_WIDTH) / 2;
    options.forEach((option, i) => {
      this.group.add(makeButton(
        buttonX, FIRST_BUTTON_Y + i * BUTTON_GAP, option.label,
        () => onTopicClick(option.topic), "green", BUTTON_WIDTH,
      ));
    });

    this.group.add(makeButton(20, 520, "Back", onBackClick, "gray", 100));
  }

  show(): void {
    this.group.visible(true);
    this.group.getLayer()?.draw();
  }

  hide(): void {
    this.group.visible(false);
    this.group.getLayer()?.draw();
  }

  getGroup(): Konva.Group {
    return this.group;
  }
}
