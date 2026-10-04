// ==========================================
// SUJIT HISAB KITAB
// ==========================================

const ROWS = 50;
const DEFAULT_COLUMNS = 6;

let currentSheet = 0;
let selectedCell = null;
let sheets = [];

// ------------------------------------------
// Column Name
// ------------------------------------------
function columnName(index) {
    let name = "";

    while (index >= 0) {
        name =
            String.fromCharCode((index % 26) + 65) + name;
        index = Math.floor(index / 26) - 1;
    }

    return name;
}

// ------------------------------------------
// Create New Hisab
// ------------------------------------------
function createBlankSheet(name) {

    const data = [];

    // Header row
    data.push([
        "तारीख",
        "नाम",
        "विवरण",
        "जमा",
        "खर्च",
        "बाकी"
    ]);

    for (let r = 1; r < ROWS; r++) {

        data.push([
            "",
            "",
            "",
            "",
            "",
            ""
        ]);
    }

    return {
        name: name,
        data: data,
        columns: DEFAULT_COLUMNS
    };
}

// ------------------------------------------
// Initialize
// ------------------------------------------
function initializeApp() {

    const saved =
        localStorage.getItem("hisabKitabData");

    if (saved) {

        try {

            sheets = JSON.parse(saved);

        } catch (error) {

            sheets = [
                createBlankSheet("मुख्य हिसाब")
            ];
        }

    } else {

        sheets = [
            createBlankSheet("मुख्य हिसाब")
        ];
    }

    renderSheets();
    renderSpreadsheet();
    updateSummary();
}

// ------------------------------------------
// Render Spreadsheet
// ------------------------------------------
function renderSpreadsheet() {

    const sheet = sheets[currentSheet];

    const headerRow =
        document.getElementById("headerRow");

    const tableBody =
        document.getElementById("tableBody");

    headerRow.innerHTML = "";
    tableBody.innerHTML = "";

    // Corner
    const corner = document.createElement("th");

    corner.textContent = "#";

    headerRow.appendChild(corner);

    // Column Headers
    for (let c = 0; c < sheet.columns; c++) {

        const th =
            document.createElement("th");

        th.textContent =
            sheet.data[0][c] ||
            columnName(c);

        headerRow.appendChild(th);
    }

    // Rows
    for (let r = 1; r < sheet.data.length; r++) {

        const tr =
            document.createElement("tr");

        const rowNumber =
            document.createElement("td");

        rowNumber.className = "row-number";

        rowNumber.textContent = r;

        tr.appendChild(rowNumber);

        for (let c = 0; c < sheet.columns; c++) {

            const td =
                document.createElement("td");

            td.contentEditable = true;

            td.dataset.row = r;
            td.dataset.col = c;

            td.textContent =
                sheet.data[r][c] || "";

            td.addEventListener(
                "focus",
                cellSelected
            );

            td.addEventListener(
                "input",
                cellChanged
            );

            td.addEventListener(
                "keydown",
                cellKeyDown
            );

            tr.appendChild(td);
        }

        tableBody.appendChild(tr);
    }

    updateSummary();
}

// ------------------------------------------
// Cell Selected
// ------------------------------------------
function cellSelected(event) {

    selectedCell = event.target;

    const row =
        Number(selectedCell.dataset.row);

    const col =
        Number(selectedCell.dataset.col);

    document.getElementById("cellName").textContent =
        columnName(col) + row;

    document.getElementById("formulaBar").value =
        sheets[currentSheet].data[row][col] || "";
}

// ------------------------------------------
// Cell Changed
// ------------------------------------------
function cellChanged(event) {

    const cell = event.target;

    const row =
        Number(cell.dataset.row);

    const col =
        Number(cell.dataset.col);

    sheets[currentSheet].data[row][col] =
        cell.textContent.trim();

    calculateBalances();

    saveToLocalStorage();

    updateSummary();
}

// ------------------------------------------
// Formula Bar
// ------------------------------------------
function formulaChanged() {

    if (!selectedCell) return;

    const value =
        document.getElementById("formulaBar").value;

    const row =
        Number(selectedCell.dataset.row);

    const col =
        Number(selectedCell.dataset.col);

    sheets[currentSheet].data[row][col] =
        value;

    selectedCell.textContent =
        value;

    calculateBalances();

    saveToLocalStorage();

    updateSummary();
}

// ------------------------------------------
// Keyboard
// ------------------------------------------
function cellKeyDown(event) {

    if (event.key === "Enter") {

        event.preventDefault();

        const row =
            Number(event.target.dataset.row);

        const col =
            Number(event.target.dataset.col);

        const nextRow = row + 1;

        const nextCell =
            document.querySelector(
                `td[data-row="${nextRow}"][data-col="${col}"]`
            );

        if (nextCell) {
            nextCell.focus();
        }
    }
}

// ------------------------------------------
// Calculate Balance
// ------------------------------------------
function calculateBalances() {

    const sheet = sheets[currentSheet];

    let balance = 0;

    for (let r = 1; r < sheet.data.length; r++) {

        const jama =
            parseFloat(sheet.data[r][3]) || 0;

        const kharch =
            parseFloat(sheet.data[r][4]) || 0;

        balance =
            balance + jama - kharch;

        sheet.data[r][5] =
            balance === 0
                ? ""
                : balance.toFixed(2);
    }

    renderBalanceCells();
}

