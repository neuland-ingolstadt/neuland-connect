import { EXTERNAL_LINKS } from '#/lib/constants'

export type ResourceCatalogEntry = {
  slug: string
  name: string
  href: string
  /** Display section in the hub UI */
  group: string
  /**
   * Authentik group names (any match grants access).
   * Omit for all signed-in members.
   */
  requiredGroups?: string[]
}

/**
 * Neuland services for the Ressourcen-Hub — static list (not synced from Authentik).
 * `requiredGroups` mirrors Authentik application policy bindings.
 */
export const RESOURCE_CATALOG: ResourceCatalogEntry[] = [
  {
    slug: 'cl-events',
    name: 'CL Events',
    href: 'https://cl.neuland.ing',
    group: 'Allgemein',
    requiredGroups: ['organisation'],
  },
  {
    slug: 'cloud',
    name: 'Cloud',
    href: 'https://cloud.neuland.ing/',
    group: 'Allgemein',
    requiredGroups: ['mitglieder'],
  },
  {
    slug: 'outline',
    name: 'Notes',
    href: 'https://outline.neuland.ing',
    group: 'Allgemein',
    requiredGroups: ['mitglieder'],
  },
  {
    slug: 'outlook',
    name: 'Outlook',
    href: 'https://outlook.office.com/mail/',
    group: 'Allgemein',
    requiredGroups: ['organisation'],
  },
  {
    slug: 'vaultwarden-passwords',
    name: 'Passwords',
    href: 'https://vault.neuland.ing',
    group: 'Allgemein',
    requiredGroups: ['organisation'],
  },
  {
    slug: 'website',
    name: 'Vereinswebsite',
    href: EXTERNAL_LINKS.WEBSITE,
    group: 'Allgemein',
  },
  {
    slug: 'api-dashboard',
    name: 'Neuland Next API',
    href: 'https://dashboard.neuland.app',
    group: 'Infrastruktur',
    requiredGroups: [
      'Neuland Next',
      'authentik Application Manager',
      'mitglieder',
    ],
  },
  {
    slug: 'flipt',
    name: 'Flipt',
    href: 'https://flipt.neuland.ing',
    group: 'Infrastruktur',
    requiredGroups: ['Neuland Next Admin'],
  },
  {
    slug: 'kubernetes-metrics',
    name: 'Grafana',
    href: 'https://grafana.neuland.ing',
    group: 'Infrastruktur',
    requiredGroups: ['grafana', 'vorstand'],
  },
  {
    slug: 'neulandnextanalytics',
    name: 'Neuland Next Analytics',
    href: 'https://analytics.neuland.app',
    group: 'Infrastruktur',
    requiredGroups: ['software-admins', 'software-kubernetes', 'vorstand'],
  },
  {
    slug: 'system-status',
    name: 'System Status',
    href: 'https://status.neuland.ing',
    group: 'Infrastruktur',
  },
  {
    slug: 'flux-operator',
    name: 'Flux Operator',
    href: 'https://flux.neuland.ing',
    group: 'Kubernetes',
    requiredGroups: ['software-kubernetes', 'vorstand'],
  },
  {
    slug: 'tailscale',
    name: 'Tailscale',
    href: 'https://login.tailscale.com/',
    group: 'Kubernetes',
    requiredGroups: ['software-kubernetes'],
  },
  {
    slug: 'easy-verein',
    name: 'EasyVerein',
    href: 'https://easyverein.com/app/',
    group: 'Vorstand',
    requiredGroups: ['vorstand'],
  },
  {
    slug: 'membership',
    name: 'MembershipTool',
    href: 'https://membership.neuland.ing/',
    group: 'Vorstand',
    requiredGroups: ['vorstand'],
  },
]
