/** Authentik Ressort groups (lowercase) with dedicated profile badge styling. */
export const PROFILE_RESSORT_GROUPS = {
  organisation: 'organisation',
  engineering: 'engineering',
  designPr: 'design-pr',
  management: 'management',
  hr: 'hr',
  events: 'events',
} as const

export type ProfileRessortGroup =
  (typeof PROFILE_RESSORT_GROUPS)[keyof typeof PROFILE_RESSORT_GROUPS]

const RESSORT_GROUP_ORDER: ProfileRessortGroup[] = [
  PROFILE_RESSORT_GROUPS.organisation,
  PROFILE_RESSORT_GROUPS.engineering,
  PROFILE_RESSORT_GROUPS.designPr,
  PROFILE_RESSORT_GROUPS.management,
  PROFILE_RESSORT_GROUPS.hr,
  PROFILE_RESSORT_GROUPS.events,
]

const RESSORT_DISPLAY_LABELS: Record<ProfileRessortGroup, string> = {
  [PROFILE_RESSORT_GROUPS.organisation]: 'Ressort Organisation',
  [PROFILE_RESSORT_GROUPS.engineering]: 'Ressort Engineering',
  [PROFILE_RESSORT_GROUPS.designPr]: 'Ressort Design & PR',
  [PROFILE_RESSORT_GROUPS.management]: 'Ressort Management',
  [PROFILE_RESSORT_GROUPS.hr]: 'Ressort HR',
  [PROFILE_RESSORT_GROUPS.events]: 'Ressort Events',
}

const HONOR_GROUP_PATTERN = /ehrenmitglied/i

export type ProfileGroupBadgeVariant = 'honor' | 'ressort' | 'secondary'

export function isHonorProfileGroup(group: string): boolean {
  return HONOR_GROUP_PATTERN.test(group)
}

export function isVorstandProfileGroup(group: string): boolean {
  return group.toLowerCase() === 'vorstand'
}

export function getProfileRessortGroup(
  group: string,
): ProfileRessortGroup | null {
  const normalized = group.toLowerCase()
  for (const ressort of RESSORT_GROUP_ORDER) {
    if (normalized === ressort) {
      return ressort
    }
  }
  return null
}

export function isSpecialProfileGroup(group: string): boolean {
  return (
    isHonorProfileGroup(group) ||
    isVorstandProfileGroup(group) ||
    getProfileRessortGroup(group) !== null
  )
}

export function getProfileGroupBadgeVariant(
  group: string,
): ProfileGroupBadgeVariant {
  if (isHonorProfileGroup(group) || isVorstandProfileGroup(group)) {
    return 'honor'
  }

  const ressort = getProfileRessortGroup(group)
  if (ressort) {
    return 'ressort'
  }

  return 'secondary'
}

/** Short German explanation shown on hover for styled profile badges. */
export function getProfileGroupBadgeHint(group: string): string | null {
  if (isHonorProfileGroup(group) || isVorstandProfileGroup(group)) {
    return 'Besondere Vereinsrolle'
  }

  if (getProfileRessortGroup(group)) {
    return 'Ressort-Zuordnung'
  }

  return null
}

/** Badge label; Ressorts get a readable „Ressort …“ prefix. */
export function getProfileGroupDisplayLabel(group: string): string {
  const ressort = getProfileRessortGroup(group)
  if (ressort) {
    return RESSORT_DISPLAY_LABELS[ressort]
  }
  return group
}

export type ProfileGroupSections = {
  honorGroups: string[]
  ressortGroups: string[]
  otherGroups: string[]
  ordered: string[]
}

/** Golden badges first, then Ressorts, then everything else alphabetically. */
export function partitionProfileGroups(groups: string[]): ProfileGroupSections {
  const honorGroups: string[] = []
  const ressortGroups: string[] = []
  const otherGroups: string[] = []

  for (const group of sortProfileGroups(groups)) {
    if (isHonorProfileGroup(group) || isVorstandProfileGroup(group)) {
      honorGroups.push(group)
      continue
    }

    if (getProfileRessortGroup(group)) {
      ressortGroups.push(group)
      continue
    }

    otherGroups.push(group)
  }

  return {
    honorGroups,
    ressortGroups,
    otherGroups,
    ordered: [...honorGroups, ...ressortGroups, ...otherGroups],
  }
}

function profileGroupSortRank(group: string): number {
  if (isHonorProfileGroup(group)) {
    return 0
  }
  if (isVorstandProfileGroup(group)) {
    return 1
  }

  const ressort = getProfileRessortGroup(group)
  if (ressort) {
    return 2 + RESSORT_GROUP_ORDER.indexOf(ressort)
  }

  return 10
}

/** Puts Ehrenmitglied, Vorstand, and Ressorts first, then sorts the rest alphabetically. */
export function sortProfileGroups(groups: string[]): string[] {
  return [...groups].sort((a, b) => {
    const rankDiff = profileGroupSortRank(a) - profileGroupSortRank(b)
    if (rankDiff !== 0) {
      return rankDiff
    }
    return a.localeCompare(b, 'de')
  })
}
