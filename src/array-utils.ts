export const zeros = (n: number) => {
  const arr = new Array(n)
  for (let i = 0; i < arr.length; i++) {
    arr[i] = 0
  }
  return arr
}

export const linspace = (x1: number, x2: number, n: number) =>
  zeros(n).map((_, index) => x1 + (index * (x2 - x1)) / (n - 1))
