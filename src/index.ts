import { version } from '../package.json'
import { Command, Option } from '@commander-js/extra-typings'
import { writeRed } from './utils'
import {
  BackendOption,
  EventOption,
  InteractiveOption,
  SilentOption,
} from './options'

const l = console.log

const app = new Command()
  .name('witching')
  .version(version)
  .showHelpAfterError(true)
  .configureOutput({
    outputError: writeRed,
  })
  .argument('<watch-dir>', 'dir to be watched')
  .argument('<command>', 'Command on file change')
  .addOption(EventOption)
  .addOption(BackendOption)
  .addOption(SilentOption)
  .addOption(InteractiveOption)

app.parse()

function main() {
  const [dir, command] = app.args
  const options = app.opts()

  l(`Watching Dir ${dir}`)
  l(`Command: ${command}`)
  l(`Options :\n`, options)
}

main()
