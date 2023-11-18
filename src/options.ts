import { Option } from '@commander-js/extra-typings'

const EventChoices = ['tbd', 'tbd1', 'tbd2'] as const

export type EventChoices = typeof EventChoices
export type EventChoice = (typeof EventChoices)[number]

const EventOption = new Option('-e <events>,--events <events>', '').choices(
  EventChoices,
)

const BackendChoices = ['tbd', 'tbd1', 'tbd2'] as const

export type BackendChoices = typeof BackendChoices
export type BackendChoice = (typeof BackendChoices)[number]

const BackendOption = new Option(
  '-b <backend> ,--backend <backend>',
  'parcel watcher backend',
).choices(BackendChoices)

const InteractiveOption = new Option('-i ,--interactive')
const SilentOption = new Option(
  '-s ,--silent',
  'runs commands without displaying output',
)

export { EventOption, BackendOption, InteractiveOption, SilentOption }
