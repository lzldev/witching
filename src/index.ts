import { version } from '../package.json'
import { Command } from '@commander-js/extra-typings'
import { writeRed } from './utils'
import {
  EventOption,
  IgnoreOption,
  InteractiveOption,
  SilentOption,
} from './options'
import { execa } from 'execa'
import parcel from '@parcel/watcher'
import chalk from 'chalk'
import picomatch from 'picomatch'

const l = console.log

const app = new Command()
  .name('witching')
  .version(version)
  .showHelpAfterError(true)
  .configureOutput({
    outputError: writeRed,
  })
  .argument('<WATCH-DIR>', 'dir to be watched')
  .argument(
    '<COMMAND>',
    'Command on file change\n % is going to be replaced with the file name',
  )
  .addOption(IgnoreOption)
  .addOption(EventOption)
  .addOption(SilentOption)
  .addOption(InteractiveOption)

app.parse()

async function main() {
  const [dir, command] = app.args
  const options = app.opts()

  if (!dir || !command) {
    l('Error:', chalk.red('Invalid arguments'))
    return
  }

  l(
    `
  Watching Dir ${chalk.magentaBright(dir)}
  Command: ${chalk.green(command)}
  Options :`,
    options,
    '\n',
  )

  let matcher: picomatch.Matcher

  if (options.i) {
    matcher = picomatch(options.i)
    l(chalk.green('ignore:') + ` [${options.i}]\n`)
  }

  await parcel.subscribe(dir, async (err, events) => {
    const evt = (...txt: any[]) => chalk.bgCyan(chalk.whiteBright(...txt))

    for (const ev of events) {
      if (matcher && matcher(ev.path)) {
        l(`${chalk.cyan(' FILE: ')}${ev.path}${chalk.redBright(' IGNORED')}`)
        continue
      }

      const cmd_str = command.replace('%', ev.path)

      l(
        `EVENT:${evt(` ${ev.type.toUpperCase()} `)}\n`,
        `FILE ${chalk.magenta(ev.path)}\n`,
        `RUNNING ${chalk.greenBright(cmd_str)}\n`,
      )

      const cmd = await execa(cmd_str, {
        stdin: process.stdin,
        stdout: process.stdout,
        stderr: process.stderr,
      }).catch((err) => {
        l(`Error Running: ${chalk.green(cmd_str)}\n`, chalk.red(err))
      })

      l(`${chalk.green(`DONE`)} ✅\n`)
    }
  })
}

await main()
