export const getRandomColor = () =>
  Number(`0x${randCol()}${randCol()}${randCol()}`)

const randCol = () => toHexStr(Math.random())

/**
 * @param a number between 0 and 1
 */
const toHexStr = (a: number) =>
  Math.floor(a * 256)
    .toString(16)
    .padStart(2, '0')
