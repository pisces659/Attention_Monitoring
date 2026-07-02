import {
  BarChart3,
  Brain,
  FileText,
  GitCompare,
  LayoutDashboard,
  Settings,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
}

export const navigation: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview of patients, sessions, and attention metrics",
  },
  {
    title: "Patients",
    href: "/patients",
    icon: Users,
    description: "Manage patient records and session history",
  },
  {
    title: "Sessions",
    href: "/sessions",
    icon: Video,
    description: "Create sessions, upload videos, and track processing",
  },
  {
    title: "Reports",
    href: "/reports",
    icon: FileText,
    description: "Review AI-generated session reports",
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    description: "Deep dive into attention, gaze, and speech analytics",
  },
  {
    title: "Compare",
    href: "/compare",
    icon: GitCompare,
    description: "Compare attention outcomes across sessions",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Clinic preferences and notification settings",
  },
];

export const appName = "Attention Monitoring System";
export const appTagline = "Smart Assessment for Better Outcomes";
export const appIcon = Brain;
