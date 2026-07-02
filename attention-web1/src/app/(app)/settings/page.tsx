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
import { Select } from "@/components/ui/select";
import { USE_API } from "@/lib/api-config";
import { defaultSettings } from "@/mock";
import {
  createClinicClient,
  getCurrentClinicClient,
} from "@/services/clinic-service";
import {
  createDoctorClient,
  listDoctorsClient,
} from "@/services/doctor-service";
import type { Clinician } from "@/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [saved, setSaved] = useState(false);
  const [clinicName, setClinicName] = useState("");
  const [currentClinicName, setCurrentClinicName] = useState("");
  const [clinicMessage, setClinicMessage] = useState("");
  const [doctors, setDoctors] = useState<Clinician[]>([]);
  const [doctorName, setDoctorName] = useState("");
  const [doctorEmail, setDoctorEmail] = useState("");
  const [doctorTitle, setDoctorTitle] = useState("Therapist");
  const [doctorMessage, setDoctorMessage] = useState("");

  useEffect(() => {
    if (!USE_API) {
      return;
    }

    getCurrentClinicClient()
      .then((clinic) => {
        if (clinic) {
          setCurrentClinicName(clinic.name);
          setSettings((current) => ({ ...current, clinicName: clinic.name }));
        }
      })
      .catch(() => {
        // Ignore when clinic endpoint is unavailable.
      });

    listDoctorsClient()
      .then(setDoctors)
      .catch(() => setDoctors([]));
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  async function handleCreateClinic(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClinicMessage("");

    try {
      const clinic = await createClinicClient(clinicName);
      setCurrentClinicName(clinic.name);
      setClinicName("");
      setClinicMessage(`Created and switched to ${clinic.name}. Refresh pages to see updated data.`);
      window.location.reload();
    } catch (error) {
      setClinicMessage(
        error instanceof Error ? error.message : "Could not create clinic."
      );
    }
  }

  async function handleCreateDoctor(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDoctorMessage("");

    try {
      const doctor = await createDoctorClient({
        fullName: doctorName,
        email: doctorEmail,
        title: doctorTitle,
      });
      setDoctors((current) => [...current, doctor]);
      setDoctorName("");
      setDoctorEmail("");
      setDoctorMessage(`Added ${doctor.name} to ${currentClinicName || "your clinic"}.`);
    } catch (error) {
      setDoctorMessage(
        error instanceof Error ? error.message : "Could not add doctor."
      );
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="Settings"
        description="Configure clinic preferences and notification behavior."
      />

      <Card className="border-0 shadow-sm ring-1 ring-border/60">
        <CardHeader>
          <CardTitle>Data source</CardTitle>
          <CardDescription>
            Toggle between mock and live API data using{" "}
            <code className="text-xs">NEXT_PUBLIC_USE_API</code> in{" "}
            <code className="text-xs">.env.local</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium text-foreground">
            Current mode: {USE_API ? "Live API" : "Mock demo data"}
          </p>
          {USE_API && currentClinicName ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Active clinic: {currentClinicName}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {USE_API ? (
        <>
          <Card className="border-0 shadow-sm ring-1 ring-border/60">
            <CardHeader>
              <CardTitle>Add patient</CardTitle>
              <CardDescription>
                Patients belong to your active clinic. Riya Singh (P004) is
                included in the default seed data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/patients">Go to Patients → Add patient</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm ring-1 ring-border/60">
            <CardHeader>
              <CardTitle>Create clinic</CardTitle>
              <CardDescription>
                Add a new clinic and switch your account to it. Patients and
                sessions are scoped per clinic.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleCreateClinic}>
                <div className="space-y-2">
                  <Label htmlFor="newClinicName">Clinic name</Label>
                  <Input
                    id="newClinicName"
                    required
                    value={clinicName}
                    onChange={(event) => setClinicName(event.target.value)}
                    placeholder="NeuroLens Downtown"
                  />
                </div>
                {clinicMessage ? (
                  <p className="text-sm text-muted-foreground">{clinicMessage}</p>
                ) : null}
                <Button type="submit">Create clinic</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm ring-1 ring-border/60">
            <CardHeader>
              <CardTitle>Doctors at this clinic</CardTitle>
              <CardDescription>
                Dr. Ananya Sharma is seeded by default. Add more therapists
                below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {doctors.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {doctors.map((doctor) => (
                    <li
                      key={doctor.id}
                      className="rounded-xl border border-border/60 px-4 py-3"
                    >
                      <p className="font-medium">{doctor.name}</p>
                      <p className="text-muted-foreground">
                        {doctor.title} · {doctor.email}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No doctors loaded yet.
                </p>
              )}

              <form className="space-y-4 border-t border-border/60 pt-4" onSubmit={handleCreateDoctor}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="doctorName">Full name</Label>
                    <Input
                      id="doctorName"
                      required
                      value={doctorName}
                      onChange={(event) => setDoctorName(event.target.value)}
                      placeholder="Dr. Meera Patel"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doctorEmail">Email</Label>
                    <Input
                      id="doctorEmail"
                      type="email"
                      required
                      value={doctorEmail}
                      onChange={(event) => setDoctorEmail(event.target.value)}
                      placeholder="meera@clinic.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doctorTitle">Title</Label>
                  <Input
                    id="doctorTitle"
                    value={doctorTitle}
                    onChange={(event) => setDoctorTitle(event.target.value)}
                  />
                </div>
                {doctorMessage ? (
                  <p className="text-sm text-muted-foreground">{doctorMessage}</p>
                ) : null}
                <Button type="submit">Add doctor</Button>
              </form>
            </CardContent>
          </Card>
        </>
      ) : null}

      <Card className="border-0 shadow-sm ring-1 ring-border/60">
        <CardHeader>
          <CardTitle>Clinic preferences</CardTitle>
          <CardDescription>
            {USE_API
              ? "Display preferences stored locally. Clinic name comes from the API when connected."
              : "These settings are stored locally in this mock frontend."}
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
