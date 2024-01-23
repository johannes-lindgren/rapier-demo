export const getRandomColor = () =>
  Number(`0x${randCol()}${randCol()}${randCol()}`)
const randCol = () =>
  Math.floor(Math.random() * 256)
    .toString(16)
    .padStart(2, '0')
