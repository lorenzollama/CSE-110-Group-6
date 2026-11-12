/**
 * Topic select CONTROLLER: connects the TopicSelectModel and TopicSelectView.
 * Picking a topic saves it in the model and opens that topic's levels;
 * Back returns to the start screen.
 */
import { ScreenController } from "../../types";
import type { ScreenSwitcher, Topic } from "../../types";
import { TopicSelectModel } from "./TopicSelectModel";
import { TopicSelectView } from "./TopicSelectView";

export class TopicSelectController extends ScreenController {
  private model = new TopicSelectModel();
  private view: TopicSelectView;
  private screenSwitcher: ScreenSwitcher;

  constructor(screenSwitcher: ScreenSwitcher) {
    super();
    this.screenSwitcher = screenSwitcher;
    this.view = new TopicSelectView(
      this.model.getOptions(),
      (topic) => this.handleTopicClick(topic),
      () => this.screenSwitcher.switchToScreen({ type: "menu" }),
    );
  }

  private handleTopicClick(topic: Topic): void {
    this.model.selectTopic(topic);
    this.screenSwitcher.switchToScreen({ type: "levels", topic });
  }

  getSelectedTopic(): Topic | null {
    return this.model.getSelectedTopic();
  }

  getView(): TopicSelectView {
    return this.view;
  }
}
