const file = {}

file.saveAs = (text, filename) => {
  let aData = document.createElement('a');
  aData.setAttribute('href', 'data:text/plain;charset=urf-8,' + encodeURIComponent(text));
  aData.setAttribute('download', filename);
  aData.click();
  if (aData.parentNode)
    aData.parentNode.removeChild(aData);
}

file.createCSV = (strategy, testResults) => {
  let csv = ""
  for (i = 0; i < testResults.length; i++) {
    csv += i === 0 ? ("IQ Indicator;") : (strategy + ";")
    csv += testResults[i].map(val => JSON.stringify(val)).join(';').replaceAll('"', '')
    csv += "\n"
  }
  return csv
}

file.createHTML = (strategy, testResults, equityList) => {
  let html = `<!DOCTYPE html>
<html>
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto">
<link rel="stylesheet" href="https://www.w3schools.com/w3css/4/w3.css">
<head>
<title id="tiqTitle" data-iqindicator="${strategy}">${strategy}</title>
<!-- Includes all JS & CSS for the JavaScript Data Grid -->
<script src="https://cdn.jsdelivr.net/npm/ag-grid-community/dist/ag-grid-community.min.js"></script>
<style>
    html {
      height: 100%;
    }

    body {
      background-color: #e8e8e8 !important;
      background: radial-gradient(circle at top, #e0e0e0, #e8e8e8);
      background-size: 100% 100%;
      background-repeat: no-repeat;
      min-height: 100%;
    }

    .dark-mode {
      background-color: #181818 !important;
      background: radial-gradient(circle at top, #313131, #181818);
      background-size: 100% 100%;
      background-repeat: no-repeat;
      color: #00ffff;
    }

    #services-table tr{
      cursor: pointer;
    }

    #services-table td:hover {
      background-color: #00000050;
    }

    .dark-mode #services-table td:hover {
      background-color: #ffffff30;
    }

    .ag-select-list {
      background-color: #e8e8e8;
    }

    .ag-header-cell-label .ag-header-cell-text {
      white-space: break-spaces !important;
    }

    .dark-mode .ag-select-list {
      background-color: #313131;
    }
    .ag-header-cell-label .ag-header-cell-text {
      word-wrap:break-word;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .highlight {
      background-color: #e0ffff;
    }

    .dark-mode .highlight {
      background-color: #36454F;
    }

    .dark-mode .w3-button {
      background-color: #00ffff;
      color: black;
    }

    .dark-mode input {
      color: #00ffff;
    }

    .w3-modal-content {
      background: radial-gradient(circle at top, #ffffff, #e8e8e8);
      background-size: 100% 100%;
      background-repeat: no-repeat;
    }

    .dark-mode .w3-modal-content {
      background: radial-gradient(circle at top, #313131, #181818);
    }

    .selected {
      background-color: #00ffff;
      color: black;
    }

    .column-button {
      padding: 8px;
    }

    .prevent-select {
      -webkit-user-select: none;
      /* Safari */
      -ms-user-select: none;
      /* IE 10 and IE 11 */
      user-select: none;
      /* Standard syntax */
    }

    /* Custom scrollbar styles */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    ::-webkit-scrollbar-track {
      background: #f1f1f1;
    }

    ::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 3px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: #555;
    }

    .dark-mode ::-webkit-scrollbar-track {
      background: #2c2c2c;
    }

    .dark-mode ::-webkit-scrollbar-thumb {
      background: #00ffff;
    }

    .dark-mode ::-webkit-scrollbar-thumb:hover {
      background: #00ffffe0;
    }
</style>
</head>
<body class="w3-small">
  <div class="w3-container w3-padding">
    <div class="w3-cell w3-container">
      <h5>${strategy}</h5>
    </div>
    <div id="darkModeBtn" class="w3-cell w3-container" onclick="toggleTheme()" style="display:none">
      <button class="w3-button w3-circle w3-card" style="width:36px;height:36px;padding: 4px 0 0 0">
        <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" />
          <path fill-rule="evenodd" clip-rule="evenodd"
            d="M8.23129 2.24048C9.24338 1.78695 10.1202 2.81145 9.80357 3.70098C8.72924 6.71928 9.38932 10.1474 11.6193 12.3765C13.8606 14.617 17.3114 15.2755 20.3395 14.1819C21.2206 13.8637 22.2173 14.7319 21.7817 15.7199C21.7688 15.7491 21.7558 15.7782 21.7427 15.8074C20.9674 17.5266 19.7272 19.1434 18.1227 20.2274C16.4125 21.3828 14.3957 22.0001 12.3316 22.0001H12.3306C9.93035 21.9975 7.6057 21.1603 5.75517 19.6321C3.90463 18.1039 2.64345 15.9797 2.18793 13.6237C1.73241 11.2677 2.11094 8.82672 3.2586 6.71917C4.34658 4.72121 6.17608 3.16858 8.20153 2.25386L8.23129 2.24048Z"
            fill="#323232" />
        </svg>
      </button>
    </div>
    <div id="lightModeBtn" class="w3-cell w3-container" onclick="toggleTheme()" style="display:none">
      <button class="w3-button w3-circle w3-card" style="width:36px;height:36px;padding: 4px 0 0 0;background-color: #00ffff;">
        <svg width="24px" height="24px" viewBox="0 0 35 35" fill="#000000" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.5,25.88a8.38,8.38,0,1,1,8.38-8.38A8.389,8.389,0,0,1,17.5,25.88Zm0-14.26a5.88,5.88,0,1,0,5.88,5.88A5.887,5.887,0,0,0,17.5,11.62Z" />
          <path d="M17.5,5.471h-.034A1.251,1.251,0,0,1,16.25,4.187l.075-2.721A1.267,1.267,0,0,1,17.609.25a1.251,1.251,0,0,1,1.215,1.284l-.075,2.721A1.249,1.249,0,0,1,17.5,5.471Z" />
          <path d="M26.893,9.364a1.25,1.25,0,0,1-.859-2.158l1.978-1.871A1.25,1.25,0,0,1,29.73,7.151L27.752,9.022A1.242,1.242,0,0,1,26.893,9.364Z" />
          <path d="M33.5,18.837h-.036l-2.722-.077a1.249,1.249,0,0,1-1.213-1.284,1.211,1.211,0,0,1,1.285-1.214l2.721.077a1.25,1.25,0,0,1-.035,2.5Z" />
          <path d="M28.748,30.13a1.248,1.248,0,0,1-.909-.392L25.97,27.759a1.25,1.25,0,1,1,1.817-1.717l1.869,1.98a1.249,1.249,0,0,1-.908,2.108Z" />
          <path d="M17.4,34.75h-.037a1.249,1.249,0,0,1-1.213-1.285l.079-2.721a1.25,1.25,0,0,1,2.5.072l-.079,2.721A1.249,1.249,0,0,1,17.4,34.75Z" />
          <path d="M6.112,29.989a1.249,1.249,0,0,1-.857-2.159l1.98-1.867A1.25,1.25,0,1,1,8.95,27.781L6.969,29.648A1.242,1.242,0,0,1,6.112,29.989Z" />
          <path d="M4.221,18.72H4.184l-2.721-.081A1.25,1.25,0,0,1,.251,17.352,1.237,1.237,0,0,1,1.537,16.14l2.721.081a1.25,1.25,0,0,1-.037,2.5Z" />
          <path d="M8.135,9.335a1.248,1.248,0,0,1-.91-.393L5.359,6.961a1.25,1.25,0,1,1,1.82-1.715L9.046,7.228a1.251,1.251,0,0,1-.911,2.107Z" />
        </svg>
      </button>
    </div>
    <div class="w3-cell w3-container">
      <button class="w3-button w3-circle w3-card" style="width:36px;height:36px;padding: 10px 0 0 8px;" onclick="openServiceModal()">
        <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
          <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
          <g id="SVGRepo_iconCarrier">
            <path d="M0 3H16V1H0V3Z" fill="#000000"></path>
            <path d="M2 7H14V5H2V7Z" fill="#000000"></path>
            <path d="M4 11H12V9H4V11Z" fill="#000000"></path>
            <path d="M10 15H6V13H10V15Z" fill="#000000"></path>
          </g>
        </svg>
      </button>
    </div>
    <div class="w3-container w3-padding" style="overflow-x:auto;max-height: 40vh;height: 40vh;">
      <div id="myGrid" class="w3-card-4 w3-round-large" style="overflow-x:auto;height: 100%;"></div>
    </div>`


  html += `
  <div class="w3-container w3-padding">
    <div class="w3-card-4">
      <header class="w3-container">
        <h3>Equity Chart</h3>
      </header>
      <div id="equityChart" style="width:100%;max-width:100%;max-height: 40vh;"></div>
    </div>
  </div>`

  html += `
  <div id="filterColumnModal" class="w3-modal">
    <div class="w3-modal-content w3-animate-zoom" style="max-width:600px;">
      <div class="w3-container w3-border-bottom w3-padding-16 w3-cell-row">
        <div class="w3-cell" style="position: relative;width: 250px;">
          <input class="w3-input w3-cell" id="modalFilter" style="width: 250px; outline-width: 0;background-color: transparent;" type="text" placeholder="filter..."
            oninput="toggleClearButton()" />
          <span id="clearButton" class="prevent-select w3-circle w3-button w3-aqua" onclick="clearFilter()"
            style="width: 20px;height: 20px;padding: 0; position: absolute; right: 0px; top: 50%; transform: translateY(-50%); cursor: pointer; display: none;">&times;</span>
        </div>
        <button onclick="selectAll()" type="button" class="w3-button w3-round w3-cell" style="margin-left: 5px;background-color: #00ffff;">(De)Select all</button>
        <button onclick="modalClose()" type="button" class="w3-button w3-round w3-right w3-cell" style="background-color: #00ffff;"><span style="transform: translateY(-50%);">&times;</span></button>
      </div>
      <div id="filterColumnTable" style="overflow-x:auto;overflow-y:auto;height:auto;max-height:70vh;z-index:-5;" class="w3-card">
        <section>
          <table id="services-table" class="w3-padding" style="width: 100%;">
            <tbody>`
  for (i = 0; i < testResults[0].length; i++) {
    html += `<tr><td class="column-button w3-round selected" onclick="modalSelectedColumn(this)">${testResults[0][i]}</td></tr>`
  }

  html += `
  </tbody>
          </table>
        </section>
      </div>
    </div>
  </div>`

  html += `
  <script src="https://cdn.plot.ly/plotly-3.0.0.min.js"></script>
  <!-- Includes all JS & CSS for the JavaScript Data Grid -->
  <script src="https://cdn.jsdelivr.net/npm/ag-grid-community/dist/ag-grid-community.min.js"></script>
  <script>
    class BooleanRenderer {
      eGui;

      // Optional: Params for rendering. The same params that are passed to the cellRenderer function.
      init(params) {
        const label = document.createElement("label");
        label.innerHTML = params.value ? "Yes" : "No";

        this.eGui = document.createElement("span");
        this.eGui.setAttribute(
          "style",
          "display: flex; justify-content: center; height: 100%; align-items: center",
        );
        this.eGui.appendChild(label);
      }

      // Required: Return the DOM element of the component, this is what the grid puts into the cell
      getGui() {
        return this.eGui;
      }

      // Required: Get the cell to refresh.
      refresh(params) {
        return false;
      }
    }

    const myTheme = agGrid.themeQuartz
      .withParams(
        {
          inputBackgroundColor: "#e8e8e8",
          menuBackgroundColor: "#e8e8e8",
          backgroundColor: "#FFFFFF00",
          foregroundColor: "black",
          browserColorScheme: "light",
        },
        "light-aqua",
      )
      .withParams(
        {
          inputBackgroundColor: "#313131",
          menuBackgroundColor: "#313131",
          backgroundColor: "#FFFFFF00",
          foregroundColor: "#00ffff",
          browserColorScheme: "dark",
        },
        "dark-aqua",
      );`;

  html += `
    let rowData = [];`

  let colTypes = []
  for (i = 1; i < testResults.length; i++) {
    let rowData = testResults[i].map((val, index) => {
      if (i === 1) {
        colTypes.push(typeof val === 'boolean' ? 'bool' : 'text');
      }
      return `col${index}: ${JSON.stringify(val)}`;
    }).join(', ')
    html += `
    rowData.push({ equityIndex: ${i - 1}, ${rowData} })`
  }


  html += `
    let equityList = [];`
  for (i = 0; i < equityList.length; i++) {
    html += `
    equityList.push(${JSON.stringify(equityList[i])})`
  }
  html += `\n`

  const columnDefTemplate = `{ headerName: '#TITLE#', field: "col#INDEX#" #CELL_RENDERER#}`
  html += `
  const columnDefs = [`
  html += testResults[0].map((val, index) => columnDefTemplate.replace('#INDEX#', index).replaceAll('#TITLE#', val).replaceAll('#CELL_RENDERER#', (colTypes[index] === 'bool' ? ', cellRenderer: BooleanRenderer' : ''))).join(',')
  html += ']\n'

  html += `
    const defaultColDef = {
      filter: true,
      initialWidth: 120,
      minWidth: 100,
      wrapHeaderText: true,
      autoHeaderHeight: true
    };

    let currentEquityIndex = -1;

    const gridOptions = {
      theme: myTheme,
      columnDefs,
      rowData,
      defaultColDef,
      onCellMouseOver: (event) => {
        if (event.data.equityIndex !== undefined && event.data.equityIndex !== currentEquityIndex) {
          currentEquityIndex = event.data.equityIndex;
          drawChart(equityList[event.data.equityIndex]);
        }
      }
    };

    const gridApi = agGrid.createGrid(
      document.querySelector("#myGrid"),
      gridOptions,
    );

    function setDarkMode(enabled) {
      document.body.dataset.agThemeMode = enabled ? "dark-aqua" : "light-aqua";
    }

    function toggleTheme() {
      var element = document.body;
      element.classList.toggle("dark-mode");
      if (element.classList.contains("dark-mode")) {
        localStorage.setItem('tiqMode', 'dark')
        document.getElementById("darkModeBtn").style.display = "none";
        document.getElementById("lightModeBtn").style.display = "";
        setDarkMode(true);
      } else {
        localStorage.setItem('tiqMode', 'light')
        document.getElementById("darkModeBtn").style.display = "";
        document.getElementById("lightModeBtn").style.display = "none";
        setDarkMode(false);
      }
    }
    document.onreadystatechange = function () {
      if (document.readyState == "complete") {
        init();
      }
    }

    function init() {
      var mode = localStorage.getItem('tiqMode');
      console.log('init', mode)
      if (mode === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById("darkModeBtn").style.display = "none";
        document.getElementById("lightModeBtn").style.display = "";
        console.log('init dark')
        setDarkMode(true);
      }
      else {
        document.getElementById("darkModeBtn").style.display = "";
        document.getElementById("lightModeBtn").style.display = "none";
        console.log('init light')
        setDarkMode(false);
      }

      let iqIndicator = document.getElementById('tiqTitle').getAttribute('data-iqindicator');
      let selectedRows = JSON.parse(localStorage.getItem('tiqSelectedColumns-' + iqIndicator));
      if (selectedRows) {
        const columns = document.querySelectorAll('#filterColumnTable .column-button');
        for (let column of columns) {
          if (!selectedRows.includes(column.parentElement.rowIndex)) {
            column.classList.toggle('selected');
          }
        }
        let invisibleColumns = columnDefs.filter((column, index) => !selectedRows.includes(index)).map(column => column.field);
        gridApi.setColumnsVisible(invisibleColumns, false);
        gridApi.autoSizeColumns(columnDefs.map((column) => column.field), true);
      }
    }

    function toggleClearButton() {
      const filterInput = document.getElementById('modalFilter');
      const clearButton = document.getElementById('clearButton');
      if (filterInput.value.length > 0) {
        clearButton.style.display = 'block';
      } else {
        clearButton.style.display = 'none';
      }
    }

    function clearFilter() {
      const filterInput = document.getElementById('modalFilter');
      filterInput.value = '';
      toggleClearButton();
      filterInput.dispatchEvent(new Event('input'));
    }

    function modalSelectedColumn(element) {
      element.classList.toggle('selected');
      let index = element.parentNode.rowIndex;

      gridApi.setColumnsVisible([columnDefs[index].field], element.classList.contains('selected'));
    }

    function openServiceModal() {
      document.getElementById('filterColumnModal').style.display = 'block';
    }

    function selectAll() {
      const rows = document.querySelectorAll('#filterColumnTable tr:not([style*="display: none"])');
      let deselectAll = rows[0].querySelector('.column-button').classList.contains('selected');

      for (let row of rows) {
        const column = row.querySelector('.column-button');
        if (!deselectAll) {
          column.classList.add('selected');
        } else {
          column.classList.remove('selected');
        }
      }

      gridApi.setColumnsVisible(columnDefs.map(column => column.field), !deselectAll);
    }

    function modalClose() {
      let selectedRows = [];
      const columns = document.querySelectorAll('#filterColumnTable .column-button');
      for (let column of columns) {
        if (column.classList.contains('selected')) {
          selectedRows.push(column.parentElement.rowIndex);
        }
      }

      let iqIndicator = document.getElementById('tiqTitle').getAttribute('data-iqindicator');
      console.log('tiqSelectedColumns-' + iqIndicator);
      localStorage.setItem('tiqSelectedColumns-' + iqIndicator, JSON.stringify(selectedRows));
      document.getElementById('filterColumnModal').style.display = 'none';
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function (event) {
      if (event.target == document.getElementById('filterColumnModal')) {
        modalClose();
      }
    }

    document.getElementById('modalFilter').addEventListener('input', function () {
      var filter = this.value.toLowerCase();
      var rows = document.getElementById("filterColumnTable").querySelectorAll("tr");
      for (var i = 0; i < rows.length; i++) {
        var txtValue = rows[i].textContent || rows[i].innerText;
        if (txtValue.toLowerCase().indexOf(filter) > -1) {
          rows[i].style.display = "";
        } else {
          rows[i].style.display = "none";
        }
      }
    });

    function drawChart(values) {
      const yArray = values;
      const xArray = yArray.map((_, i) => i + 1);
      const startVal = Math.min(...yArray) - 5;
      const endVal = Math.max(...yArray) + 5;

      // Define Data
      const data = [{
        fill: "tozeroy",
        fillgradient: {
          type: 'vertical',
          colorscale: [[0, 'rgba(31,119,180,0.5)'], [1, 'rgba(31,119,180,0)']],
          start: endVal,
          stop: startVal / 2
        },
        x: xArray,
        y: yArray,
        mode: "lines"
      }];

      // Define Layout
      const layout = {
        xaxis: { showgrid: false },
        yaxis: { range: [startVal, endVal], showgrid: false },
        plot_bgcolor: "transparent",
        paper_bgcolor: 'transparent',
        font: { color: 'grey' },
        hovermode: 'x'
      };

      // Display using Plotly
      Plotly.newPlot("equityChart", data, layout);
    }
  </script></body></html>`
  return html
}