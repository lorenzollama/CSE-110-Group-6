/**
 * Start screen MODEL: the start screen's data and rules.
 * No drawing (no Konva) and no clicks, which makes it the easiest part to unit test.
 */
export class StartModel {
  // TODO: the list of buttons the start screen offers. For each button:
  //   - the label shown on it (e.g. "Play")
  //   - the screen it opens (e.g. { type: "game" }, see Screen in types.ts),
  //     or nothing yet if that teammate hasn't connected their game
  // TODO: a way to ask "what does this button open?", so the controller
  //   asks the model instead of deciding itself
}