// ------------------------------------------
// Update Balance Cells
// ------------------------------------------
function renderBalanceCells() {

    const cells =
        document.querySelectorAll(
            '#tableBody td[data-col="5"]'
        );

    cells.forEach(cell => {

        const row =
            Number(cell.dataset.row);

        cell.textContent =
            sheets[currentSheet].data[row][5] || "";
    });
}

// ------------------------------------------
// Summary
// ------------------------------------------
function updateSummary() {

    const sheet = sheets[currentSheet];

    let totalJama = 0;
    let totalKharch = 0;

    for (let r = 1; r < sheet.data.length; r++) {

        totalJama +=
            parseFloat(sheet.data[r][3]) || 0;

        totalKharch +=
            parseFloat(sheet.data[r][4]) || 0;
    }

    const balance =
        totalJama - totalKharch;

    let summary =
        document.getElementById("hisabSummary");

    if (!summary) {

        summary =
            document.createElement("div");

        summary.id =
            "hisabSummary";

        document.body.insertBefore(
            summary,
            document.getElementById("table-container") ||
            document.querySelector(".table-container")
        );
    }

    summary.innerHTML = `
        <div>
            <strong>💰 कुल जमा</strong>
            <span>₹${totalJama.toFixed(2)}</span>
        </div>

        <div>
            <strong>💸 कुल खर्च</strong>
            <span>₹${totalKharch.toFixed(2)}</span>
        </div>

        <div>
            <strong>💵 बाकी</strong>
            <span>₹${balance.toFixed(2)}</span>
        </div>
    `;
}

// ------------------------------------------
// Add Row
// ------------------------------------------
function addRow() {

    const sheet = sheets[currentSheet];

    const newRow = [];

    for (let c = 0; c < sheet.columns; c++) {
        newRow.push("");
    }

    sheet.data.push(newRow);

    renderSpreadsheet();

    saveToLocalStorage();

    showMessage("नई Row जोड़ दी गई");
}

// ------------------------------------------
// Delete Row
// ------------------------------------------
function deleteRow() {

    const sheet = sheets[currentSheet];

    if (sheet.data.length <= 2) {

        showMessage("कम से कम 1 हिसाब रखें");

        return;
    }

    sheet.data.pop();

    calculateBalances();

    renderSpreadsheet();

    saveToLocalStorage();

    showMessage("Last Row हटाई गई");
}

// ------------------------------------------
// Add Column
// ------------------------------------------
function addColumn() {

    const sheet = sheets[currentSheet];

    for (let r = 0; r < sheet.data.length; r++) {

        sheet.data[r].push("");
    }

    sheet.columns++;

    renderSpreadsheet();

    saveToLocalStorage();

    showMessage("नया Column जोड़ा गया");
}

// ------------------------------------------
// Delete Column
// ------------------------------------------
function deleteColumn() {

    const sheet = sheets[currentSheet];

    if (sheet.columns <= 1) {

        showMessage(
            "कम से कम 1 Column रहना चाहिए"
        );

        return;
    }

    for (let r = 0; r < sheet.data.length; r++) {

        sheet.data[r].pop();
    }

    sheet.columns--;

    renderSpreadsheet();

    saveToLocalStorage();

    showMessage("Last Column हटाया गया");
}

// ------------------------------------------
// New Sheet
// ------------------------------------------
function newSheet() {

    const name =
        prompt("नए हिसाब का नाम लिखें:");

    if (!name) return;

    sheets.push(
        createBlankSheet(name)
    );

    currentSheet =
        sheets.length - 1;

    renderSheets();
    renderSpreadsheet();

    saveToLocalStorage();

    showMessage(
        "नया हिसाब बनाया गया"
    );
}

// ------------------------------------------
// Add Sheet
// ------------------------------------------
function addSheet() {

    const name =
        prompt("Sheet का नाम लिखें:");

    if (!name) return;

    sheets.push(
        createBlankSheet(name)
    );

    currentSheet =
        sheets.length - 1;

    renderSheets();
    renderSpreadsheet();

    saveToLocalStorage();

    showMessage(
        "नई Sheet बनाई गई"
    );
}

// ------------------------------------------
// Sheet Tabs
// ------------------------------------------
function renderSheets() {

    const container =
        document.getElementById("sheetTabs");

    container.innerHTML = "";

    sheets.forEach(
        (sheet, index) => {

            const tab =
                document.createElement("button");

            tab.className =
                "sheet-tab" +
                (
                    index === currentSheet
                        ? " active"
                        : ""
                );

            tab.textContent =
                sheet.name;

            tab.onclick = function () {

                currentSheet = index;

                renderSheets();
                renderSpreadsheet();

            };

            container.appendChild(tab);
        }
    );
}

// ------------------------------------------
// Save
// ------------------------------------------
function saveData() {

    calculateBalances();

    saveToLocalStorage();

    showMessage(
        "💾 हिसाब सुरक्षित हो गया"
    );
}

// ------------------------------------------
// Local Storage
// ------------------------------------------
function saveToLocalStorage() {

    localStorage.setItem(
        "hisabKitabData",
        JSON.stringify(sheets)
    );
}

// ------------------------------------------
// Message
// ------------------------------------------
function showMessage(text) {

    const message =
        document.getElementById("message");

    message.textContent = text;

    message.style.display = "block";

    setTimeout(
        () => {
            message.style.display = "none";
        },
        1800
    );
}

// ------------------------------------------
// Start
// ------------------------------------------
document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);
