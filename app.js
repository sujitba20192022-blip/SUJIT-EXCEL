// ===============================
// HISAB KITAB - Spreadsheet App
// ===============================

const ROWS = 30;
const DEFAULT_COLUMNS = 10;

let currentSheet = 0;
let selectedCell = null;
let sheets = [];

// --------------------------------
// Column names: A, B, C ... Z, AA
// --------------------------------
function columnName(index) {
    let name = "";

    while (index >= 0) {
        name = String.fromCharCode((index % 26) + 65) + name;
        index = Math.floor(index / 26) - 1;
    }

    return name;
}

// --------------------------------
// Create blank sheet
// --------------------------------
function createBlankSheet(name) {
    const data = [];

    for (let r = 0; r < ROWS; r++) {
        const row = [];

        for (let c = 0; c < DEFAULT_COLUMNS; c++) {
            row.push("");
        }

        data.push(row);
    }

    return {
        name: name,
        data: data,
        columns: DEFAULT_COLUMNS
    };
}

// --------------------------------
// Start App
// --------------------------------
function initializeApp() {

    const saved = localStorage.getItem("hisabKitabData");

    if (saved) {
        try {
            sheets = JSON.parse(saved);
        } catch (error) {
            sheets = [
                createBlankSheet("Sheet 1"),
                createBlankSheet("Sheet 2"),
                createBlankSheet("Sheet 3")
            ];
        }
    } else {
        sheets = [
            createBlankSheet("Sheet 1"),
            createBlankSheet("Sheet 2"),
            createBlankSheet("Sheet 3")
        ];
    }

    renderSheets();
    renderSpreadsheet();
}

// --------------------------------
// Render Spreadsheet
// --------------------------------
function renderSpreadsheet() {

    const sheet = sheets[currentSheet];

    const headerRow = document.getElementById("headerRow");
    const tableBody = document.getElementById("tableBody");

    headerRow.innerHTML = "";
    tableBody.innerHTML = "";

    // Empty top-left corner
    const corner = document.createElement("th");
    corner.textContent = "#";
    headerRow.appendChild(corner);

    // Column Headers
    for (let c = 0; c < sheet.columns; c++) {

        const th = document.createElement("th");

        th.textContent = columnName(c);

        th.title = "Column " + columnName(c);

        headerRow.appendChild(th);
    }

    // Rows
    for (let r = 0; r < sheet.data.length; r++) {

        const tr = document.createElement("tr");

        // Row Number
        const rowNumber = document.createElement("td");

        rowNumber.className = "row-number";

        rowNumber.textContent = r + 1;

        tr.appendChild(rowNumber);

        // Cells
        for (let c = 0; c < sheet.columns; c++) {

            const td = document.createElement("td");

            td.contentEditable = true;

            td.dataset.row = r;
            td.dataset.col = c;

            td.textContent = sheet.data[r][c] || "";

            td.addEventListener("focus", cellSelected);

            td.addEventListener("input", cellChanged);

            td.addEventListener("keydown", cellKeyDown);

            tr.appendChild(td);
        }

        tableBody.appendChild(tr);
    }
}

// --------------------------------
// Cell Selected
// --------------------------------
function cellSelected(event) {

    const cell = event.target;

    selectedCell = cell;

    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);

    const name = columnName(col) + (row + 1);

    document.getElementById("cellName").textContent = name;

    document.getElementById("formulaBar").value =
        sheets[currentSheet].data[row][col] || "";
}

// --------------------------------
// Cell Changed
// --------------------------------
function cellChanged(event) {

    const cell = event.target;

    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);

    sheets[currentSheet].data[row][col] = cell.textContent;

    recalculateSheet();

    saveToLocalStorage();
}

// --------------------------------
// Formula Bar Changed
// --------------------------------
function formulaChanged() {

    if (!selectedCell) return;

    const value = document.getElementById("formulaBar").value;

    const row = Number(selectedCell.dataset.row);
    const col = Number(selectedCell.dataset.col);

    sheets[currentSheet].data[row][col] = value;

    selectedCell.textContent = value;

    recalculateSheet();

    saveToLocalStorage();
}

