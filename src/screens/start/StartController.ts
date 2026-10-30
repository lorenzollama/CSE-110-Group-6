/**
 * Start screen CONTROLLER: connects the StartModel and the StartView.
 * When a button is clicked, it asks the model which screen that button opens,
 * then asks the App to switch to it with switchToScreen().
 */
import { ScreenController } from "../../types";
import type { ScreenSwitcher } from "../../types";
import { StartView } from "./StartView";

export class StartController extends ScreenController {
  // TODO: extend ScreenController from types.ts (it requires a getView() method)
  private view: StartView;
  private screenSwitcher: ScreenSwitcher;
  // TODO: the constructor gets the ScreenSwitcher (that's the App), so a click can switch screens
  constructor(screenSwitcher: ScreenSwitcher){
    super();
    this.screenSwitcher = screenSwitcher;
    this.view = new StartView(() => this.handleStartClick());
  }
  // TODO: create the StartModel and StartView, and tell the view what each button click should do
  //main game button
  private handleStartClick():void{
    this.screenSwitcher.switchToScreen({type : "main game"})
  }
  //mini game 1 button
  //mini game 2 button
  getView(): StartView {
    return this.view;
  }
}
