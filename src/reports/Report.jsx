import React from 'react'
import Header from '../common/Header.jsx'
import LoadingIcon from '../common/LoadingIcon.jsx'
import Tables from './tables/index.jsx'
import fileSaver from 'file-saver'

import './Report.css'

class Report extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      error: false,
      isLoaded: false,
      report: null
    }

    this.selectReport = this.selectReport.bind(this)
    this.generateCSV = this.generateCSV.bind(this)
    this.tableRef = React.createRef()
    this.tableTwoRef = React.createRef()
  }

  generateCSV() {
    const report = this.state.report
    // TODO: create a function for this, it's also used in render as the "headingText"
    let theCSV = `"Table ${report.table}: ${report.description}${
      report.table === 'R1' ? '"' : `, ${report.year}"`
    }\n`
    const msa = report.msa
      ? `"MSA/MD: ${report.msa.id} - ${report.msa.name}"\n`
      : '"Nationwide"\n'
    theCSV = theCSV + msa
    const institution = report.respondentId
      ? `"Institution: ${report.respondentId} - ${report.institutionName}"\n`
      : ''
    theCSV = theCSV + institution

    const tHeadRows = this.tableRef.current.tHead.rows
    theCSV = theCSV + this.buildCSVRows(tHeadRows, 'head')

    const tBodyRows = this.tableRef.current.tBodies[0].rows
    theCSV = theCSV + this.buildCSVRows(tBodyRows, 'body')

    if (this.tableTwoRef.current) {
      theCSV = theCSV + '\n\n'
      const tTwoHeadRows = this.tableTwoRef.current.tHead.rows
      theCSV = theCSV + this.buildCSVRows(tTwoHeadRows, 'head')

      const tTwoBodyRows = this.tableTwoRef.current.tBodies[0].rows
      theCSV = theCSV + this.buildCSVRows(tTwoBodyRows, 'body')
    }

    fileSaver.saveAs(
      new Blob([theCSV], { type: 'text/csv;charset=utf-16' }),
      `${this.createFileName(report)}.csv`
    )
  }

  buildCSVRows(rows, rowType) {
    let theCSVRows = ''
    Array.from(rows).forEach((row, rowIndex) => {
      // in a thead, account for the rowSpan by adding an empty cell
      if (rowType === 'head') {
        if (rowIndex !== 0) theCSVRows = theCSVRows + ','
      }
      // loop through the cells
      Array.from(row.cells).forEach((cell, cellIndex) => {
        // add the content
        theCSVRows = theCSVRows + '"' + cell.innerHTML + '"'
        if (cell.hasAttribute('colspan')) {
          const spanCount = parseInt(cell.getAttribute('colspan'), 10)
          let i = 0
          for (i; i < spanCount - 1; i++) {
            theCSVRows = theCSVRows + ','
          }
        }
        // last child
        if (row.cells.length - 1 === cellIndex) {
          theCSVRows = theCSVRows + '\n'
        } else {
          theCSVRows = theCSVRows + ','
        }
      })
    })

    return theCSVRows
  }

  createFileName(report) {
    let filename = `report-${report.table}`
    if (report.respondentId) {
      filename =
        filename +
        `-${report.respondentId}-${report.institutionName
          .replace(',', '')
          .replace(' ', '')}`
    }
    if (report.msa) {
      filename =
        filename +
        `-${report.msa.id}-${report.msa.name.replace(',', '').replace(' ', '')}`
    }

    return filename
  }

  componentDidMount() {
    const { params } = this.props.match

    let year = params.year
    let msaMdId = params.msaMdId
    let reportId = params.reportId
    const env = 'prod'
    const ext = year === '2017' ? '.txt' : '.json'
    let url = `https://s3.amazonaws.com/cfpb-hmda-public/${env}/reports/`
    if (params.stateId) {
      url += `aggregate/${year}/${msaMdId}/${reportId}${ext}`
    } else if (params.institutionId) {
      if (reportId === 'R1') {
        msaMdId = 'nationwide'
        reportId = 'IRS'
      }
      url += `disclosure/${year}/${
        params.institutionId
      }/${msaMdId}/${reportId}${ext}`
    } else {
      url += `national/${year}/${reportId}${ext}`
    }
    fetch(url)
      .then(response => {
        if (response.ok) return response.json()
        throw new Error('Network response was not ok.')
      })
      .then(result => {
        this.setState({
          isLoaded: true,
          report: result
        })
      })
      .catch(error => {
        this.setState({
          isLoaded: true,
          error: true
        })
      })
  }

  selectReport(report, reportType) {
    /*
      reportType only needed for Table.One
      it renders extra columns for the aggregate version
    */
    /*
      tables 1, 3-2, 11's, 12-2 have 2 tables, so we're going to pass different refs
      https://reactjs.org/docs/refs-and-the-dom.html#exposing-dom-refs-to-parent-components
      https://gist.github.com/gaearon/1a018a023347fe1c2476073330cc5509
    */
    const table = report.table
    if (table.match(/^i$/))
      return <Tables.I ref={this.tableRef} report={report} />
    if (table.match(/^1$/))
      return (
        <Tables.One
          ref={this.tableRef}
          reportType={reportType}
          report={report}
        />
      )
    if (table.match(/^2$/))
      return <Tables.Two ref={this.tableRef} report={report} />
    if (table.match(/^3-1$/))
      return <Tables.ThreeOne ref={this.tableRef} report={report} />
    if (table.match(/^3-2$/))
      return (
        <Tables.ThreeTwo
          tableOneRef={this.tableRef}
          tableTwoRef={this.tableTwoRef}
          report={report}
        />
      )
    if (table.match(/^4-/))
      return <Tables.Four ref={this.tableRef} report={report} />
    if (table.match(/^5-/))
      return <Tables.Five ref={this.tableRef} report={report} />
    if (table.match(/^7-/))
      return <Tables.Seven ref={this.tableRef} report={report} />
    if (table.match(/^8-/))
      return <Tables.Eight ref={this.tableRef} report={report} />
    if (table.match(/^9$/))
      return <Tables.Nine ref={this.tableRef} report={report} />
    if (table.match(/^11-/))
      return (
        <Tables.Eleven
          tableOneRef={this.tableRef}
          tableTwoRef={this.tableTwoRef}
          report={report}
        />
      )
    if (table.match(/^12-1$/))
      return <Tables.TwelveOne ref={this.tableRef} report={report} />
    if (table.match(/^12-2$/))
      return (
        <Tables.TwelveTwo
          tableOneRef={this.tableRef}
          tableTwoRef={this.tableTwoRef}
          report={report}
        />
      )

    if (table.match(/^A4/))
      return <Tables.A4 ref={this.tableRef} report={report} />
    if (table.match(/^A/))
      return <Tables.A ref={this.tableRef} report={report} />
    if (table.match(/^B/))
      return <Tables.B ref={this.tableRef} report={report} />
    if (table.match(/^IRS/))
      return <Tables.R ref={this.tableRef} report={report} />
  }

  render() {
    if (!this.state.isLoaded) return <LoadingIcon />

    if (this.state.error)
      return (
        <div className="Report">
          <div className="alert alert-error">
            <div className="alert-body">
              <h3 className="alert-heading">No report exists</h3>
              <p className="alert-text">
                No data that meets the criteria of this table was reported by the institution.
              </p>
            </div>
          </div>
        </div>
      )

    let reportType = 'disclosure'
    if (this.props.match.params.stateId) reportType = 'aggregate'

    const report = this.state.report
    let table = report.table
    if (table === 'IRS') table = 'R1'
    const headingText = report
      ? `Table ${table}: ${report.description}${
          table === 'R1' ? '' : `, ${report.year}`
        }`
      : null

    return (
      <div className="Report">
        <Header type={3} headingText={headingText}>
          {report.respondentId ? (
            <p>
              Institution: {report.respondentId} - {report.institutionName}
            </p>
          ) : null}

          {report.msa ? (
            <p>
              MSA/MD: {report.msa.id} - {report.msa.name}
            </p>
          ) : (
            <p>Nationwide</p>
          )}
          <button onClick={this.generateCSV}>Save as CSV</button>
        </Header>

        {this.selectReport(report, reportType)}
        <p className="report-date">Report date: {report.reportDate}</p>
      </div>
    )
  }
}

export default Report
