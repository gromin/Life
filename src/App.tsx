import * as React from 'react'
import './App.css'

const logo = require('./logo.svg')

export interface Cell {
  x: number
  y: number
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
  Object.keys(field).forEach(x => {
    newField[x] = newField[x] || {}
    Object.keys(field[x]).forEach(y => {
      newField[x][y] = true
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

let initialStateString = `
o*o
o*o
*o*
o*o
o*o
o*o
o*o
*o*
o*o
o*o
`
console.log(asciiAsState(initialStateString))

// let initialState: object = {
//   '-1': {'-1': true, '0': true, '1': true},
//   '0': {'-1': true, '0': true, '1': true},
//   '1': {'-1': true, '1': true}
// }

let initialState = asciiAsState(initialStateString)

tick({})

// console.info('start')
// for (let step: number = 0; step < maxStep; step++) {
//   if (step > 0) {
//     initialState = tick(initialState)
//   }
//   console.debug('state dump', initialState)
//   console.info(`state ${step.toString()} ASCII`)
//   console.info(stateAsAscii(initialState))
//   console.info('---')
// }
// console.info('end')

export interface AppState {
  field: object
  fieldWidth: number
  fieldHeight: number
  fieldOffset: Cell
  tickCount: number
  running: boolean
  drawing: boolean
}

class App extends React.Component {
  state: AppState

  constructor(props: object) {
    super(props)
    this.state = {
      field: initialState,
      fieldWidth: 20,
      fieldHeight: 18,
      fieldOffset: {x: 0, y: 0},
      tickCount: 0,
      running: false,
      drawing: false
    }
  }

  componentDidMount() {
    setInterval(
      () => {
        if (!this.state.running) {
          return
        }
        this.advanceState()
      },
      1000 / 4)
  }

  advanceState = () => {
    this.setState({
      field: tick(this.state.field),
      tickCount: this.state.tickCount + 1
    })
  }

  toggleDrawMode = () => {
    this.setState({drawing: !this.state.drawing})
  }

  handlePlayPauseClick = () => {
    this.setState({running: !this.state.running})
  }

  handleLoadClick = () => {
    console.log('Load')
    this.setState({field: asciiAsState(initialStateString)})
  }

  handleSaveClick = () => {
    console.log('Save')
    console.log(stateAsAscii(this.state.field, this.state.fieldWidth, this.state.fieldHeight, this.state.fieldOffset))
  }

  handlePanLeft = () => {
    this.setState({
      fieldOffset: {
        ...this.state.fieldOffset,
        x: this.state.fieldOffset.x + Math.ceil(this.state.fieldWidth / 4)
      }
    })
  }

  handlePanRight = () => {
    this.setState({
      fieldOffset: {
        ...this.state.fieldOffset,
        x: this.state.fieldOffset.x - Math.ceil(this.state.fieldWidth / 4)
      }
    })
  }

  handlePanUp = () => {
    this.setState({
      fieldOffset: {
        ...this.state.fieldOffset,
        y: this.state.fieldOffset.y + Math.ceil(this.state.fieldHeight / 4)
      }
    })
  }

  handlePanDown = () => {
    this.setState({
      fieldOffset: {
        ...this.state.fieldOffset,
        y: this.state.fieldOffset.y - Math.ceil(this.state.fieldHeight / 4)
      }
    })
  }

  handleCellClick = (e: any) => {
    if (!this.state.drawing) {
      return
    }

    let cell
    if (e.target.matches('.Cell')) {
      cell = e.target
    } else if (e.target.parentNode.matches('.Cell')) {
      cell = e.target.parentNode
    }

    if (!cell) {
      return
    }

    const idx = parseInt(cell.getAttribute('data-idx'), 10)
    const y = Math.floor(idx / this.state.fieldWidth),
          x = (idx - y * this.state.fieldWidth)

    const alignedX = x - Math.floor(this.state.fieldWidth / 2) + this.state.fieldOffset.x,
          alignedY = y - Math.floor(this.state.fieldHeight / 2) + this.state.fieldOffset.y

    const alignedCell = {x: alignedX, y: alignedY}
    const newValue = !cellValue(this.state.field, alignedCell)

    this.setState({field: setFieldCell(this.state.field, alignedCell, newValue)})
  }

  render() {
    return (
      <div className="App">
        <div className="App-header" onClick={this.handlePlayPauseClick}>
          <img
            src={logo}
            alt="logo"
            className={['App-logo', (this.state.running ? 'App-logo--Animated' : '')].join(' ')}
          />
        </div>
        {this.renderControls()}
        <p>Ticks: {this.state.tickCount}</p>
        {this.renderField()}
      </div>
    )
  }

  renderField() {
    const {field, fieldWidth: width, fieldHeight: height, fieldOffset} = this.state

    const asciiArray: string[] = stateAsAscii(field, width, height, fieldOffset).split('\n').join('').split('')

    const cells =
      asciiArray
        .reduce(
          (nodes: JSX.Element[], nextChar: string, idx: number) => {
            const className = `Cell ${nextChar === '*' ? 'Cell--Live' : 'Cell--Dead'}`
            const cellSpan = <span key={`Cell-${idx}`} className={className} data-idx={idx}><span /></span>
            return nodes.concat(cellSpan)
          },
          [])

    return (
      <div
        className="Cells"
        style={{width: 30 * width, height: 30 * height}}
        onClick={this.handleCellClick}
      >
        {cells}
      </div>
    )
  }

  renderControls() {
    return (
      <div>
        <p><strong>Life.</strong></p>
        <p>
          <input
            size={6}
            value={this.state.fieldWidth}
            readOnly={this.state.running}
            onChange={e => this.setState({fieldWidth: parseInt(e.target.value, 10)})}
          />
          &nbsp;x&nbsp;
          <input
            size={6}
            value={this.state.fieldHeight}
            readOnly={this.state.running}
            onChange={e => this.setState({fieldHeight: parseInt(e.target.value, 10)})}
          />
          {this.renderCanvasControls()}
        </p>
        <p>
          <button onClick={this.handlePlayPauseClick} disabled={this.state.drawing}>{this.state.running ? 'Pause' : 'Play'}</button>
          &nbsp;
          {!this.state.running ? <button onClick={this.advanceState}>&gt;</button> : null}
          &nbsp;&nbsp;&nbsp;
          {!this.state.running ? <button onClick={this.handlePanLeft}>left</button> : null}
          {!this.state.running ? <button onClick={this.handlePanUp}>up</button> : null}
          {!this.state.running ? <button onClick={this.handlePanDown}>down</button> : null}
          {!this.state.running ? <button onClick={this.handlePanRight}>right</button> : null}
        </p>
      </div>
    )
  }

  renderCanvasControls() {
    if (this.state.running) {
      return null
    }

    return (
      <span style={{margin: '0 0.4em'}}>
        <button onClick={this.toggleDrawMode}>{this.state.drawing ? 'Exit Draw Mode' : 'Enter Draw Mode'}</button>
        &nbsp;
        <button onClick={this.handleLoadClick}>Load from file</button>
        &nbsp;
        <button onClick={this.handleSaveClick}>Save to file</button>
      </span>
    )
  }
}

export default App
