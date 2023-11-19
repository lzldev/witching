import { Option } from '@commander-js/extra-typings'

/* 
@parcel/watcher Parcel BackendType
  export type BackendType =
    | 'fs-events'
    | 'watchman'
    | 'inotify'
    | 'windows'
    | 'brute-force';
TODO: i should probably remove this . at least hide it from the --help
const BackendChoices = ['tbd', 'tbd1', 'tbd2'] as const
export type BackendChoices = typeof BackendChoices
export type BackendChoice = (typeof BackendChoices)[number]
const BackendOption = new Option(
  '-b <backend> ,--backend <backend>',
  'parcel watcher backend',
).choices(BackendChoices)
  

*/

/* 
@parcel/watcher EventType
  EventType :  'create' | 'update' | 'delete';
*/
export const EventChoices = ['create', 'update', 'delete'] as const

export type EventChoices = typeof EventChoices
export type EventChoice = (typeof EventChoices)[number]

const EventOption = new Option('-e <EVENTS>,--events <EVENTS>', '').choices(
  EventChoices,
)

const InteractiveOption = new Option('--interactive')

const SilentOption = new Option(
  '-s,--silent',
  'Runs commands without displaying output',
)

const IgnoreOption = new Option(
  '-i <GLOB>,--ignore <GLOB>',
  'every file matching the pattern will be ignored',
)

//TODO: change the help
const AggregateEventsOption = new Option(
  '-a,--no-aggregate',
  'Let events run more than once per file on watcher pool',
)

export {
  EventOption,
  InteractiveOption,
  SilentOption,
  IgnoreOption,
  AggregateEventsOption,
}
