import { version } from '../package.json'
import { Command } from '@commander-js/extra-typings'
import { getParcelFiles, templateHelp, writeRed } from './utils'
import {
  AggregateEventsOption,
  EventOption,
  IgnoreOption,
  InteractiveOption,
  ShellOption,
  SilentOption,
} from './options'

import { execa } from 'execa'
import chalk from 'chalk'

import parcel from '@parcel/watcher'
import type { EventType } from '@parcel/watcher'
import ora from 'ora'
import { commandMsg, dirMsg, errorMsg, eventMsg } from './colors'

const l = console.log

const helpText =
  // `${chalk.hex('#fcb5c6').bgHex('#660066').bold('WICHING HELP')"` +
  templateHelp`
${['? / h', 'Show This help']}
${['l', 'Start Spinner (SPIINNERR yippie!!!!!!!!!!)']}
${['c', 'List Files']}
${['q', 'quit :c']}
`

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
  .addOption(AggregateEventsOption)
  .addOption(SilentOption)
  .addOption(IgnoreOption)
  .addOption(InteractiveOption)
  .addOption(EventOption)
  .addOption(ShellOption)

app.parse()

async function main() {
  const [dir, command] = app.args
  const options = app.opts()

  const spinner = options.silent ? ora() : undefined

  if (!dir || !command) {
    l(errorMsg('Invalid Arguments'))
    return
  }

  l(
    `
  Watching Dir ${dirMsg(dir)}
  Command: ${commandMsg(command)}
  Options :`,
    options,
    '\n',
  )

  if (options.i) {
    l(chalk.green('ignore:') + ` [${options.i}]\n`)
  }

  const stdin = process.stdin

  if (stdin.isTTY) {
    l(`STDIN.isTTY ${chalk.magentaBright(stdin.isTTY)}`)
    stdin.setRawMode(true)

    const hotkeys: Record<string | number, Function> = {
      q: () => {
        l(`${chalk.redBright('SIGINT MOMENT')}`)
        process.exit(1)
      },
      c: async () => {
        const files = await getParcelFiles(dir, ignorePaths)
        l(chalk.whiteBright('WATCHED FILES:'), files, `\nN: ${files.length}`)
      },
      l: () => {
        if (spinner?.isSpinning) {
          spinner?.stop()
        } else {
          spinner?.start('i do be spinning')
        }
      },
      h: () => l(helpText),
      // <C-c> ASCII Code
      3: () => hotkeys['q'],
    }

    stdin.on('data', async (data) => {
      const input = data.toString('ascii')

      l(`STDINDATA:[${chalk.bgMagentaBright(input)}]`)
      l(`RAW_BUFFER:[${chalk.greenBright(Array.from(data.values()))}]`)
      ;(hotkeys[input] && hotkeys[input]?.call(undefined, [])) ||
        (data.at(-1) !== undefined &&
          hotkeys[data.at(-1)!] &&
          hotkeys[data.at(-1)!]?.call(undefined, []))
    })
  }

  const ignorePaths = [options.i ?? '']

  let lock = false
  await parcel.subscribe(
    dir,
    async (err, events) => {
      if (lock) {
        process.env['NODE_ENV'] === 'development' && l(chalk.red(`PARCEL CALLBACK [LOCKED]`));
        return
      }

      l(`PARCEL EVENT\n\n\n`)
      lock = true

      const eventFileSet: Record<EventType, Set<string>> | undefined =
        !options.aggregate
          ? {
              create: new Set(),
              delete: new Set(),
              update: new Set(),
            }
          : undefined

      for (const ev of events) {
        if (eventFileSet && eventFileSet[ev.type].has(ev.path)) {
          //TODO: Remove this Warning ?
          l(
            `${chalk.cyan(' REPEATED: ')}${eventMsg(ev.type)} ON ${dirMsg(
              ev.path,
            )}`,
          )
          continue
        }

        const cmd_str = command.replace('%', ev.path)

        l(
          `EVENT:${eventMsg(` ${ev.type.toUpperCase()} `)}\n`,
          `FILE ${dirMsg(ev.path)}\n`,
          `RUNNING ${commandMsg(cmd_str)}\n`,
        )

        const spin =
          options.silent && spinner?.start(`Running ${chalk.green(cmd_str)}`)

        await execa(cmd_str, {
          stdin: options.interactive ? process.stdin : undefined,
          stdout: options.silent ? undefined : process.stdout,
          stderr: process.stderr,
          shell: options.shell ?? process.env.SHELL ?? undefined,
        }).catch((err) => {
          l(`Error Running: ${chalk.green(cmd_str)}\n`, chalk.red(err))
        })

        spin && spin.stop()

        eventFileSet && eventFileSet[ev.type].add(ev.path)

        l(`${chalk.green(`DONE`)} ✅\n`)
      }
      lock = false
    },
    {
      ignore: ignorePaths,
    },
  )
}

await main()
