const file = {}

file.saveAs = (text, filename) => {
  let aData = document.createElement('a');
  aData.setAttribute('href', 'data:text/plain;charset=urf-8,' + encodeURIComponent(text));
  aData.setAttribute('download', filename);
  aData.click();
  if (aData.parentNode)
    aData.parentNode.removeChild(aData);
}

file.createCSV = (testResults) => {
  let csv = ""
  for (i = 0; i < testResults.length; i++) {
    csv += testResults[i].map(val => JSON.stringify(val)).join(';').replaceAll('"', '')
    csv += "\n"
  }
  return csv
}

file.createHTML = (ticker, strategy, testResults) => {
  let html = `<!DOCTYPE html>
<html>
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto">
<link rel="stylesheet" href="https://www.w3schools.com/w3css/4/w3.css">
<head>
<title>${ticker} - ${strategy}</title>
<style>
th {
  cursor: pointer;
}

th.rotate {
  /* Something you can count on */
  height: 150px;
  white-space: nowrap;
}
th.rotate>div {
  transform:
    /* Magic Numbers */
    translate(25px, 51px)
    /* 45 is really 360 - 45 */
    rotate(315deg);
  width: 90px;
  margin-left: -40px;
  margin-top: 50px;
}
th.rotate>div>span {
  /*border-bottom: 1px solid #ccc;*/
  padding: 5px 10px;
}
.highlight {
  background-color: #e0ffff;
}
.w3-hoverable tbody tr:hover {
  background-color: #e0ffff
}
</style>
</head>
<body class="w3-margin w3-small">
<h5>${ticker} - ${strategy}</h5>
<div style="overflow-x:auto;">`
  let thTemplate = '<th class="rotate" onclick="sortTable(#INDEX#)"><div><span title="#VAL#">#VAL#</span></div></th>'
  let tdTemplate = '<td>#VAL#</td>'
  html += '<table  id="resultTable" class="w3-table w3-striped w3-bordered w3-hoverable w3-card-4">\n'
  for (i = 0; i < testResults.length; i++) {
    if (i === 0) {
      html += "<thead>"
    }
    html += "<tr>"
    html += testResults[i].map((val, index) => i === 0 ? thTemplate.replace('#INDEX#', index).replaceAll('#VAL#', val) : tdTemplate.replace('#VAL#', val)).join('')
    html += "</tr>\n"
    if (i === 0) {
      html += "</thead>\n<tbody>"
    }
  }
  html += "<tbody></table></div>\n"


  html += `
  <script>
    const cells = document.querySelectorAll('td,th');
    for (let cell of cells) {
      cell.addEventListener('mouseover', function () {
        const columnCells = document.querySelectorAll(\`td:nth-child(\${cell.cellIndex + 1}),th:nth-child(\${cell.cellIndex + 1})\`);
        for (let c of columnCells) {
          if (c.tagName === "TH") {
            c.querySelector("span").classList.add('highlight', 'w3-round-xxlarge')
          } else {
            c.classList.add('highlight');
          }
        }
      });
      cell.addEventListener('mouseout', function () {
        const columnCells = document.querySelectorAll(\`td:nth-child(\${cell.cellIndex + 1}),th:nth-child(\${cell.cellIndex + 1})\`);
        for (let c of columnCells) {
          if (c.tagName === "TH") {
            c.querySelector("span").classList.remove('highlight', 'w3-round-xxlarge')
          } else {
            c.classList.remove('highlight');
          }
        }
      });
    }
    function sortTable(n) {
      var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
      table = document.getElementById("resultTable");
      switching = true;
      //Set the sorting direction to ascending:
      dir = "asc";
      /*Make a loop that will continue until
      no switching has been done:*/
      while (switching) {
        //start by saying: no switching is done:
        switching = false;
        rows = table.rows;
        /*Loop through all table rows (except the
        first, which contains table headers):*/
        for (i = 1; i < (rows.length - 1); i++) {
          //start by saying there should be no switching:
          shouldSwitch = false;
          /*Get the two elements you want to compare,
          one from current row and one from the next:*/
          x = rows[i].getElementsByTagName("TD")[n];
          y = rows[i + 1].getElementsByTagName("TD")[n];
          /*check if the two rows should switch place,
          based on the direction, asc or desc:*/
          if (dir == "asc") {
            if (isNumeric(x.innerHTML) && isNumeric(y.innerHTML)) {
              if (parseFloat(x.innerHTML) > parseFloat(y.innerHTML)) {
                //if so, mark as a switch and break the loop:
                shouldSwitch = true;
                break;
              }
            } else if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
              //if so, mark as a switch and break the loop:
              shouldSwitch = true;
              break;
            }
          } else if (dir == "desc") {
            if (isNumeric(x.innerHTML) && isNumeric(y.innerHTML)) {
              if (parseFloat(x.innerHTML) < parseFloat(y.innerHTML)) {
                //if so, mark as a switch and break the loop:
                shouldSwitch = true;
                break;
              }
            } else if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
              //if so, mark as a switch and break the loop:
              shouldSwitch = true;
              break;
            }
          }
        }
        if (shouldSwitch) {
          /*If a switch has been marked, make the switch
          and mark that a switch has been done:*/
          rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
          switching = true;
          //Each time a switch is done, increase this count by 1:
          switchcount++;
        } else {
          /*If no switching has been done AND the direction is "asc",
          set the direction to "desc" and run the while loop again.*/
          if (switchcount == 0 && dir == "asc") {
            dir = "desc";
            switching = true;
          }
        }
      }
    }

    function isNumeric(str) {
      if (typeof str != "string") return false
      return !isNaN(str) && !isNaN(parseFloat(str))
    }
  </script>`
  html += "</body></html>"
  return html
}