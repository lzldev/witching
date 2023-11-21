#!/usr/bin/env node
import { version } from '../package.json'
import { Command } from '@commander-js/extra-typings'
import {
  drawHeader,
  getParcelFiles,
  templateHelp,
  watchingAnimation,
  writeRed,
} from './utils'
import {
  AggregateEventsOption,
  EventOption,
  IgnoreOption,
  InteractiveOption,
  PipeOption,
  ShellOption,
  SilentOption,
} from './options'

import { execa } from 'execa'
import type { Options } from 'execa'
import chalk from 'chalk'
import parcel from '@parcel/watcher'
import ora, { Ora } from 'ora'
import { commandMsg, dirMsg, errorMsg, eventMsg } from './colors'

const hotkeysHelp = templateHelp`
${['? / h', 'Show This help']}
${['c', 'List Files']}
${['q', 'quit :c']}
`

type AppState = {
  lock: boolean
  timeouts: NodeJS.Timeout[]
}

type AppConfig = {
  dir: any
  command: string
  commandOptions: Options<'utf8'>
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
  .argument(
    '<COMMAND>',
    'command on file change % is replaced with the file name',
  )
  .argument('<WATCH-DIR>', 'file or directory to watch')
  .addOption(AggregateEventsOption)
  .addOption(InteractiveOption)
  .addOption(SilentOption)
  .addOption(PipeOption)
  .addOption(ShellOption)
  .addOption(IgnoreOption)
  .addOption(EventOption)

app.parse()
const options = app.opts()

const l =
  options.silent === true
    ? (...args: any[]) => {
        return
      }
    : console.log

async function main() {
  const [command, dir] = app.args

  if (!dir || !command) {
    l(errorMsg('Invalid Arguments'))
    return
  }

  const AppConfig: AppConfig = {
    dir,
    command,
    commandOptions: {
      stdin: options.interactive ? process.stdin : undefined,
      stdout: options.silent ? undefined : process.stdout,
      stderr: process.stderr,
      shell: options.shell ?? process.env.SHELL ?? undefined,
    },
    ignorePaths: options.i ? [options.i] : null,
    spinner: options.silent ? ora() : null,
  } as const

  const AppState: AppState = {
    lock: false,
    timeouts: [],
  }

  if (process.stdin.isTTY && !options.silent) {
    registerHotkeys(AppConfig, AppState)
  }

  const animation = watchingAnimation()

  AppState.timeouts.push(setInterval(() => animation(AppState.lock), 100))

  const watcher = await parcel.subscribe(
    dir,
    async (err, events) => {
      if (err !== null) {
        errorMsg(`ERROR: ${err.name}`, '\n', err.message)
        return
      }

      AppState.lock = true

      for (const ev of events) {
        const cmd_str = command.replace('%', ev.path)

        drawHeader(
          {
            EVENT: eventMsg(` ${ev.type.toUpperCase()} `),
            FILE: !options.pipe && dirMsg(ev.path),
            SHELL: options.shell && commandMsg(options.shell),
            RUNNING: !options.pipe && '$ ' + commandMsg(cmd_str),
          },
          l,
        )

        AppConfig.spinner &&
          AppConfig.spinner.start(`Running ${chalk.green(cmd_str)}`)

        await execa(cmd_str, {
          ...AppConfig.commandOptions,
        }).catch((err) => {
          l(`Error Running: ${chalk.green(cmd_str)}\n`, chalk.red(err))
        })

        AppConfig.spinner && AppConfig.spinner.stop()

        l(`${chalk.green(`DONE`)} ✨\n`)
      }

      options.silent && console.log(`Files: ${events.length} ✨`)
      AppState.lock = false
    },
    {
      ignore: AppConfig.ignorePaths ?? undefined,
    },
  )

  process.on('beforeExit', async () => {
    AppState.timeouts.forEach((t) => {
      clearTimeout(t)
    })

    await watcher.unsubscribe()
  })
}

await main()

function registerHotkeys(AppConfig: AppConfig, AppState: { lock: boolean }) {
  l(`STDIN.isTTY ${chalk.magentaBright(process.stdin.isTTY)}`)
  process.stdin.setRawMode(true)

  const hotkeys: Record<string | number, Function> = {
    q: () => {
      console.log('something i guess')
      process.exit(1)
    },
    c: async () => {
      const files = await getParcelFiles(
        AppConfig.dir,
        AppConfig.ignorePaths ?? [],
      )
      l(chalk.whiteBright('WATCHED FILES:'), files, `\nN: ${files.length}`)
    },
    r: () => console.clear(),
    h: () => l(hotkeysHelp),
    '?': () => hotkeys['h']!(),
    // <C-c>
    3: () => hotkeys['q']!(),
  }

  process.stdin.on('data', async (data) => {
    const input = data.toString('ascii')
    console.log(input)

    l(`STDINDATA:[${chalk.bgMagentaBright(input)}]`)
    l(`RAW_BUFFER:[${chalk.greenBright(Array.from(data.values()))}]`)
    ;(hotkeys[input] && hotkeys[input]?.call(undefined, [])) ||
      (data.at(-1) !== undefined &&
        hotkeys[data.at(-1)!] &&
        hotkeys[data.at(-1)!]?.call(undefined, []))
  })
}
