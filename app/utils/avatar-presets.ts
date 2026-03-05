export const avatarPresetIds = [
  'qq-classic-01',
  'qq-classic-02',
  'qq-classic-03',
  'qq-classic-04',
  'qq-classic-05',
  'qq-classic-06',
  'qq-classic-07',
  'qq-classic-08'
] as const

export type AvatarPresetId = (typeof avatarPresetIds)[number]

export const defaultAvatarPresetId: AvatarPresetId = 'qq-classic-01'

type AvatarPresetMeta = {
  id: AvatarPresetId
  zhName: string
  enName: string
  symbol: string
}

const avatarPresetList: AvatarPresetMeta[] = [
  { id: 'qq-classic-01', zhName: '企鹅', enName: 'Penguin', symbol: '🐧' },
  { id: 'qq-classic-02', zhName: '猫咪', enName: 'Cat', symbol: '🐱' },
  { id: 'qq-classic-03', zhName: '熊猫', enName: 'Panda', symbol: '🐼' },
  { id: 'qq-classic-04', zhName: '少女', enName: 'Girl', symbol: '👧' },
  { id: 'qq-classic-05', zhName: '狐狸', enName: 'Fox', symbol: '🦊' },
  { id: 'qq-classic-06', zhName: '企鹅仔', enName: 'Chick', symbol: '🐥' },
  { id: 'qq-classic-07', zhName: '青蛙', enName: 'Frog', symbol: '🐸' },
  { id: 'qq-classic-08', zhName: '机器人', enName: 'Robot', symbol: '🤖' }
]

export function isAvatarPresetId(value: string): value is AvatarPresetId {
  return avatarPresetIds.some((id) => id === value)
}

export function avatarPresetShortLabel(id: string) {
  const suffix = id.replace('qq-classic-', '')
  return `Q${suffix}`
}

export function getAvatarPresetMeta(avatarId: string) {
  return (
    avatarPresetList.find((item) => item.id === avatarId) ??
    avatarPresetList.find((item) => item.id === defaultAvatarPresetId)!
  )
}
