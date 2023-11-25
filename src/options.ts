import { Option } from '@commander-js/extra-typings'
import { EventType } from '@parcel/watcher'

export const EventChoices = [
  'create',
  'update',
  'delete',
] as const satisfies EventType[]

export type EventChoices = typeof EventChoices
export type EventChoice = (typeof EventChoices)[number]

const EventOption = new Option(
  '-e <EVENTS...>,--events <EVENTS...>',
  'only run command on select events',
).choices(EventChoices)

const InteractiveOption = new Option('--interactive')

const SilentOption = new Option(
  '-s,--silent',
  'Runs commands without displaying output',
)

const IgnoreOption = new Option(
  '-i <GLOB>,--ignore <GLOBS>',
  'every file matching the pattern will be ignored',
)

const ShellOption = new Option('--shell <SHELL_CMD>', 'which shell to use')

const AggregateEventsOption = new Option(
  '-a,--no-aggregate',
  'Let events run more than once per file on watcher pool',
)

const PipeOption = new Option('-p,--pipe', 'pipe file into command')

export {
  EventOption,
  InteractiveOption,
  SilentOption,
  IgnoreOption,
  AggregateEventsOption,
  ShellOption,
  PipeOption,
}
