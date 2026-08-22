import {
  Activity,
  AppWindow,
  BarChart3,
  BookOpen,
  CalendarDays,
  Cloud,
  Container,
  GitBranch,
  Globe,
  KeyRound,
  LayoutDashboard,
  type LucideIcon,
  Mail,
  Network,
  ToggleLeft,
  UserSquare2,
  Users,
} from 'lucide-react'

const RESOURCE_ICON_BY_SLUG: Record<string, LucideIcon> = {
  'api-dashboard': LayoutDashboard,
  'cl-events': CalendarDays,
  cloud: Cloud,
  'easy-verein': Users,
  flipt: ToggleLeft,
  'flux-operator': GitBranch,
  kubernetes: Container,
  'kubernetes-metrics': BarChart3,
  membership: UserSquare2,
  neulandnextanalytics: Activity,
  outline: BookOpen,
  outlook: Mail,
  'system-status': Activity,
  tailscale: Network,
  'vaultwarden-passwords': KeyRound,
  website: Globe,
}

export function getResourceHubIcon(slug: string): LucideIcon {
  return RESOURCE_ICON_BY_SLUG[slug] ?? AppWindow
}
