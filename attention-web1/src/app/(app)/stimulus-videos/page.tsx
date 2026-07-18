"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import PageHeader from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { resolveMediaUrl } from "@/lib/api-config";
import {
  deleteStimulusVideo,
  fetchStimulusVideos,
  formatFocusWindow,
  keywordsLabel,
  uploadStimulusVideo,
} from "@/services/stimulus-video-service";
import type { StimulusFocusArea, StimulusVideoItem } from "@/types/stimulus-video";

function FocusAreasTable({ focusAreas }: { focusAreas: StimulusFocusArea[] }) {
  if (!focusAreas.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No timing windows detected yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/40 text-left">
          <tr>
            <th className="px-3 py-2 font-medium">Segment</th>
            <th className="px-3 py-2 font-medium">Expected word</th>
            <th className="px-3 py-2 font-medium">Response window</th>
            <th className="px-3 py-2 font-medium">Prompt</th>
          </tr>
        </thead>
        <tbody>
          {focusAreas.map((area) => (
            <tr key={area.id} className="border-t border-border">
              <td className="px-3 py-2">{area.label}</td>
              <td className="px-3 py-2 font-medium">{area.keywords.join(", ")}</td>
              <td className="px-3 py-2 font-mono text-xs">
                {formatFocusWindow(area)}
              </td>
              <td className="px-3 py-2 text-muted-foreground">{area.prompt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function StimulusVideosPage() {
  const [videos, setVideos] = useState<StimulusVideoItem[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [videoFile, setVideoFile] = useState<File | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [latestUpload, setLatestUpload] = useState<StimulusVideoItem | null>(null);

  async function loadVideos() {
    setVideos(await fetchStimulusVideos());
  }

  useEffect(() => {
    loadVideos().catch(() => setError("Could not load stimulus videos."));
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLatestUpload(null);

    if (!videoFile) {
      setError("Please choose a stimulus video file.");
      return;
    }

    setSubmitting(true);
    try {
      const uploaded = await uploadStimulusVideo({
        title,
        description,
        keywords,
        video: videoFile,
      });
      setLatestUpload(uploaded);
      setTitle("");
      setDescription("");
      setKeywords("");
      setVideoFile(undefined);
      await loadVideos();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Upload failed."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        title="Stimulus video library"
        description="Upload sample videos used during session recording. Each upload is analyzed to detect segment timings and expected spoken responses."
      />

      <Card className="border-0 shadow-sm ring-1 ring-border/60">
        <CardHeader>
          <CardTitle>Upload stimulus video</CardTitle>
          <CardDescription>
            Keywords are optional — leave blank to infer from the video audio.
            When provided, each keyword is mapped to a response window using scene
            detection or equal time segments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="keywords">Expected keywords (optional, in order)</Label>
              <Input
                id="keywords"
                value={keywords}
                onChange={(event) => setKeywords(event.target.value)}
                placeholder="Leave blank to infer from video audio, or e.g. red, square, elephant"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="video">Video file</Label>
              <Input
                id="video"
                type="file"
                accept="video/*"
                onChange={(event) => setVideoFile(event.target.files?.[0])}
                required
              />
            </div>
            {error ? <p className="text-sm text-[#EF4444]">{error}</p> : null}
            <Button type="submit" disabled={submitting}>
              {submitting ? "Uploading and analyzing..." : "Upload and analyze"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {latestUpload ? (
        <Card className="border-0 shadow-sm ring-1 ring-emerald-200/70">
          <CardHeader>
            <CardTitle>Analysis results: {latestUpload.title}</CardTitle>
            <CardDescription>
              Status: {latestUpload.analysisStatus ?? "completed"}
              {latestUpload.durationMs
                ? ` · Duration ${(latestUpload.durationMs / 1000).toFixed(1)}s`
                : null}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {latestUpload.videoUrl ? (
              <video
                className="max-h-64 w-full rounded-lg bg-black"
                controls
                src={resolveMediaUrl(latestUpload.videoUrl)}
              />
            ) : null}
            <FocusAreasTable focusAreas={latestUpload.focusAreas} />
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-0 shadow-sm ring-1 ring-border/60">
        <CardHeader>
          <CardTitle>Available videos</CardTitle>
          <CardDescription>
            Session speech scoring uses only these keywords and checks whether
            each response falls inside its expected time window.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {videos.map((video) => (
            <div
              key={video.id}
              className="space-y-3 rounded-xl border border-border px-4 py-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium text-foreground">{video.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Keywords: {keywordsLabel(video)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {video.isBuiltin
                      ? "Built-in default"
                      : `Analysis: ${video.analysisStatus ?? "completed"}`}
                    {video.durationMs
                      ? ` · ${(video.durationMs / 1000).toFixed(1)}s`
                      : null}
                  </p>
                </div>
                {!video.isBuiltin ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await deleteStimulusVideo(video.id);
                      await loadVideos();
                    }}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
              <FocusAreasTable focusAreas={video.focusAreas} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Button variant="outline" asChild>
        <Link href="/sessions/new">Back to create session</Link>
      </Button>
    </div>
  );
}
