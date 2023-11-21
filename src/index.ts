#!/usr/bin/env node
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
import parcel, { EventType } from '@parcel/watcher'
import ora, { Ora } from 'ora'
import { commandMsg, dirMsg, errorMsg, eventMsg } from './colors'

const l = console.log

const hotkeysHelp = templateHelp`
${['? / h', 'Show This help']}
${['c', 'List Files']}
${['q', 'quit :c']}
`

type AppState = {
  lock: boolean
}

type AppConfig = {
  dir: any
  command: string
  ignorePaths: string[] | null
  spinner: Ora | null
}

const app = new Command()
  .name('witching')
  .version(version)
  .showHelpAfterError(true)
  .configureOutput({
    outputError: writeRed,
  })
  .argument('<WATCH-DIR>', 'watched directory')
  .argument(
    '<COMMAND>',
    'Command on file change % is replaced with the file name',
  )
  .addOption(AggregateEventsOption)
  .addOption(InteractiveOption)
  .addOption(SilentOption)
  .addOption(ShellOption)
  .addOption(IgnoreOption)
  .addOption(EventOption)

app.parse()

async function main() {
  const [dir, command] = app.args
  const options = app.opts()

  if (!dir || !command) {
    l(errorMsg('Invalid Arguments'))
    return
  }

  const AppConfig: AppConfig = {
    dir,
    command,
    ignorePaths: options.i ? [options.i] : null,
    spinner: options.silent ? ora() : null,
  } as const

  const AppState: AppState = {
    lock: false,
  }

  if (process.stdin.isTTY) {
    registerHotkeys(AppConfig, AppState)
  }

  await parcel.subscribe(
    dir,
    async (err, events) => {
      if (AppState.lock) {
        process.env['NODE_ENV'] === 'development' &&
          l(chalk.red(`PARCEL CALLBACK [LOCKED]`))
        return
      } else if (err !== null) {
        errorMsg(`ERROR: ${err.name}`, '\n', err.message)
        return
      }

      AppState.lock = true

      for (const ev of events) {
        const cmd_str = command.replace('%', ev.path)

        l(
          `EVENT:${eventMsg(` ${ev.type.toUpperCase()} `)}\n`,
          `FILE ${dirMsg(ev.path)}\n`,
          `RUNNING $${commandMsg(cmd_str)}\n`,
        )

        AppConfig.spinner &&
          AppConfig.spinner.start(`Running ${chalk.green(cmd_str)}`)

        await execa(cmd_str, {
          stdin: options.interactive ? process.stdin : undefined,
          stdout: options.silent ? undefined : process.stdout,
          stderr: process.stderr,
          shell: options.shell ?? process.env.SHELL ?? undefined,
        }).catch((err) => {
          l(`Error Running: ${chalk.green(cmd_str)}\n`, chalk.red(err))
        })

        AppConfig.spinner && AppConfig.spinner.stop()

        l(`${chalk.green(`DONE`)} ✨\n`)
      }

      AppState.lock = false
    },
    {
      ignore: AppConfig.ignorePaths ?? undefined,
    },
  )
}

await main()

function registerHotkeys(AppConfig: AppConfig, AppState: { lock: boolean }) {
  l(`STDIN.isTTY ${chalk.magentaBright(process.stdin.isTTY)}`)
  process.stdin.setRawMode(true)

  process.on('beforeExit', () => {
    process.stdin.setRawMode(false)
  })

  const hotkeys: Record<string | number, Function> = {
    q: () => {
      process.exit(1)
    },
    c: async () => {
      const files = await getParcelFiles(
        AppConfig.dir,
        AppConfig.ignorePaths ?? [],
      )
      l(chalk.whiteBright('WATCHED FILES:'), files, `\nN: ${files.length}`)
    },
    h: () => l(hotkeysHelp),
    '?': () => hotkeys['h']!(),
    // <C-c>
    3: () => hotkeys['q']!(),
  }

  process.stdin.on('data', async (data) => {
    const input = data.toString('ascii')

    l(`STDINDATA:[${chalk.bgMagentaBright(input)}]`)
    l(`RAW_BUFFER:[${chalk.greenBright(Array.from(data.values()))}]`)
    ;(hotkeys[input] && hotkeys[input]?.call(undefined, [])) ||
      (data.at(-1) !== undefined &&
        hotkeys[data.at(-1)!] &&
        hotkeys[data.at(-1)!]?.call(undefined, []))
  })
}
