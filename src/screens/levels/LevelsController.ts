import {ScreenController, type ScreenSwitcher, type Topic} from "../../types";
import {LevelsView} from "./LevelsView";
import {TOTAL_LEVELS, type LevelsByTopic} from "./LevelsModel";
import {TOPIC_OPTIONS} from "../topicSelect/TopicSelectModel";

export class LevelsController extends ScreenController {
    private view: LevelsView;
    private topic: Topic = "multiplication";

    constructor(private screenSwitcher: ScreenSwitcher, private levelsByTopic: LevelsByTopic) {
        super();
        this.view = new LevelsView(
            (level: number) => this.screenSwitcher.switchToScreen({ type: "main game", topic: this.topic, level }),
            () => this.screenSwitcher.switchToScreen({ type: "topic select" })
        );
    }

    /** Sets whose levels to show. Call before show(). */
    setTopic(topic: Topic): void {
        this.topic = topic;
    }

    getView(): LevelsView {
        return this.view;
    }

    show(): void {
        const label = TOPIC_OPTIONS.find(option => option.topic === this.topic)?.label ?? "";
        this.view.setTitle(`${label} Levels`);
        this.view.showLevels(TOTAL_LEVELS, this.levelsByTopic[this.topic].getUnlockedLevels());
        super.show();
    }
}
