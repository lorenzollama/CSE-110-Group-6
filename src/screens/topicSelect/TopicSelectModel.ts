/**
 * Topic select MODEL: which topics the player can pick, and which one they picked.
 * No drawing (no Konva) and no clicks, so it's easy to unit test.
 */
import type { Topic } from "../../types";

export interface TopicOption {
  topic: Topic;
  label: string;
}

export const TOPIC_OPTIONS: readonly TopicOption[] = [
  { topic: "multiplication", label: "Multiplication" },
  { topic: "division", label: "Division" },
  { topic: "simplification", label: "Simplification" },
];

export class TopicSelectModel {
  private selected: Topic | null = null;

  /** The topics shown on the screen, in order. */
  getOptions(): readonly TopicOption[] {
    return TOPIC_OPTIONS;
  }

  selectTopic(topic: Topic): void {
    this.selected = topic;
  }

  /** The topic the player last picked, or null if they haven't picked one yet. */
  getSelectedTopic(): Topic | null {
    return this.selected;
  }
}
