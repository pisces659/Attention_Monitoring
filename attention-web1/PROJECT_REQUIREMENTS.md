# NeuroLens AI

## AI-Powered Cognitive Assessment Platform

---

# Project Objective

Develop a production-ready web application for psychiatrists and psychologists to assess a child's attention during cognitive therapy sessions.

The application should allow clinicians to upload a therapy session video, process it using an external AI engine, and visualize detailed attention, gaze, facial, and speech metrics through an intuitive dashboard.

Initially, the AI processing is mocked using sample CSV files and processed videos. Later, the backend will integrate with an existing Python AI engine.

This application should look like a commercial SaaS product rather than an admin dashboard.

---

# Technology Stack

Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts
- Lucide Icons
- Framer Motion

Backend (Future)

- Python FastAPI

AI Engine

- Existing Python repository (already developed separately)

Deployment

- Vercel

Repository

- GitHub

---

# Design Style

Professional Medical SaaS

Inspired by

- Linear
- Stripe Dashboard
- Microsoft Fluent
- Notion

Avoid Bootstrap-style admin templates.

Color Palette

Primary

#2563EB

Success

#22C55E

Warning

#F59E0B

Danger

#EF4444

Background

#F8FAFC

Cards

White

Rounded Corners

Large spacing

Minimal shadows

---

# Application Modules

Authentication

Dashboard

Patients

Sessions

Reports

Analytics

Settings

---

# User Flow

Login

↓

Dashboard

↓

Patients

↓

Patient Profile

↓

Session History

↓

Create Session

↓

Upload Video

↓

Processing

↓

AI Output

↓

Report

↓

Compare Previous Sessions

---

# Patient

Fields

Patient ID

First Name

Last Name

Age

Gender

Diagnosis

Doctor

Notes

Created Date

Profile Photo

---

# Session

Fields

Session ID

Patient ID

Date

Duration

Video

Processed Video

CSV Output

Status

Doctor Notes

Speech Score

Attention Score

---

# AI Processing

The frontend will upload a video.

The backend (future) processes it using an existing Python AI engine.

Outputs

- Annotated video
- CSV metrics

For now, processing is mocked.

---

# CSV Structure

Each row represents one frame.

Columns

Frame

Time

FaceDetected

LeftIrisX

LeftIrisY

RightIrisX

RightIrisY

EAR

Blink

TotalBlinks

Yaw

Pitch

Roll

HorizontalGaze

VerticalGaze

OnScreen

HorizontalRatio

VerticalRatio

AttentionState

Example

Frame,Time,FaceDetected,LeftIrisX,LeftIrisY,RightIrisX,RightIrisY,EAR,Blink,TotalBlinks,Yaw,Pitch,Roll,HorizontalGaze,VerticalGaze,OnScreen,HorizontalRatio,VerticalRatio,AttentionState
1,0.06,TRUE,619,340,759,335,0.247,FALSE,0,-3.60,-16.69,179.83,Center,Up,FALSE,0.45,0.40,Looking Up
12,0.72,TRUE,639,334,777,331,0.235,FALSE,0,-3.33,-11.13,-179.45,Center,Center,TRUE,0.44,0.45,Focused
20,1.20,TRUE,689,324,815,333,0.209,TRUE,1,6.94,21.64,4.62,Center,Down,FALSE,0.47,0.49,Blink
30,1.80,TRUE,659,325,787,323,0.253,FALSE,1,-1.77,7.37,179.84,Center,Center,TRUE,0.48,0.48,Focused

The full CSV will later contain thousands of rows.

---

# Dashboard

Display

Total Patients

Sessions Completed

Average Attention

Speech Accuracy

Average Session Time

Average Blink Count

Recent Sessions

Recent Patients

Attention Trend

Speech Trend

---

# Analytics

Generate

Attention Timeline

Blink Timeline

Head Pose Timeline

Speech Accuracy

Word Accuracy

Focused Time

Distracted Time

Longest Focus Duration

Longest Distraction Duration

Heatmap

Eye Gaze Timeline

---

# Session Report

The report page should display

Patient Information

Video Player

Annotated Video

Attention Summary

Speech Summary

Blink Statistics

Head Pose Statistics

Timeline

Doctor Notes

Recommendations

---

# Attention Metrics

Calculate

Overall Attention %

Focused Duration

Distracted Duration

Number of Attention Shifts

Average Focus Duration

Longest Focus Duration

Eyes Closed Duration

Blink Count

Average Blink Rate

Screen Engagement

---

# Speech Metrics

Recognized Word

Expected Word

Confidence

Pronunciation Accuracy

Completion %

Speech Score

Correct

Partial

Incorrect

Timeline

Future

Whisper integration

---

# Dashboard Cards

Card 1

Patients

Card 2

Sessions

Card 3

Attention %

Card 4

Speech %

Card 5

Average Focus

Card 6

Average Blink

---

# Charts

Line Chart

Attention over Time

Line Chart

Speech Accuracy

Area Chart

Focus Timeline

Donut

Focused vs Distracted

Bar Chart

Blink Count

Heat Map

Eye Gaze

---

# Patient Profile

Overview

Sessions

Reports

Analytics

Speech History

Attention History

Doctor Notes

---

# Comparison Page

Compare two sessions.

Display

Attention %

Speech %

Blink Count

Focus Duration

Eye Contact

Head Pose

Improvement %

Regression %

Charts

---

# Mock Data

Create

10 Patients

25 Sessions

5 Reports

Random Analytics

Use realistic medical-looking data.

---

# Folder Structure

src/

app/

dashboard

patients

sessions

reports

analytics

settings

login

components/

layout

dashboard

patients

sessions

reports

charts

common

ui

services

hooks

mock

types

lib

utils

---

# Current Scope

Only frontend.

No authentication backend.

No database.

No AI integration.

Use mock data.

Keep architecture ready for future FastAPI integration.

---

# Future Scope

FastAPI

PostgreSQL

Authentication

JWT

Role Management

Cloud Storage

Python AI Engine Integration

PDF Reports

Email Reports

Clinic Management

Multiple Doctors

Multi Tenant

---

# Coding Standards

Use TypeScript everywhere.

No inline styles.

Reusable components.

Feature-based organization.

Responsive design.

Accessibility.

Enterprise-grade code quality.

Use mock services instead of hardcoded data inside components.

# Dashboard Reference

Refer to the image:

docs/dashboard-reference.png

The dashboard should follow this overall layout while improving the visual design to look like a modern SaaS application.

Do not copy it exactly.

Improve spacing, typography, colors and responsiveness.

The CSV located at

sample-data/sample-session.csv

represents the AI engine output.

The application should use this file to generate all dashboard metrics.