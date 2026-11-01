import Konva from "konva";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Grid } from "./Grid";

describe("Grid creation", () => {
    let parent: Konva.Group;
    let grid: Grid;

    afterEach(() => {
        grid?.destroy();
        parent?.destroy();
        vi.restoreAllMocks();
    });

    it("creates a 3x3 grid by default", () => {
        parent = new Konva.Group();
        grid = new Grid(parent);

        expect(grid.getRowCount()).toBe(3);
        expect(grid.getColCount()).toBe(3);
        expect(grid.getSquares()).toHaveLength(3);

        for (const row of grid.getSquares()) {
            expect(row).toHaveLength(3);
        }
    });

    it("creates a grid with custom dimensions", () => {
        parent = new Konva.Group();
        grid = new Grid(parent, {
            rows: 2,
            cols: 4,
            squareSize: 50,
            gap: 5,
        });

        expect(grid.getRowCount()).toBe(2);
        expect(grid.getColCount()).toBe(4);

        for (const row of grid.getSquares()) {
            expect(row).toHaveLength(4);
        }
    });

    it("creates a square at every valid grid coordinate", () => {
        parent = new Konva.Group();
        grid = new Grid(parent);

        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                expect(grid.getSquare(row, col)).toBeDefined();
                expect(grid.getSquare(row, col)).toBe(
                    grid.getSquares()[row]![col]
                );
            }
        }
    });

    it("returns undefined for coordinates outside the grid", () => {
        parent = new Konva.Group();
        grid = new Grid(parent);

        expect(grid.getSquare(-1, 0)).toBeUndefined();
        expect(grid.getSquare(0, -1)).toBeUndefined();
        expect(grid.getSquare(3, 0)).toBeUndefined();
        expect(grid.getSquare(0, 3)).toBeUndefined();
    });

    it("adds a dedicated grid group to its parent", () => {
        parent = new Konva.Group();
        grid = new Grid(parent);

        expect(parent.getChildren().length).toBe(1);
        expect(parent.getChildren()[0]).toBe(grid.getGroup());
    });

    it("positions the grid group using the configured starting coordinates", () => {
        parent = new Konva.Group();
        grid = new Grid(parent, {
            startX: 100,
            startY: 200,
        });

        expect(grid.getGroup().x()).toBe(100);
        expect(grid.getGroup().y()).toBe(200);
    });
});

describe("Grid blinking", () => {
    let parent: Konva.Group;
    let grid: Grid;

    afterEach(() => {
        grid?.destroy();
        parent?.destroy();
        vi.restoreAllMocks();
    });

    it("blinks each requested square in sequence", () => {
        parent = new Konva.Group();
        grid = new Grid(parent);

        const first = grid.getSquare(0, 0)!;
        const second = grid.getSquare(1, 1)!;
        const third = grid.getSquare(2, 2)!;

        const blinkSpy = vi
            .spyOn(first, "blink")
            .mockImplementation((done) => done!());

        const secondSpy = vi
            .spyOn(second, "blink")
            .mockImplementation((done) => done!());

        const thirdSpy = vi
            .spyOn(third, "blink")
            .mockImplementation((done) => done!());

        const onComplete = vi.fn();

        grid.blink(
            [
                { row: 0, col: 0 },
                { row: 1, col: 1 },
                { row: 2, col: 2 },
            ],
            onComplete
        );

        expect(blinkSpy).toHaveBeenCalledOnce();
        expect(secondSpy).toHaveBeenCalledOnce();
        expect(thirdSpy).toHaveBeenCalledOnce();
        expect(onComplete).toHaveBeenCalledOnce();
    });

    it("waits for each blink to finish before blinking the next square", () => {
        parent = new Konva.Group();
        grid = new Grid(parent);

        const first = grid.getSquare(0, 0)!;
        const second = grid.getSquare(1, 1)!;
        const third = grid.getSquare(2, 2)!;

        const callbacks: Array<() => void> = [];

        const firstSpy = vi
            .spyOn(first, "blink")
            .mockImplementation((done) => callbacks.push(done!));

        const secondSpy = vi
            .spyOn(second, "blink")
            .mockImplementation((done) => callbacks.push(done!));

        const thirdSpy = vi
            .spyOn(third, "blink")
            .mockImplementation((done) => callbacks.push(done!));

        const onComplete = vi.fn();

        grid.blink(
            [
                { row: 0, col: 0 },
                { row: 1, col: 1 },
                { row: 2, col: 2 },
            ],
            onComplete
        );

        // Only the first square should start blinking.
        expect(firstSpy).toHaveBeenCalledOnce();
        expect(secondSpy).not.toHaveBeenCalled();
        expect(thirdSpy).not.toHaveBeenCalled();
        expect(onComplete).not.toHaveBeenCalled();

        // Finish the first blink.
        callbacks.shift()!();

        expect(secondSpy).toHaveBeenCalledOnce();
        expect(thirdSpy).not.toHaveBeenCalled();
        expect(onComplete).not.toHaveBeenCalled();

        // Finish the second blink.
        callbacks.shift()!();

        expect(thirdSpy).toHaveBeenCalledOnce();
        expect(onComplete).not.toHaveBeenCalled();

        // Finish the third blink.
        callbacks.shift()!();

        expect(onComplete).toHaveBeenCalledOnce();
        expect(callbacks).toHaveLength(0);
    });

    it("calls onComplete immediately for an empty sequence", () => {
        parent = new Konva.Group();
        grid = new Grid(parent);

        const onComplete = vi.fn();

        grid.blink([], onComplete);

        expect(onComplete).toHaveBeenCalledOnce();
    });

    it("skips invalid coordinates and continues the sequence", () => {
        parent = new Konva.Group();
        grid = new Grid(parent);

        const validSquare = grid.getSquare(1, 1)!;

        const blinkSpy = vi
            .spyOn(validSquare, "blink")
            .mockImplementation((done) => done!());

        const onComplete = vi.fn();

        grid.blink(
            [
                { row: -1, col: 0 },
                { row: 1, col: 1 },
                { row: 3, col: 3 },
            ],
            onComplete
        );

        expect(blinkSpy).toHaveBeenCalledOnce();
        expect(onComplete).toHaveBeenCalledOnce();
    });
});
