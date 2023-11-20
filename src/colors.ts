import chalk from 'chalk'

export const dirMsg = (...msg: any[]) => chalk.magentaBright(msg)
export const commandMsg = (...msg: any[]) => chalk.greenBright(msg)

const errorPrefix = chalk.bgWhiteBright(chalk.redBright('Error:'))
export const errorMsg = (...msg: any[]) => chalk.redBright(msg)

export const printError = (...msg: any[]) => errorPrefix + errorMsg(msg)

export const eventMsg = (...txt: any[]) =>
  chalk.bgCyan(chalk.whiteBright(...txt))
