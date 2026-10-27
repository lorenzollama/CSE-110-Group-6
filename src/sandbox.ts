// YOUR test page. Not part of the real game.
// Fakes what the main game will do so you can see your popups now.
import Konva from "konva";
import { showWrongAnswer, showLevelComplete } from "./popups";

const stage = new Konva.Stage({ container: "app", width: 800, height: 600 });

// pretend game layer
const gameLayer = new Konva.Layer();
gameLayer.add(new Konva.Rect({ width: 800, height: 600, fill: "#e0f2fe" }));
gameLayer.add(new Konva.Text({ x: 20, y: 20, text: "(pretend main game)", fontSize: 18 }));
stage.add(gameLayer);

// popup layer goes ON TOP
const popupLayer = new Konva.Layer();
stage.add(popupLayer);

showWrongAnswer(popupLayer, {
  //this can change pased on the gaming question which we will have to integrate based on user input
  question: "1/2 + 1/4",
  playerAnswer: "2/6",
  correctAnswer: "3/4",
  explanation: "You can't add the tops and bottoms. Make the denominators match first: 1/2 = 2/4, so 2/4 + 1/4 = 3/4.",
}, () => {
  // after "Got it", show the level-complete popup
  //this part has to be modifed to change so the player can finished the game

  showLevelComplete(popupLayer, { level: 1, score: 340, accuracy: 85 }, {
    onNextLevel: () => console.log("next level"),
    onMenu: () => console.log("menu"),
  });
});
