import Stats from 'stats.js'

export const createStats = () => {
  // 0: fps, 1: ms, 2: mb, 3+: custom
  const fps = new Stats()
  fps.showPanel(0)
  fps.dom.style.position = 'relative'

  const ms = new Stats()
  ms.showPanel(1)
  ms.dom.style.position = 'relative'

  const mb = new Stats()
  mb.showPanel(2)
  mb.dom.style.position = 'relative'

  const container = document.createElement('div')
  container.style.display = 'flex'
  container.style.position = 'fixed'
  container.style.left = '0'
  container.style.top = '0'
  container.appendChild(fps.dom)
  container.appendChild(ms.dom)
  container.appendChild(mb.dom)

  return {
    begin: () => {
      fps.begin()
      ms.begin()
      mb.begin()
    },
    end: () => {
      fps.end()
      ms.end()
      mb.end()
    },
    dom: container,
  }
}
