import * as React from 'react'

export interface FieldProps {
  width: number
  height: number
  onClick: (e: any) => void
}

export default class Field extends React.Component {
  props: FieldProps

  domTable: HTMLTableElement | null = null

  shouldComponentUpdate(nextProps: FieldProps) {
    if (this.props.width === nextProps.width && this.props.height === nextProps.height) {
      return false
    } else {
      return true
    }
  }

  render() {
    const cells = []

    for (let idx = 0; idx < (this.props.width * this.props.height); idx++) {
      const cellSpan = (
        <td
          key={`Cell-${idx}`}
          data-idx={idx}
          className="Cell Cell--Dead"
          style={{width: '30px', height: '30px'}}
        >
          <span />
        </td>
      )
      cells.push(cellSpan)
    }

    return (
      <table
        className="Cells"
        style={{width: 30 * this.props.width, height: 30 * this.props.height}}
        onClick={this.props.onClick}
        ref={ref => this.domTable = ref}
      >
        <tbody>
          {this.renderRows(cells)}
        </tbody>
      </table>
    )
  }

  renderRows(cells: JSX.Element[]) {
    const rows = []
    for (let row = 0; row < this.props.height; row++) {
      rows.push(
        <tr key={`Row-${row}`} data-row={row}>
          {cells.slice(row * this.props.width, row * this.props.width + this.props.width)}
        </tr>
      )
    }
    return rows
  }
}
