import {
  RESOURCE_CATALOG,
  type ResourceCatalogEntry,
} from '#/lib/resources/catalog'

export const RESOURCE_HUB_DEFAULT_GROUP = 'Allgemein' as const

const RESOURCE_HUB_GROUP_ORDER = [
  RESOURCE_HUB_DEFAULT_GROUP,
  'Infrastruktur',
  'Kubernetes',
  'Vorstand',
] as const

export type ResourceHubItem = {
  slug: string
  name: string
  href: string
}

export type ResourceHubGroup = {
  id: string
  label: string
  items: ResourceHubItem[]
}

function sortGroupLabels(a: string, b: string): number {
  const indexA = RESOURCE_HUB_GROUP_ORDER.indexOf(
    a as (typeof RESOURCE_HUB_GROUP_ORDER)[number],
  )
  const indexB = RESOURCE_HUB_GROUP_ORDER.indexOf(
    b as (typeof RESOURCE_HUB_GROUP_ORDER)[number],
  )
  const rankA = indexA === -1 ? Number.POSITIVE_INFINITY : indexA
  const rankB = indexB === -1 ? Number.POSITIVE_INFINITY : indexB

  if (rankA !== rankB) {
    return rankA - rankB
  }

  return a.localeCompare(b, 'de')
}

function normalizeGroupName(group: string): string {
  return group.trim().toLowerCase()
}

export function userCanAccessResource(
  userGroups: string[],
  entry: ResourceCatalogEntry,
): boolean {
  if (!entry.requiredGroups || entry.requiredGroups.length === 0) {
    return true
  }

  const normalizedUserGroups = new Set(
    userGroups.map(group => normalizeGroupName(group)),
  )

  return entry.requiredGroups.some(required =>
    normalizedUserGroups.has(normalizeGroupName(required)),
  )
}

export function buildResourceHub(userGroups: string[]): ResourceHubGroup[] {
  const grouped = new Map<string, ResourceHubItem[]>()

  for (const entry of RESOURCE_CATALOG) {
    if (!userCanAccessResource(userGroups, entry)) {
      continue
    }

    const groupLabel = entry.group.trim() || RESOURCE_HUB_DEFAULT_GROUP
    const item: ResourceHubItem = {
      slug: entry.slug,
      name: entry.name,
      href: entry.href,
    }

    const existing = grouped.get(groupLabel)
    if (existing) {
      existing.push(item)
    } else {
      grouped.set(groupLabel, [item])
    }
  }

  return [...grouped.entries()]
    .sort(([labelA], [labelB]) => sortGroupLabels(labelA, labelB))
    .map(([label, items]) => ({
      id: label.toLowerCase().replace(/\s+/g, '-'),
      label,
      items: items.sort((a, b) => a.name.localeCompare(b.name, 'de')),
    }))
}
