export const zeros = (n: number) => {
  const arr = new Array(n)
  for (let i = 0; i < arr.length; i++) {
    arr[i] = 0
  }
  return arr
}
