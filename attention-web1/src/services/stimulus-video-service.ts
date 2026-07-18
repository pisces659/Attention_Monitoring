import { apiFetch } from "@/lib/api-client";
import { API_ENDPOINTS, USE_API } from "@/lib/api-config";
import {
  BUILTIN_STIMULUS_ID,
  DEFAULT_STIMULUS_KEYWORDS,
  type StimulusFocusArea,
  type StimulusVideoItem,
} from "@/types/stimulus-video";
import { SESSION_STIMULUS_SLIDES, STIMULUS_SLIDE_DURATION_MS } from "@/data/session-stimulus";

const MOCK_BUILTIN: StimulusVideoItem = {
  id: BUILTIN_STIMULUS_ID,
  title: "Basic Identification (Built-in)",
  description: "Red circle, blue square, elephant, green triangle, yellow star.",
  videoUrl: "",
  keywords: DEFAULT_STIMULUS_KEYWORDS,
  focusAreas: SESSION_STIMULUS_SLIDES.map((slide, index) => ({
    id: slide.id,
    label: slide.label,
    startMs: index * STIMULUS_SLIDE_DURATION_MS,
    endMs: (index + 1) * STIMULUS_SLIDE_DURATION_MS,
    keywords: slide.keywords,
    prompt: slide.prompt,
  })),
  durationMs: SESSION_STIMULUS_SLIDES.length * STIMULUS_SLIDE_DURATION_MS,
  isDefault: true,
  isBuiltin: true,
  analysisStatus: "completed",
};

export async function fetchStimulusVideos(): Promise<StimulusVideoItem[]> {
  if (!USE_API) {
    return [MOCK_BUILTIN];
  }
  return apiFetch<StimulusVideoItem[]>(API_ENDPOINTS.stimulusVideos);
}

export async function uploadStimulusVideo(input: {
  title: string;
  description?: string;
  keywords: string;
  video: File;
}): Promise<StimulusVideoItem> {
  const formData = new FormData();
  formData.append("title", input.title);
  formData.append("description", input.description ?? "");
  formData.append("keywords", input.keywords);
  formData.append("focus_areas_json", "[]");
  formData.append("duration_ms", "0");
  formData.append("video", input.video);

  return apiFetch<StimulusVideoItem>(API_ENDPOINTS.stimulusVideos, {
    method: "POST",
    body: formData,
  });
}

export function formatFocusWindow(area: StimulusFocusArea): string {
  const start = (area.startMs / 1000).toFixed(1);
  const end = (area.endMs / 1000).toFixed(1);
  return `${start}s – ${end}s`;
}

export async function deleteStimulusVideo(id: string): Promise<void> {
  await apiFetch(`${API_ENDPOINTS.stimulusVideos}/${id}`, { method: "DELETE" });
}

export function keywordsLabel(video: StimulusVideoItem): string {
  return video.keywords.join(", ");
}
