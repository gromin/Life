export interface Cell {
  x: number
  y: number
}

export function enumNeighbours({x, y}: Cell) {
  let res = [
    {x: x - 1, y: y - 1}, {x: x, y: y - 1}, {x: x + 1, y: y - 1},
    {x: x - 1, y: y},   /*{x, y},*/         {x: x + 1, y: y},
    {x: x - 1, y: y + 1}, {x: x, y: y + 1}, {x: x + 1, y: y + 1}
  ]
  return res
}

export function cellValue(state: object, {x, y}: Cell) {
  return state && state[x.toString()] && state[x.toString()][y.toString()] ? 1 : 0
}

export function countNeighbours(state: object, {x, y}: Cell) {
  return enumNeighbours({x, y}).reduce((count, cell) => count + cellValue(state, cell), 0)
}

export function getDeadNeighbors(state: object, {x, y}: Cell) {
  return (
    enumNeighbours({x, y})
      .reduce(
        (deadCells: [Cell], cell: Cell) => {
          if (cellValue(state, cell) === 0) {
            return deadCells.concat(cell)
          } else {
            return deadCells
          }
        },
        [])
  )
}

export function setFieldCell(field: object, {x: appendX, y: appendY}: Cell, value: boolean = true) {
  const newField = {}

  // Copy passed `field` to `newField`
  Object.keys(field).forEach(row => {
    newField[row] = newField[row] || {}
    Object.keys(field[row]).forEach(col => {
      newField[row][col] = true
    })
  })

  const x = appendX.toString(),
        y = appendY.toString()

  if (value === true) {
    newField[x] = newField[x] || {}
    newField[x][y] = true
  } else {
    if (newField[x] && newField[x][y]) {
      delete newField[x][y]
      if (Object.keys(newField[x]).length === 0) {
        delete newField[x]
      }
    }
  }

  console.debug('appending', newField, {appendX, appendY})
  return newField
}

export function tick(state: object = {}) {
  let newState = {}
  const computedDeadCells = {} // A little optimization to not compute some cells many times

  // Iterate over each living cell in current state
  Object.keys(state).forEach(row => {
    Object.keys(state[row]).forEach(col => {

      let x: number = parseInt(row, 10)
      let y: number = parseInt(col, 10)
      
      const cell: Cell = {x, y}
      console.debug('processing cell', cell)

      // Transfer old living cell to new state only when she has 2 or 3 living neighbours
      const neighboursCount = countNeighbours(state, cell)
      console.debug('processing cell count', neighboursCount)
      if (neighboursCount === 2 || neighboursCount === 3) {
        newState = setFieldCell(newState, cell)
      }

      // For each living cell look at her dead neighbours, as life can reproduce itself there
      const deadNeighbours = getDeadNeighbors(state, cell)
      console.debug('processing cell dead neighbours', deadNeighbours)
      deadNeighbours.forEach(deadCell => {
        // Skip already processed dead cells
        if (computedDeadCells[deadCell.x] && computedDeadCells[deadCell.x][deadCell.y]) {
          console.debug('processing cell dead neighbour computed cache hit', deadCell)
          return
        }
        // Let there be new Life, sometimes
        if (countNeighbours(state, deadCell) === 3) {
          newState = setFieldCell(newState, deadCell)
          if (!computedDeadCells[deadCell.x]) {
            computedDeadCells[deadCell.x] = {}
          }
          computedDeadCells[deadCell.x][deadCell.y] = true
        }
      })
    })
  })

  return newState
}

export function stateAsAscii(state: object, width: number = 11, height: number = 11, center: Cell = {x: 0, y: 0}) {
  let str = ''

  const startY = center.y - Math.floor(height / 2),
          endY = center.y + Math.ceil(height / 2),
        startX = center.x - Math.floor(width / 2),
          endX = center.x + Math.ceil(width / 2)

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const isAlive = state[x.toString()] && state[x.toString()][y.toString()]
      str += (isAlive ? '*' : '.')
    }
    if (y < endY) { str += '\n' }
  }
  return str
}

export function asciiAsState(ascii: string) {
  const res = {}

  // Clear empty strings and split to rows
  const rows = ascii.replace(/^\n/img, '').replace(/\n$/img, '').split('\n')

  // Calculate dimensions and center point
  const height = rows.length
  const width = rows.reduce((maxLength, row) => Math.max(row.length, maxLength), 0)
  const center: Cell = {x: Math.floor(width / 2), y: Math.floor(height / 2)}

  // Map every living cell ('*') from ascii string to aligned position on field
  for (let y = 0; y < height; y++) {
    const alignedY = (y - center.y).toString()

    for (let x = 0; x < rows[y].length; x++) {
      const alignedX = (x - center.x).toString()

      if (rows[y][x] === '*') {
        res[alignedX] = res[alignedX] || {}
        res[alignedX][alignedY] = true
      }
    }
  }

  return res
}
