import { describe, expect, it } from "vitest";
import { TopicSelectModel } from "./TopicSelectModel";

describe("TopicSelectModel", () => {
  it("offers multiplication, division, and simplification in that order", () => {
    const topics = new TopicSelectModel().getOptions().map((o) => o.topic);
    expect(topics).toEqual(["multiplication", "division", "simplification"]);
  });

  it("starts with no topic selected", () => {
    expect(new TopicSelectModel().getSelectedTopic()).toBe(null);
  });

  it("remembers the most recently selected topic", () => {
    const model = new TopicSelectModel();
    model.selectTopic("division");
    model.selectTopic("simplification");
    expect(model.getSelectedTopic()).toBe("simplification");
  });
});
