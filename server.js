var express = require('express');
var app = express();
app.use(express.static('public'));
const hbs = require("hbs");
app.set("view engine", "hbs");
app.set("views", "views");


const FAVICON_URL                 = "https://cdn.glitch.com/0e6dc89f-4128-4c89-b997-8fa6f2d9cc71%2Femoti-con_logo_square.png?v=1586189918610";

var templateData = {
  favicon: FAVICON_URL,
  reactions: ["📢", "🌍", "🦄"]
}

const { GoogleSpreadsheet } = require('google-spreadsheet');
const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID);

async function getSpreadsheetData(doc, sheetIndex = 0, offset = false, limit = false, editable = false) {
  
  try {
    // Authenticate with Google
    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY,
    });

    // Load doc, sheet and sheet headers
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[sheetIndex];
    await sheet.loadHeaderRow();
    
    // Set options for getRows()
    let options = {};
    if (offset !== false && limit !== false) {
      options.offset = offset;
      options.limit = limit;
    }

    // Get relevent rows
    const rows = await sheet.getRows(options);
    
    // Return GoogleSheets object for editable actions
    if (editable) {
      return rows;
    }
    
    // Construct sheeData object for read only
    let sheetData = {
      docTitle: doc.title,
      title: sheet.title
    }
    
    // Parse GoogleSheets object into flat JSON
    const headers = sheet.headerValues;
    sheetData.rows =  await parseSpreadsheetData(rows, headers);
    sheetData.rows = sheetData.rows.filter(i => i["Reviewed"] === "Yes" ? i : null)
    
    // Return flat JSON for read only
    return sheetData
    
  } catch (error) {
    console.log("Error:");
    console.log(error);
    return false;
  }
}

async function parseSpreadsheetData(rows, headers) {
  return rows.map(i => {
    let rowData = {
      projectId: i.rowNumber
    }
    headers.forEach(j => {
      rowData[j] = parseCell(i[j]);
    })
    return rowData;
  });
}

function parseCell(cell) {
  if (!cell) {
    return '';
  } else if (cell.substring(0, 30) === 'https://drive.google.com/open?') {
    return {
      image: true,
      url: cell.split('=')[1]
    }
  } else {
    return cell;
  }
}


app.get("/", function(req, res) {
  res.send("<a href='projects'>Projects</a>");
})


app.get("/projects", async function(req, res) {
  const sheetData = await getSpreadsheetData(doc);
  if (sheetData && sheetData.rows) {
    const renderData = Object.assign(templateData, sheetData);
    res.render("index", renderData);
  } else {
    res.send("error");
  }
});

app.get("/projects/:projectId", async function(req, res) {
  console.log("Project Id:", req.params.projectId);
  const sheetIndex = 0;
  const rowIndex = parseInt(req.params.projectId) - 2;
  
  try {
    const sheetData = await getSpreadsheetData(doc, sheetIndex, rowIndex, 1);

    if (sheetData && sheetData.rows) {
      
      const renderData = Object.assign(templateData, sheetData);
      res.render("index", renderData);
    } else {
      res.send("error");
    }
  } catch (error) {
    console.log("Error:")
    console.log(error);
    if (error === "This project has not been reviewed.") {
      res.render("error", {error: error});
    } else {
      res.render("error", {error: "Sorry, you discovered an error!"});
    }
    
  }
  
})


app.get("/api/:projectId/:reaction/plus-one", async function(req, res) {
  console.log("Project Id:", req.params.projectId, "Reaction:", req.params.reaction);
  const sheetIndex = 0;
  const rowIndex = parseInt(req.params.projectId) - 2;
  const editable = true;
  try {
    const sheetObject = await getSpreadsheetData(doc, sheetIndex, rowIndex, 1, editable);
    const row = sheetObject[0];

    let totalReactions = parseInt(row[req.params.reaction]);

    if (totalReactions) {
      row[req.params.reaction] = totalReactions + 1;
    } else {
      row[req.params.reaction] = 1;
    }
    await sheetObject[0].save();

    res.json({
      projectId: req.params.projectId,
      projectIndex: rowIndex,
      reaction: req.params.reaction,
      total: row[req.params.reaction]
    });
  } catch (error) {
    console.log("Error:")
    console.log(error);
    res.json({
      error: true
    })
  }
});

var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
