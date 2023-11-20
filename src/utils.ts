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

export { getParcelFiles, writeRed, templateHelp }
