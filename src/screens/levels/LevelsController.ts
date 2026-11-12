import {ScreenController, type ScreenSwitcher} from "../../types";
import {LevelsView} from "./LevelsView";
import {LevelsModel, TOTAL_LEVELS} from "./LevelsModel";

export class LevelsController extends ScreenController {
    private view: LevelsView;

    constructor(private screenSwitcher: ScreenSwitcher, private model: LevelsModel) {
        super();
        this.view = new LevelsView(
            (level: number) => this.screenSwitcher.switchToScreen({ type: "main game", level }),
            () => this.screenSwitcher.switchToScreen({ type: "menu" })
        );
    }

    getView(): LevelsView {
        return this.view;
    }

    show(): void {
        this.view.showLevels(TOTAL_LEVELS, this.model.getUnlockedLevels());
        super.show();
    }
}