// --------------------------------
// Keyboard Navigation
// --------------------------------
function cellKeyDown(event) {

    if (event.key === "Enter") {

        event.preventDefault();

        const row = Number(event.target.dataset.row);
        const col = Number(event.target.dataset.col);

        const nextRow = row + 1;

        if (nextRow < sheets[currentSheet].data.length) {

            const nextCell =
                document.querySelector(
                    `td[data-row="${nextRow}"][data-col="${col}"]`
                );

            if (nextCell) {
                nextCell.focus();
            }
        }
    }
}

// --------------------------------
// Formula Engine
// --------------------------------
function calculateFormula(formula) {

    if (!formula || typeof formula !== "string") {
        return formula;
    }

    if (!formula.startsWith("=")) {
        return formula;
    }

    let expression = formula.substring(1).trim();

    // SUM
    expression = expression.replace(
        /SUM\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)/gi,
        function (_, startCol, startRow, endCol, endRow) {

            const values = getRangeValues(
                startCol,
                Number(startRow),
                endCol,
                Number(endRow)
            );

            return values.reduce((a, b) => a + b, 0);
        }
    );

    // AVERAGE
    expression = expression.replace(
        /AVERAGE\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)/gi,
        function (_, startCol, startRow, endCol, endRow) {

            const values = getRangeValues(
                startCol,
                Number(startRow),
                endCol,
                Number(endRow)
            );

            if (values.length === 0) return 0;

            return values.reduce((a, b) => a + b, 0) / values.length;
        }
    );

    // MIN
    expression = expression.replace(
        /MIN\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)/gi,
        function (_, startCol, startRow, endCol, endRow) {

            const values = getRangeValues(
                startCol,
                Number(startRow),
                endCol,
                Number(endRow)
            );

            return values.length ? Math.min(...values) : 0;
        }
    );

    // MAX
    expression = expression.replace(
        /MAX\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)/gi,
        function (_, startCol, startRow, endCol, endRow) {

            const values = getRangeValues(
                startCol,
                Number(startRow),
                endCol,
                Number(endRow)
            );

            return values.length ? Math.max(...values) : 0;
        }
    );

    // COUNT
    expression = expression.replace(
        /COUNT\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)/gi,
        function (_, startCol, startRow, endCol, endRow) {

            const values = getRangeValues(
                startCol,
                Number(startRow),
                endCol,
                Number(endRow)
            );

            return values.length;
        }
    );

    // Replace cell references
    expression = expression.replace(
        /\b([A-Z]+)(\d+)\b/gi,
        function (_, col, row) {

            return getCellNumber(col, Number(row));
        }
    );

    // Only allow mathematical characters
    if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
        return "#ERROR";
    }

    try {

        const result = Function(
            '"use strict"; return (' + expression + ')'
        )();

        if (!Number.isFinite(result)) {
            return "#ERROR";
        }

        return result;

    } catch (error) {

        return "#ERROR";
    }
}

// --------------------------------
// Get Cell Number
// --------------------------------
function getCellNumber(colName, rowNumber) {

    const col = columnIndex(colName);

    const row = rowNumber - 1;

    if (
        row < 0 ||
        row >= sheets[currentSheet].data.length ||
        col < 0 ||
        col >= sheets[currentSheet].columns
    ) {
        return 0;
    }

    const value = sheets[currentSheet].data[row][col];

    if (typeof value !== "string") {
        return Number(value) || 0;
    }

    if (value.startsWith("=")) {

        const result = calculateFormula(value);

        return Number(result) || 0;
    }

    const number = Number(value);

    return Number.isFinite(number) ? number : 0;
}

// --------------------------------
// Column letter to index
// --------------------------------
function columnIndex(name) {

    name = name.toUpperCase();

    let result = 0;

    for (let i = 0; i < name.length; i++) {

        result =
            result * 26 +
            (name.charCodeAt(i) - 64);
    }

    return result - 1;
}

// --------------------------------
// Get Range Values
// --------------------------------
function getRangeValues(
    startCol,
    startRow,
    endCol,
    endRow
) {

    const values = [];

    const startC = columnIndex(startCol);
    const endC = columnIndex(endCol);

    for (let r = startRow; r <= endRow; r++) {

        for (let c = startC; c <= endC; c++) {

            const value =
                getCellNumber(
                    columnName(c),
                    r
                );

            if (Number.isFinite(value)) {
                values.push(value);
            }
        }
    }

    return values;
}

