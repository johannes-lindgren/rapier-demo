export const pseudoRandomColor = (seed: string) =>
  Number(
    `0x${hex(pseudoRandom(seed + '123', 255))}${hex(pseudoRandom(seed + 'abc2', 255))}${hex(pseudoRandom(seed + '9873', 255))}`,
  )

export const randomColor = () =>
  Number(`0x${randCol()}${randCol()}${randCol()}`)

const randCol = () => hex(Math.random() * 256)

/**
 * @param a number between 0 and 1
 */
const hex = (a: number) => Math.floor(a).toString(16).padStart(2, '0')

/**
 * Returns a hash code from a string. Used to generate pseudo-random numbers.
 * @param  {String} str The string to hash.
 * @return {Number}    A 32bit integer
 * @see http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
 */
export const unsafeHash = (str: string): number => {
  let hash = 0
  for (let i = 0, len = str.length; i < len; i++) {
    const chr = str.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0 // Convert to 32bit integer
  }
  return hash
}

export const pseudoRandom = (seed: string, max: number): number => {
  return Math.abs(unsafeHash(seed)) % (max + 1)
}
