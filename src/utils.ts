import chalk from 'chalk'
import os from 'os'
import { join } from 'path'
import { getEventsSince } from '@parcel/watcher'

const fake_snapshot_path = join(os.tmpdir(), 'parcel_snapshot')

function writeRed(str: string, write: (str: string) => void) {
  write(chalk.red(str))
}

async function getParcelFiles(dir: string, ignore: string[]) {
  return (
    await getEventsSince(dir, fake_snapshot_path, {
      ignore,
    })
  ).map((event) => event.path)
}

function templateHelp(
  template: TemplateStringsArray,
  ...rest: [key: string, help: string][]
) {
  let ret = ''

  template.forEach((template, idx) => {
    ret += template
    if (!rest[idx]) {
      return
    }

    const k = rest[idx]!
    ret += chalk.blueBright(k[0]) + ' = ' + chalk.reset(k[1])
  })

  return ret
}

const preHeader = ' '
const postHeader = '\n'
const headerDivider = ' : '

function drawHeader(header: Record<string, any>, logger = console.log) {
  const msg = Object.entries(header)
    .filter(([_, value]) => !!value)
    .map(
      ([k, v]) =>
        preHeader +
        chalk.whiteBright(k) +
        headerDivider +
        v.toString() +
        postHeader,
    )

  logger.call(undefined, ...msg)
}

function watchingAnimation() {
  const stdout = process.stdout
  const m = Math.min

  let direction = -1
  let position = 0

  let columns = stdout.columns
  let wasLocked = true

  const padder = ' '
  const watcher = '🧙‍♀️'

  const render = () => {
    console.log(
      watcher
        .padStart(columns / 2 - watcher.length, padder)
        .padEnd(columns, padder),
      watcher.padStart(position, padder).padEnd(columns, padder),
    )
  }

  const fly = (locked: boolean) => {
    wasLocked = wasLocked || locked

    if (locked) {
      return
    }

    if (position === 0) {
      direction = 1
    } else if (position >= columns - 1) {
      direction = -1
    }

    columns = stdout.columns
    position = m(position + direction, columns)

    if (!wasLocked) {
      stdout.moveCursor(0, -2)
      stdout.clearScreenDown()
      render()
    } else {
      render()
      wasLocked = false
    }
  }

  fly.clear = () => {
    stdout.moveCursor(0, -2)
    stdout.clearScreenDown()
  }

  return fly
}

export { getParcelFiles, writeRed, templateHelp, drawHeader, watchingAnimation }
