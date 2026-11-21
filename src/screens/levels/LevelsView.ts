import Konva from "konva";
import type {View} from "../../types";
import {makeButton} from "../../popups/PopupView";
import {STAGE_WIDTH} from "../start/StartView";
import {sounds} from "../../audio/sounds";

export class LevelsView implements View {
    private group = new Konva.Group({visible: false});
    private levelButtons = new Konva.Group();
    private onLevelClick: (level: number) => void;
    private title: Konva.Text;
    private totalScoreText: Konva.Text;

    constructor(onLevelClick: (level: number) => void, onBack:()=> void) {
        this.onLevelClick = onLevelClick;
        const title = this.title = new Konva.Text({
                    x: STAGE_WIDTH / 2,
                    y: 60,
                    text: "Levels",
                    fontSize: 48,
                    fontFamily: "Arial",
                    fill: "black",
                    stroke: "black",
                    strokeWidth: 2,
                    align: "center",
                });
        title.offsetX(title.width() / 2);
        this.group.add(title);

        // The topic's high score, under the title. Its text is set in showLevels().
        this.totalScoreText = new Konva.Text({
            x: STAGE_WIDTH / 2,
            y: 125,
            fontSize: 22,
            fontFamily: "Arial",
            fill: "#374151",
        });
        this.group.add(this.totalScoreText);
        this.group.add(this.levelButtons);
    
        this.group.add(makeButton(STAGE_WIDTH / 2 - 75, 500, "Back", onBack, "#6b7280"));


        
    }

    /** Changes the heading, e.g. "Division Levels". */
    setTitle(text: string): void {
        this.title.text(text);
        this.title.offsetX(this.title.width() / 2);
    }

    /** Draws every level button as done, current, or locked, and the topic's total score. */
    showLevels(totalLevels: number, unlockedLevels: number, totalScore: number): void {
        this.totalScoreText.text(`Total score: ${totalScore}`);
        this.totalScoreText.offsetX(this.totalScoreText.width() / 2); // keep it centered
        this.levelButtons.destroyChildren();
        for(let level = 1; level <= totalLevels; level++) {
            const index = level - 1;
            const x = 160 + (index % 5) * 120;
            const y = 230 + Math.floor(index / 5) * 150;
            const isCurrent = level === unlockedLevels;
            
            let color = '#9ca3af'
            if(level < unlockedLevels) {
                color = '#16a34a';
            }else if (isCurrent) {
                color = '#4f46e5';
            }

            const button = new Konva.Group({x,y});
            button.add(new Konva.Circle({
                radius: 30,
                fill: color,
                stroke: isCurrent ? "#facc15" : "black",
                strokeWidth: isCurrent ? 5 : 2,
            }));
            button.add(new Konva.Text({
                x: -30,
                y: -14,
                width: 60,
                text: String(level),
                fontSize: 28,
                fontStyle: "bold",
                fill: "white",
                align: "center"
            }));

            if(level <= unlockedLevels) {
                button.on("click", () => {
                    sounds.playClick(); // the same blip as every other button
                    this.onLevelClick(level);
                });
                button.on("mouseenter", () => {
                    document.body.style.cursor = "pointer";
                });
                button.on("mouseleave", () => {
                    document.body.style.cursor = "default";
                });
            }
            this.levelButtons.add(button);
        }
        
       this.group.getLayer()?.batchDraw();
    }

    show(): void {
        this.group.visible(true);
        this.group.getLayer()?.batchDraw();
    }
    hide(): void {
        this.group.visible(false);
        this.group.getLayer()?.batchDraw();
    }
    getGroup(): Konva.Group {
        return this.group;
    }
}