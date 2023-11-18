import chalk from 'chalk'

function writeRed(str: string, write: (str: string) => void) {
  write(chalk.red(str))
}

export { writeRed }
