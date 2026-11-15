import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ResultsScreenModel } from "./ResultsScreenModel.ts";

// user story 6
describe("ResultsScreenModel personal best", () => {
        // Give each test an empty copy of browser storage
        beforeEach(() => {
                const savedValues = new Map<string, string>();

                vi.stubGlobal("localStorage", {
                        getItem: (key: string) => savedValues.get(key) ?? null,
                        setItem: (key: string, value: string) => {
                                savedValues.set(key, value);
                        },
                });
        });

        // Restore the original browser storage after each test
        afterEach(() => {
                vi.unstubAllGlobals();
        });

        // Test 1: A player has no personal best before finishing a run
        it("returns null before the first finished run", () => {
                const model = new ResultsScreenModel();

                expect(model.loadPersonalBest()).toBeNull();
        });

        // Test 2: The first finished run is saved even with zero completed rounds
        it("saves a first run with zero completed rounds", () => {
                const model = new ResultsScreenModel();

                model.savePersonalBest(0);

                expect(model.loadPersonalBest()).toBe(0);
        });

        // Test 3: A better result replaces the saved personal best
        it("updates the record when the player beats it", () => {
                const model = new ResultsScreenModel();
                model.savePersonalBest(2);

                model.savePersonalBest(4);

                expect(model.loadPersonalBest()).toBe(4);
        });

        // Tests 4 and 5: Lower and tied results keep the saved personal best
        it.each([1, 3])("keeps a record of 3 after a run of %i", (rounds) => {
                const model = new ResultsScreenModel();
                model.savePersonalBest(3);

                model.savePersonalBest(rounds);

                expect(model.loadPersonalBest()).toBe(3);
        });

        // Test 6: A new model can load the record saved by an earlier model
        it("loads the saved record from a new model instance", () => {
                const firstModel = new ResultsScreenModel();
                firstModel.savePersonalBest(5);

                const newModel = new ResultsScreenModel();

                expect(newModel.loadPersonalBest()).toBe(5);
        });
});