"use client";

import { useState } from "react";

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
import { Select } from "@/components/ui/select";
import { defaultSettings } from "@/mock";

export default function SettingsPage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [saved, setSaved] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="Settings"
        description="Configure clinic preferences and notification behavior."
      />

      <Card className="border-0 shadow-sm ring-1 ring-border/60">
        <CardHeader>
          <CardTitle>Clinic preferences</CardTitle>
          <CardDescription>
            These settings are stored locally in this mock frontend.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="clinicName">Clinic name</Label>
              <Input
                id="clinicName"
                value={settings.clinicName}
                onChange={(event) =>
                  setSettings({ ...settings, clinicName: event.target.value })
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  id="timezone"
                  value={settings.timezone}
                  onChange={(event) =>
                    setSettings({ ...settings, timezone: event.target.value })
                  }
                >
                  <option value="America/New_York">America/New_York</option>
                  <option value="America/Chicago">America/Chicago</option>
                  <option value="Europe/London">Europe/London</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  id="language"
                  value={settings.language}
                  onChange={(event) =>
                    setSettings({ ...settings, language: event.target.value })
                  }
                >
                  <option value="English (US)">English (US)</option>
                  <option value="English (UK)">English (UK)</option>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Default session duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={settings.defaultSessionDuration}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    defaultSessionDuration: Number(event.target.value),
                  })
                }
              />
            </div>

            <div className="space-y-3">
              <ToggleRow
                label="Email notifications"
                checked={settings.emailNotifications}
                onChange={(checked) =>
                  setSettings({ ...settings, emailNotifications: checked })
                }
              />
              <ToggleRow
                label="Session reminders"
                checked={settings.sessionReminders}
                onChange={(checked) =>
                  setSettings({ ...settings, sessionReminders: checked })
                }
              />
              <ToggleRow
                label="Auto-generate reports"
                checked={settings.autoGenerateReports}
                onChange={(checked) =>
                  setSettings({ ...settings, autoGenerateReports: checked })
                }
              />
            </div>

            <Button type="submit">{saved ? "Saved" : "Save settings"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3">
      <span className="text-sm font-medium">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 accent-[#2563EB]"
      />
    </label>
  );
}
