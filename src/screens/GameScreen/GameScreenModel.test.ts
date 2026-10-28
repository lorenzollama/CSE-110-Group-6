import { describe, expect, it } from "vitest";
import { GameScreenModel } from "./GameScreenModel.ts";

/**
 * Tests player input and sequence checking for User Story 2
 */
describe("GameScreenModel sequence checking", () => {
        /**
         * Verifies that a matching sequence completes only after
         * every expected signal has been selected
         */
        it("completes the round when the entire sequence matches", () => {
                const model = new GameScreenModel();

                model.startPlayerTurn([
                        { row: 0, col: 0 },
                        { row: 1, col: 1 },
                ]);

                expect(model.checkSelection({ row: 0, col: 0 }))
                        .toBe("correct");

                expect(model.checkSelection({ row: 1, col: 1 }))
                        .toBe("complete");
        });

        /**
         * Verifies that entering only part of the sequence
         * leaves the attempt active until the final matching selection
         */
        it("does not complete the round for an incomplete sequence", () => {
                const model = new GameScreenModel();

                model.startPlayerTurn([
                        { row: 0, col: 0 },
                        { row: 1, col: 1 },
                        { row: 2, col: 2 },
                ]);

                expect(model.checkSelection({ row: 0, col: 0 }))
                        .toBe("correct");

                expect(model.checkSelection({ row: 1, col: 1 }))
                        .toBe("correct");

                expect(model.checkSelection({ row: 2, col: 2 }))
                        .toBe("complete");
        });

        /**
         * Verifies that a mistake at any sequence position ends
         * the attempt and causes later selections to be ignored
         */
        it.each([0, 1, 2])(
                "detects a wrong selection at sequence index %i",
                (mistakeIndex) => {
                        const model = new GameScreenModel();
                        const sequence = [
                                { row: 0, col: 0 },
                                { row: 1, col: 1 },
                                { row: 2, col: 2 },
                        ];

                        model.startPlayerTurn(sequence);

                        // Enter the correct signals preceding the mistake
                        for (let index = 0; index < mistakeIndex; index++) {
                                expect(model.checkSelection(sequence[index]!))
                                        .toBe("correct");
                        }

                        // This light differs from every expected signal
                        expect(model.checkSelection({ row: 2, col: 0 }))
                                .toBe("incorrect");

                        // Even the expected light is ignored after failure
                        expect(model.checkSelection(sequence[mistakeIndex]!))
                                .toBe("ignored");
                }
        );

        /**
         * Verifies that selections are ignored before the player's turn
         */
        it("ignores selections before the player's turn starts", () => {
                const model = new GameScreenModel();

                expect(model.checkSelection({ row: 0, col: 0 }))
                        .toBe("ignored");
        });

        /**
         * Verifies that completing a sequence prevents extra selections
         * from changing the completed attempt
         */
        it("ignores extra selections after completing the sequence", () => {
                const model = new GameScreenModel();

                model.startPlayerTurn([{ row: 0, col: 0 }]);

                expect(model.checkSelection({ row: 0, col: 0 }))
                        .toBe("complete");

                expect(model.checkSelection({ row: 0, col: 0 }))
                        .toBe("ignored");

                expect(model.checkSelection({ row: 2, col: 2 }))
                        .toBe("ignored");
        });

        /**
         * Verifies that consecutive selections are processed in order,
         * including repeated selections of the same light
         */
        it("handles rapid selections and repeated signals in order", () => {
                const model = new GameScreenModel();

                model.startPlayerTurn([
                        { row: 0, col: 0 },
                        { row: 0, col: 0 },
                        { row: 1, col: 1 },
                ]);

                // Submit selections consecutively without waiting.
                const results = [
                        model.checkSelection({ row: 0, col: 0 }),
                        model.checkSelection({ row: 0, col: 0 }),
                        model.checkSelection({ row: 1, col: 1 }),
                ];

                expect(results).toEqual([
                        "correct",
                        "correct",
                        "complete",
                ]);
        });

        /**
         * Verifies that resetting disables input and clears previous
         * selection progress before a new turn starts
         */
        it("clears input progress and disables selections after reset", () => {
                const model = new GameScreenModel();
                const sequence = [
                        { row: 0, col: 0 },
                        { row: 1, col: 1 },
                ];

                model.startPlayerTurn(sequence);

                expect(model.checkSelection({ row: 0, col: 0 }))
                        .toBe("correct");

                model.reset();

                expect(model.checkSelection({ row: 1, col: 1 }))
                        .toBe("ignored");

                model.startPlayerTurn(sequence);

                expect(model.checkSelection({ row: 0, col: 0 }))
                        .toBe("correct");

                expect(model.checkSelection({ row: 1, col: 1 }))
                        .toBe("complete");
        });
});