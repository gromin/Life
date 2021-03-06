import * as React from 'react'
import './App.css'

import {
  Cell,
  cellValue,
  setFieldCell,
  tick,
  stateAsAscii,
  asciiAsState
} from './LifeState'

import Field from './Field'

const logo = require('./logo.svg')

const initialStateString = `
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
export interface AppState {
  field: object
  fieldWidth: number
  fieldHeight: number
  fieldOffset: Cell
  tickCount: number
  frameRate: number
  running: boolean
  drawing: boolean
}

class App extends React.Component {
  state: AppState

  domField: Field | null = null
  fileInput: HTMLInputElement | null = null
  fileOutput: HTMLAnchorElement | null = null
  updateTimeout: number

  constructor(props: object) {
    super(props)
    this.state = {
      field: asciiAsState(initialStateString),
      fieldWidth: 20,
      fieldHeight: 18,
      fieldOffset: {x: 0, y: 0},
      tickCount: 0,
      frameRate: 4,
      running: false,
      drawing: false
    }
  }

  componentDidMount() {
    this.handleFitScreen()
    this.updateTimeout = window.setTimeout(this.updateField, 1)
    this.processTimerTick()
  }

  componentDidUpdate(nextProps: {}, nextState: AppState) {
    clearTimeout(this.updateTimeout)
    this.updateTimeout = window.setTimeout(this.updateField, 1)
  }

  processTimerTick = () => {
    if (this.state.running) {
      this.advanceState()
    }
    window.setTimeout(this.processTimerTick, 1000 / this.state.frameRate)
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

  handleClearClick = () => {
    this.setState({field: {}})
  }

  handleLoadClick = () => {
    // console.debug('Load')
    if (this.fileInput) {
      this.fileInput.click()
    }
  }

  handleFileSelected = () => {
    const file = this.fileInput && this.fileInput.files && this.fileInput.files[0]
    if (!file) {
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const state = JSON.parse(reader.result)
        this.setState({
          tickCount: state.tickCount,
          fieldWidth: state.fieldWidth,
          fieldHeight: state.fieldHeight,
          fieldOffset: state.fieldOffset,
          field: state.field
        })
      } catch (e) {
        alert('Wrong file format')
      }
    }
    reader.readAsText(file)
  }

  handleSaveClick = () => {
    // console.debug('Save to File')
    const {field, fieldWidth, fieldHeight, fieldOffset, tickCount} = this.state
    const content = JSON.stringify({tickCount, fieldWidth, fieldHeight, fieldOffset, field}, null, '    ')
    // console.debug(content)
    if (this.fileOutput) {
      this.fileOutput.href = window.URL.createObjectURL(new Blob([content], {type: 'application/json'}))
      this.fileOutput.download = 'life-file.json'
      this.fileOutput.click()
      this.fileOutput.href = '#'
    }
  }

  handleFitScreen = () => {
    const domTable = this.domField && this.domField.domTable

    if (!domTable) {
      return
    }

    const tableBounds = domTable.getBoundingClientRect()
    const width = Math.floor((window.outerWidth - tableBounds.left * 2) / 30)
    const height = Math.floor((window.innerHeight - tableBounds.top) / 30 - 1)

    this.setState({fieldWidth: Math.max(1, Math.min(100, width)), fieldHeight: Math.max(1, Math.min(100, height))})
  }

  handlePanCenter = () => {
    this.setState({
      fieldOffset: {
        x: 0,
        y: 0
      }
    })
  }

  handlePanLeft = () => {
    this.setState({
      fieldOffset: {
        ...this.state.fieldOffset,
        x: this.state.fieldOffset.x - 1
      }
    })
  }

  handlePanRight = () => {
    this.setState({
      fieldOffset: {
        ...this.state.fieldOffset,
        x: this.state.fieldOffset.x + 1
      }
    })
  }

  handlePanUp = () => {
    this.setState({
      fieldOffset: {
        ...this.state.fieldOffset,
        y: this.state.fieldOffset.y - 1
      }
    })
  }

  handlePanDown = () => {
    this.setState({
      fieldOffset: {
        ...this.state.fieldOffset,
        y: this.state.fieldOffset.y + 1
      }
    })
  }

  handleCellClick = (e: React.MouseEvent<HTMLTableElement>) => {
    if (!this.state.drawing) {
      return
    }

    const target = (e.target as HTMLElement)

    let cell
    if (target.matches('.Cell')) {
      cell = target
    } else if (target.parentElement && target.parentElement.matches('.Cell')) {
      cell = target.parentElement
    }

    if (!cell) {
      return
    }

    const idx = parseInt(cell.getAttribute('data-idx') || '', 10)
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
        <div className="App-header">
          <img
            src={logo}
            alt="logo"
            className={['App-logo', (this.state.running ? 'App-logo--Animated' : '')].join(' ')}
          />
          {this.renderPanControls()}
        </div>
        {this.renderControls()}
        <p>Ticks: {this.state.tickCount}</p>
        {this.renderField()}
      </div>
    )
  }

  renderField() {
    return (
      <Field
        width={this.state.fieldWidth}
        height={this.state.fieldHeight}
        ref={ref => this.domField = ref}
        onClick={this.handleCellClick}
      />
    )
  }

  updateField = () => {
    const {field, fieldWidth: width, fieldHeight: height, fieldOffset} = this.state
    const asciiArray: string[] = stateAsAscii(field, width, height, fieldOffset).split('\n').join('').split('')
    const domTable = this.domField && this.domField.domTable

    if (!domTable) {
      return
    }

    const domCells = Array.from(domTable.querySelectorAll('td'))

    domCells.forEach((domCell, idx) => {
      if (asciiArray[idx] === '*') {
        domCell.className = 'Cell Cell--Live'
      } else {
        domCell.className = 'Cell Cell--Dead'
      }
    })
  }

  renderControls() {
    return (
      <div>
        <p><strong>Life.</strong></p>
        <p>
          <small>
            <a
              href="https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life"
              target="_blank"
            >
              https://en.wikipedia.org/wiki/Conway's_Game_of_Life
            </a>
          </small>
        </p>
        <p>
          <input
            size={6}
            value={this.state.fieldWidth}
            readOnly={this.state.running}
            onChange={e => this.setState({fieldWidth: parseInt(e.target.value, 10) || 0})}
          />
          &nbsp;x&nbsp;
          <input
            size={6}
            value={this.state.fieldHeight}
            readOnly={this.state.running}
            onChange={e => this.setState({fieldHeight: parseInt(e.target.value, 10) || 0})}
          />
          {this.renderCanvasControls()}
        </p>
        <p>
          <input
            size={4}
            value={this.state.frameRate}
            onChange={e => this.setState({frameRate: Math.max(1, Math.min(30, parseInt(e.target.value, 10) || 0))})}
          />
          <small>&nbsp;fps</small>
          &nbsp;
          {!this.state.drawing &&
            <button onClick={this.handlePlayPauseClick}>{this.state.running ? 'Pause' : 'Play'}</button>}
          &nbsp;
          {!this.state.running ? <button onClick={this.advanceState}>Next state &gt;</button> : null}
          &nbsp;&nbsp;&nbsp;
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
        <button onClick={this.handleFitScreen}>Fit screen</button>
        &nbsp;/&nbsp;
        <button onClick={this.toggleDrawMode}>{this.state.drawing ? 'Exit Draw Mode' : 'Enter Draw Mode'}</button>
        <span style={{display: this.state.drawing ? 'inline' : 'none'}}>
          &nbsp;/&nbsp;
          <button onClick={this.handleClearClick}>Clear entire field</button>
        </span>
        <span style={{display: this.state.drawing ? 'none' : 'inline'}}>
          &nbsp;/&nbsp;
          <button onClick={this.handleLoadClick}>Load state from .json file</button>
          <input
            type="file"
            style={{display: 'none'}}
            onChange={this.handleFileSelected}
            ref={ref => this.fileInput = ref}
          />
          <a href="#" style={{display: 'none'}} target="_blank" ref={ref => this.fileOutput = ref} />
          &nbsp;
          <button onClick={this.handleSaveClick}>Save state to .json file</button>
         </span>
      </span>
    )
  }

  renderPanControls() {
    return (
      <table
        style={{
          display: 'inline-table',
          textAlign: 'center',
          verticalAlign: 'middle',
          marginTop: '15px'
        }}
      >
        <tbody>
          <tr>
            <td colSpan={3}><button onClick={this.handlePanUp}>▲</button></td>
          </tr>
          <tr>
            <td><button onClick={this.handlePanLeft}>◀</button></td>
            <td><button onClick={this.handlePanCenter}>•</button></td>
            <td><button onClick={this.handlePanRight}>▶</button></td>
          </tr>
          <tr>
            <td colSpan={3}><button onClick={this.handlePanDown}>▼</button></td>
          </tr>
        </tbody>
      </table>
    )
  }
}

export default App
