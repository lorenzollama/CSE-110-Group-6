import Konva from "konva";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Square } from "./Square";

describe("Square creation", () => {
    let parent: Konva.Group;
    let square: Square;

    afterEach(() => {
        square?.destroy();
        parent?.destroy();
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it("creates a square with the default fill color", () => {
        parent = new Konva.Group();
        square = new Square(parent);

        expect(square.getFill()).toBe("white");
    });

    it("creates a square with a custom fill color", () => {
        parent = new Konva.Group();
        square = new Square(parent, {
            x: 20,
            y: 30,
            size: 60,
            fill: "blue",
        });

        expect(square.getFill()).toBe("blue");

        const rect = parent.getChildren()[0] as Konva.Rect;

        expect(rect.x()).toBe(20);
        expect(rect.y()).toBe(30);
        expect(rect.width()).toBe(60);
        expect(rect.height()).toBe(60);
    });

    it("allows the fill color to be changed", () => {
        parent = new Konva.Group();
        square = new Square(parent);

        const result = square.setFill("red");

        expect(square.getFill()).toBe("red");
        expect(result).toBe(square);
    });
});

describe("Square blinking", () => {
    let parent: Konva.Group;
    let square: Square;

    afterEach(() => {
        square?.destroy();
        parent?.destroy();
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it("lights up immediately when blinking starts", () => {
        vi.useFakeTimers();

        parent = new Konva.Group();
        square = new Square(parent);

        square.blink();

        expect(square.getFill()).toBe("lightgreen");
    });

    it("restores the original fill after one second", () => {
        vi.useFakeTimers();

        parent = new Konva.Group();
        square = new Square(parent, { fill: "blue" });

        square.blink();

        expect(square.getFill()).toBe("lightgreen");

        vi.advanceTimersByTime(999);

        expect(square.getFill()).toBe("lightgreen");

        vi.advanceTimersByTime(1);

        expect(square.getFill()).toBe("blue");
    });

    it("calls the completion callback after the blink finishes", () => {
        vi.useFakeTimers();

        parent = new Konva.Group();
        square = new Square(parent);

        const onComplete = vi.fn();

        square.blink(onComplete);

        expect(onComplete).not.toHaveBeenCalled();

        vi.advanceTimersByTime(999);

        expect(onComplete).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);

        expect(onComplete).toHaveBeenCalledOnce();
        expect(square.getFill()).toBe("white");
    });

    it("restores the original fill on consecutive blinks", () => {
        vi.useFakeTimers();

        parent = new Konva.Group();
        square = new Square(parent, { fill: "red" });

        const onComplete = vi.fn();

        square.blink(onComplete);

        vi.advanceTimersByTime(1000);

        expect(square.getFill()).toBe("red");
        expect(onComplete).toHaveBeenCalledOnce();

        square.blink(onComplete);

        expect(square.getFill()).toBe("lightgreen");

        vi.advanceTimersByTime(1000);

        expect(square.getFill()).toBe("red");
        expect(onComplete).toHaveBeenCalledTimes(2);
    });
});

describe("Square selection feedback", () => {
    let parent: Konva.Group;
    let square: Square;

    afterEach(() => {
        square?.destroy();
        parent?.destroy();
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it("highlights the square with a yellow outline", () => {
        vi.useFakeTimers();

        parent = new Konva.Group();
        square = new Square(parent);

        square.showSelectionFeedback();

        const rect = parent.getChildren()[0] as Konva.Rect;

        expect(rect.stroke()).toBe("#ffd54f");
        expect(rect.strokeWidth()).toBe(4);
    });

    it("removes the selection outline after 200 milliseconds", () => {
        vi.useFakeTimers();

        parent = new Konva.Group();
        square = new Square(parent);

        square.showSelectionFeedback();

        const rect = parent.getChildren()[0] as Konva.Rect;

        vi.advanceTimersByTime(199);

        expect(rect.stroke()).toBe("#ffd54f");
        expect(rect.strokeWidth()).toBe(4);

        vi.advanceTimersByTime(1);

        expect(rect.stroke()).toBe("");
        expect(rect.strokeWidth()).toBe(2);
    });

    it("restarts the selection feedback timer when selected again", () => {
        vi.useFakeTimers();

        parent = new Konva.Group();
        square = new Square(parent);

        const rect = parent.getChildren()[0] as Konva.Rect;

        square.showSelectionFeedback();

        vi.advanceTimersByTime(150);

        square.showSelectionFeedback();

        // The original timer would have expired, but the restarted
        // timer should keep the selection outline visible.
        vi.advanceTimersByTime(50);

        expect(rect.stroke()).toBe("#ffd54f");

        vi.advanceTimersByTime(149);

        expect(rect.stroke()).toBe("#ffd54f");

        vi.advanceTimersByTime(1);

        expect(rect.stroke()).toBe("");
        expect(rect.strokeWidth()).toBe(2);
    });

    it("cancels pending selection feedback when destroyed", () => {
        vi.useFakeTimers();

        parent = new Konva.Group();
        square = new Square(parent);

        square.showSelectionFeedback();

        expect(vi.getTimerCount()).toBe(1);

        square.destroy();

        expect(vi.getTimerCount()).toBe(0);
    });
});