// --------------------------------
// Recalculate Sheet
// --------------------------------
function recalculateSheet() {

    const sheet = sheets[currentSheet];

    const cells =
        document.querySelectorAll("#tableBody td");

    cells.forEach(cell => {

        const row = Number(cell.dataset.row);
        const col = Number(cell.dataset.col);

        const original =
            sheet.data[row][col];

        if (
            typeof original === "string" &&
            original.startsWith("=")
        ) {

            const result =
                calculateFormula(original);

            cell.textContent = result;
        }
    });
}

// --------------------------------
// Add Row
// --------------------------------
function addRow() {

    const sheet = sheets[currentSheet];

    const newRow = [];

    for (let c = 0; c < sheet.columns; c++) {
        newRow.push("");
    }

    sheet.data.push(newRow);

    renderSpreadsheet();

    saveToLocalStorage();

    showMessage("New row added");
}

// --------------------------------
// Delete Row
// --------------------------------
function deleteRow() {

    const sheet = sheets[currentSheet];

    if (sheet.data.length <= 1) {
        showMessage("कम से कम 1 row रहना चाहिए");
        return;
    }

    sheet.data.pop();

    renderSpreadsheet();

    saveToLocalStorage();

    showMessage("Last row deleted");
}

// --------------------------------
// Add Column
// --------------------------------
function addColumn() {

    const sheet = sheets[currentSheet];

    for (let r = 0; r < sheet.data.length; r++) {
        sheet.data[r].push("");
    }

    sheet.columns++;

    renderSpreadsheet();

    saveToLocalStorage();

    showMessage("New column added");
}

// --------------------------------
// Delete Column
// --------------------------------
function deleteColumn() {

    const sheet = sheets[currentSheet];

    if (sheet.columns <= 1) {
        showMessage("कम से कम 1 column रहना चाहिए");
        return;
    }

    for (let r = 0; r < sheet.data.length; r++) {
        sheet.data[r].pop();
    }

    sheet.columns--;

    renderSpreadsheet();

    saveToLocalStorage();

    showMessage("Last column deleted");
}

// --------------------------------
// New Spreadsheet
// --------------------------------
function newSheet() {

    const name =
        prompt("नए हिसाब का नाम लिखें:");

    if (!name) return;

    sheets.push(createBlankSheet(name));

    currentSheet = sheets.length - 1;

    renderSheets();

    renderSpreadsheet();

    saveToLocalStorage();

    showMessage("New हिसाब बनाया गया");
}

// --------------------------------
// Add Sheet
// --------------------------------
function addSheet() {

    const name =
        prompt("Sheet का नाम लिखें:");

    if (!name) return;

    sheets.push(createBlankSheet(name));

    currentSheet = sheets.length - 1;

    renderSheets();

    renderSpreadsheet();

    saveToLocalStorage();
}

// --------------------------------
// Render Sheet Tabs
// --------------------------------
function renderSheets() {

    const container =
        document.getElementById("sheetTabs");

    container.innerHTML = "";

    sheets.forEach((sheet, index) => {

        const tab =
            document.createElement("button");

        tab.className =
            "sheet-tab" +
            (index === currentSheet ? " active" : "");

        tab.textContent = sheet.name;

        tab.onclick = function () {

            currentSheet = index;

            renderSheets();
            renderSpreadsheet();

        };

        container.appendChild(tab);
    });
}

// --------------------------------
// Save
// --------------------------------
function saveData() {

    saveToLocalStorage();

    showMessage("💾 हिसाब Save हो गया");
}

// --------------------------------
// Local Storage
// --------------------------------
function saveToLocalStorage() {

    localStorage.setItem(
        "hisabKitabData",
        JSON.stringify(sheets)
    );
}

// --------------------------------
// Message
// --------------------------------
function showMessage(text) {

    const message =
        document.getElementById("message");

    message.textContent = text;

    message.style.display = "block";

    setTimeout(() => {

        message.style.display = "none";

    }, 1800);
}

// --------------------------------
// Start
// --------------------------------
document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);
