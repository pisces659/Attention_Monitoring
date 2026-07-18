export interface StimulusSlide {
  id: string;
  prompt: string;
  label: string;
  background: string;
  accent: string;
  shape: "circle" | "square" | "triangle" | "star" | "word";
  word?: string;
  keywords: string[];
}

/** Basic identification slides shown to the child during session recording. */
export const SESSION_STIMULUS_SLIDES: StimulusSlide[] = [
  {
    id: "red-circle",
    prompt: "What color is this?",
    label: "Red circle",
    background: "#FEE2E2",
    accent: "#DC2626",
    shape: "circle",
    keywords: ["red"],
  },
  {
    id: "blue-square",
    prompt: "What shape is this?",
    label: "Blue square",
    background: "#DBEAFE",
    accent: "#2563EB",
    shape: "square",
    keywords: ["square"],
  },
  {
    id: "elephant",
    prompt: "What animal is this?",
    label: "Elephant",
    background: "#F3F4F6",
    accent: "#4B5563",
    shape: "word",
    word: "ELEPHANT",
    keywords: ["elephant"],
  },
  {
    id: "green-triangle",
    prompt: "What color is this shape?",
    label: "Green triangle",
    background: "#DCFCE7",
    accent: "#16A34A",
    shape: "triangle",
    keywords: ["green"],
  },
  {
    id: "yellow-star",
    prompt: "How many points does this star have?",
    label: "Yellow star",
    background: "#FEF9C3",
    accent: "#CA8A04",
    shape: "star",
    keywords: ["star"],
  },
];

export const STIMULUS_SLIDE_DURATION_MS = 5000;

export const DEFAULT_STIMULUS_KEYWORDS = SESSION_STIMULUS_SLIDES.flatMap(
  (slide) => slide.keywords
);
