// TODO unsubscribe side effects

const doubleClickDelta = 250
export const keyDownTracker = () => {
  const keysDown = new Set<string>()
  let doubleClickQueue = new Set<string>()
  const clicks = new Map<
    string,
    {
      lastClicked: number
    }
  >()

  document.addEventListener('keydown', (event) => {
    if (!event.repeat) {
      keysDown.add(event.code)
    }
    const lastClick = clicks.get(event.code)?.lastClicked
    const now = performance.now()
    if (lastClick && now - lastClick < doubleClickDelta) {
      doubleClickQueue.add(event.code)
    }
    clicks.set(event.code, { lastClicked: now })
  })

  document.addEventListener('keyup', (event) => {
    keysDown.delete(event.code)
  })

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      keysDown.clear()
    }
  })

  return {
    isKeyDown: (keyCode: Key) => keysDown.has(keyCode),
    drainEventQueue: () => {
      const events = doubleClickQueue
      doubleClickQueue = new Set<string>()
      return events
    },
  }
}

/**
 * Codes for KeyboardEvent.code
 */
export enum Key {
  Backspace = 'Backspace',
  Tab = 'Tab',
  Enter = 'Enter',
  ShiftLeft = 'ShiftLeft',
  ShiftRight = 'ShiftRight',
  ControlLeft = 'ControlLeft',
  ControlRight = 'ControlRight',
  AltLeft = 'AltLeft',
  AltRight = 'AltRight',
  Pause = 'Pause',
  CapsLock = 'CapsLock',
  Escape = 'Escape',
  Space = 'Space',
  PageUp = 'PageUp',
  PageDown = 'PageDown',
  End = 'End',
  Home = 'Home',
  ArrowLeft = 'ArrowLeft',
  ArrowUp = 'ArrowUp',
  ArrowRight = 'ArrowRight',
  ArrowDown = 'ArrowDown',
  PrintScreen = 'PrintScreen',
  Insert = 'Insert',
  Delete = 'Delete',
  Digit0 = 'Digit0',
  Digit1 = 'Digit1',
  Digit2 = 'Digit2',
  Digit3 = 'Digit3',
  Digit4 = 'Digit4',
  Digit5 = 'Digit5',
  Digit6 = 'Digit6',
  Digit7 = 'Digit7',
  Digit8 = 'Digit8',
  Digit9 = 'Digit9',
  AudioVolumeMute = 'AudioVolumeMute',
  AudioVolumeDown = 'AudioVolumeDown',
  AudioVolumeUp = 'AudioVolumeUp',
  KeyA = 'KeyA',
  KeyB = 'KeyB',
  KeyC = 'KeyC',
  KeyD = 'KeyD',
  KeyE = 'KeyE',
  KeyF = 'KeyF',
  KeyG = 'KeyG',
  KeyH = 'KeyH',
  KeyI = 'KeyI',
  KeyJ = 'KeyJ',
  KeyK = 'KeyK',
  KeyL = 'KeyL',
  KeyM = 'KeyM',
  KeyN = 'KeyN',
  KeyO = 'KeyO',
  KeyP = 'KeyP',
  KeyQ = 'KeyQ',
  KeyR = 'KeyR',
  KeyS = 'KeyS',
  KeyT = 'KeyT',
  KeyU = 'KeyU',
  KeyV = 'KeyV',
  KeyW = 'KeyW',
  KeyX = 'KeyX',
  KeyY = 'KeyY',
  KeyZ = 'KeyZ',
  MetaLeft = 'MetaLeft',
  MetaRight = 'MetaRight',
  ContextMenu = 'ContextMenu',
  Numpad0 = 'Numpad0',
  Numpad1 = 'Numpad1',
  Numpad2 = 'Numpad2',
  Numpad3 = 'Numpad3',
  Numpad4 = 'Numpad4',
  Numpad5 = 'Numpad5',
  Numpad6 = 'Numpad6',
  Numpad7 = 'Numpad7',
  Numpad8 = 'Numpad8',
  Numpad9 = 'Numpad9',
  NumpadMultiply = 'NumpadMultiply',
  NumpadAdd = 'NumpadAdd',
  NumpadSubtract = 'NumpadSubtract',
  NumpadDecimal = 'NumpadDecimal',
  NumpadDivide = 'NumpadDivide',
  F1 = 'F1',
  F2 = 'F2',
  F3 = 'F3',
  F4 = 'F4',
  F5 = 'F5',
  F6 = 'F6',
  F7 = 'F7',
  F8 = 'F8',
  F9 = 'F9',
  F10 = 'F10',
  F11 = 'F11',
  F12 = 'F12',
  NumLock = 'NumLock',
  ScrollLock = 'ScrollLock',
  Semicolon = 'Semicolon',
  Equal = 'Equal',
  Comma = 'Comma',
  Minus = 'Minus',
  Period = 'Period',
  Slash = 'Slash',
  Backquote = 'Backquote',
  BracketLeft = 'BracketLeft',
  Backslash = 'Backslash',
  BracketRight = 'BracketRight',
  Quote = 'Quote',
}
