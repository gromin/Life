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
  running: boolean
  drawing: boolean
}

class App extends React.Component {
  state: AppState
  fileInput: HTMLInputElement | null = null
  fileOutput: HTMLAnchorElement | null = null

  constructor(props: object) {
    super(props)
    this.state = {
      field: asciiAsState(initialStateString),
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
    console.debug('Load')
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
      const text = reader.result
      this.setState({field: asciiAsState(text), tickCount: 0, fieldOffset: {x: 0, y: 0}})
    }
    reader.readAsText(file)
  }

  handleSaveClick = () => {
    console.debug('Save to File')
    const {field, fieldWidth, fieldHeight, fieldOffset} = this.state
    const content = stateAsAscii(field, fieldWidth, fieldHeight, fieldOffset)
    console.debug(content)
    if (this.fileOutput) {
      this.fileOutput.href = window.URL.createObjectURL(new Blob([content], {type: 'text/plain'}))
      this.fileOutput.download = 'life-file.txt'
      this.fileOutput.click()
      this.fileOutput.href = '#'
    }
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
          <button
            onClick={this.handlePlayPauseClick}
            disabled={this.state.drawing}
          >
            {this.state.running ? 'Pause' : 'Play'}
          </button>
          &nbsp;
          {!this.state.running ? <button onClick={this.advanceState}>&gt;</button> : null}
          &nbsp;&nbsp;&nbsp;
          {!this.state.running ? <button onClick={this.handlePanLeft}>left</button> : null}
          &nbsp;
          {!this.state.running ? <button onClick={this.handlePanUp}>up</button> : null}
          &nbsp;
          {!this.state.running ? <button onClick={this.handlePanDown}>down</button> : null}
          &nbsp;
          {!this.state.running ? <button onClick={this.handlePanRight}>right</button> : null}
          &nbsp;&nbsp;
          {!this.state.running ? <button onClick={this.handlePanCenter}>re-center</button> : null}
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
        {!this.state.drawing ? <button onClick={this.handleLoadClick}>Load from file</button> : null}
        <input
          type="file"
          style={{display: 'none'}}
          onChange={this.handleFileSelected}
          ref={ref => this.fileInput = ref}
        />
        <a href="#" style={{display: 'none'}} target="_blank" ref={ref => this.fileOutput = ref} />
        &nbsp;
        {!this.state.drawing ? <button onClick={this.handleSaveClick}>Save to file</button> : null}
      </span>
    )
  }
}

export default App
