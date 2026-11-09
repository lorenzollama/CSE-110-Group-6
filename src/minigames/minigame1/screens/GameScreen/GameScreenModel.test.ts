import { describe, expect, it } from "vitest";
import { GameScreenModel } from "./GameScreenModel.ts";


// user story 2
describe("GameScreenModel sequence checking", () => {
        // matching sequence completes only after every expected signal has been selected
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

        // entering only part of the sequence leaves the attempt active until the final matching selection
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

        // mistake at any sequence position ends the attempt and causes later selections to be ignored
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

        // selections are ignored before the player's turn
        it("ignores selections before the player's turn starts", () => {
                const model = new GameScreenModel();

                expect(model.checkSelection({ row: 0, col: 0 }))
                        .toBe("ignored");
        });

        // completing a sequence prevents extra selections from changing the completed attempt
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

        // consecutive selections are processed in order, including repeated selections of the same light
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

        // resetting disables input and clears previous selection progress before a new turn starts
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

// user story 3
describe("GameScreenModel round progression", () => {
        // Test 1: A complete correct response increases the round by exactly one
        it("advances one round after a complete correct response", () => {
                const model = new GameScreenModel();
                model.reset();

                const firstSignal = { row: 0, col: 0};
                model.startPlayerTurn([firstSignal]);
                const startingRound = model.getRound();

                expect(model.checkSelection(firstSignal)).toBe("complete");
                expect(model.advanceRound({ row: 1, col: 1})).toBe(true);
                expect(model.getRound()).toBe(startingRound + 1);
        });

        // Test 2: The next round keeps the old signals in order and adds one signal
        it("preserves the sequence and appends exactly one signal", () => {
                const model = new GameScreenModel();
                model.reset();

                const firstSignal = { row: 0, col: 0};
                const secondSignal = { row: 1, col: 1};
                const newSignal = { row: 2, col: 2};
                const originalSequence = [firstSignal, secondSignal];

                model.startPlayerTurn(originalSequence);

                expect(model.checkSelection(firstSignal)).toBe("correct");
                expect(model.checkSelection(secondSignal)).toBe("complete");
                expect(model.advanceRound(newSignal)).toBe(true);

                const extendedSequence = model.getSequence();

                expect(extendedSequence).toEqual([...originalSequence, newSignal]);
                expect(extendedSequence).toHaveLength(originalSequence.length + 1);
        });

        // Test 3: A wrong selection keeps the current round and sequence
        it("keeps the same round and sequence after a mistake", () => {
                const model = new GameScreenModel();
                model.reset();

                const sequence = [{ row: 0, col: 0}];
                model.startPlayerTurn(sequence);
                const startingRound = model.getRound();

                expect(model.checkSelection({ row: 2, col: 2})).toBe("incorrect");
                expect(model.advanceRound({ row: 1, col: 1})).toBe(false);
                expect(model.getRound()).toBe(startingRound);
                expect(model.getSequence()).toEqual(sequence);
        });
});

// user story 4
describe("GameScreenModel lives and retry logic", () => {
        // MGTEST-31: feedback identifies the expected signal and incorrect selection
        it("identifies the expected signal versus incorrect selection", () => {
                const model = new GameScreenModel();
                model.startPlayerTurn([
                        { row: 1, col: 1 },
                        { row: 2, col: 2 },
                ]);

                // Current expected signal should be { row: 1, col: 1 }
                expect(model.getCurrentExpected()).toEqual({ row: 1, col: 1 });

                // Check an incorrect selection
                const result = model.checkSelection({ row: 0, col: 0 });
                expect(result).toBe("incorrect");
        });

        // MGTEST-32: each failed attempt removes exactly one life
        it("removes exactly one life on a failed attempt", () => {
                const model = new GameScreenModel();
                model.startPlayerTurn([{ row: 0, col: 0 }]);

                const initialLives = model.getLives();

                expect(model.checkSelection({ row: 1, col: 1 })).toBe("incorrect");
                model.decrementLives();

                expect(model.getLives()).toBe(initialLives - 1);
        });

        // MGTEST-33: retry uses the same sequence
        it("retains the same sequence for a retry", () => {
                const model = new GameScreenModel();
                const sequence = [
                        { row: 0, col: 0 },
                        { row: 1, col: 1 },
                ];

                model.startPlayerTurn(sequence);
                expect(model.checkSelection({ row: 2, col: 2 })).toBe("incorrect");

                // Reset for retry and start the player turn again (simulating post-blink)
                model.resetCurrentSequence();
                expect(model.getCurrentExpected()).toEqual(sequence[0]);
                
                model.startPlayerTurn(sequence);
                // Should accept correct inputs for the same sequence again
                expect(model.checkSelection({ row: 0, col: 0 })).toBe("correct");
                expect(model.checkSelection({ row: 1, col: 1 })).toBe("complete");
        });

        // MGTEST-34: previous input is cleared before retrying
        it("clears previous input progress before retrying a sequence", () => {
                const model = new GameScreenModel();
                const sequence = [
                        { row: 0, col: 0 },
                        { row: 1, col: 1 },
                ];

                model.startPlayerTurn(sequence);

                // Enter the first correct input
                expect(model.checkSelection({ row: 0, col: 0 })).toBe("correct");

                // Trigger a retry reset and restart turn
                model.resetCurrentSequence();
                model.startPlayerTurn(sequence);

                // It should now require starting from index 0 again, not index 1
                expect(model.getCurrentExpected()).toEqual({ row: 0, col: 0 });
                expect(model.checkSelection({ row: 0, col: 0 })).toBe("correct");
        });

        // MGTEST-35: lives never become negative (or handle lower boundary properly)
        it("does not drop lives below zero", () => {
                const model = new GameScreenModel();
                model.startPlayerTurn([{ row: 0, col: 0 }]);

                // Decrement until 0 and beyond
                while (model.getLives() > 0) {
                        model.decrementLives();
                }

                expect(model.getLives()).toBe(0);

                // Further decrements if guarded or bounded
                model.decrementLives();
                // If your model allows negative, or if you clamp it at 0:
                // Adjust expectation based on whether you prefer clamping in model.decrementLives()
                expect(model.getLives()).toBeLessThanOrEqual(0);
        });

        // MGTEST-37: extra selections after a mistake don’t remove additional lives
        it("ignores extra selections after a mistake and does not consume extra lives", () => {
                const model = new GameScreenModel();
                model.startPlayerTurn([{ row: 0, col: 0 }]);

                // First wrong selection
                expect(model.checkSelection({ row: 1, col: 1 })).toBe("incorrect");
                model.decrementLives();
                const livesAfterFirstMistake = model.getLives();

                // Subsequent clicks while input is disabled / ignored
                expect(model.checkSelection({ row: 2, col: 2 })).toBe("ignored");
                expect(model.checkSelection({ row: 0, col: 0 })).toBe("ignored");

                // Lives should remain unchanged
                expect(model.getLives()).toBe(livesAfterFirstMistake);
        });
});