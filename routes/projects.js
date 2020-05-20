var express = require('express')
var router = express.Router()

const FAVICON_URL = "https://cdn.glitch.com/0e6dc89f-4128-4c89-b997-8fa6f2d9cc71%2Femoti-con_logo_square.png?v=1586189918610";

const { GoogleSpreadsheet } = require('google-spreadsheet');
const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID);

const getSpreadsheetData = require("../helpers/spreadsheet");

const reactions = require("../helpers/reactions");

const templateData = {
  favicon: FAVICON_URL,
  reactions: reactions
}

const errorText = "Sorry, you discovered an error! Email help@mouse.org if you continue seeing this error.";

router.get("/", async function(req, res) {
  const sheetData = await getSpreadsheetData(doc);
  if (sheetData && sheetData.rows) {
    const renderData = Object.assign({}, templateData, sheetData);

    res.render("projectsIndex", renderData);
  } else {
    res.send("error");
  }
});

router.get("/:projectId", async function(req, res) {
  const projectSheetIndex = 0;
  const responsesSheetIndex = 1;
  const rowIndex = parseInt(req.params.projectId) - 2;
  
  // Get data for specified project 
  try {
    var projectSheetData = await getSpreadsheetData(doc, projectSheetIndex, rowIndex, 1);

    if (!projectSheetData || !projectSheetData.rows) {
      throw "Unable to access project." 
    }
    
  } catch (error) {
    console.log("Error:")
    console.log(error);
    if (error === "This project has not been reviewed.") {
      res.render("error", {error: error});
    } else {
      res.render("error", {error: errorText});
    }
  }

  // Get responses data:
  try {
    var responsesSheetData = await getSpreadsheetData(doc, responsesSheetIndex);
    
    responsesSheetData.rows = responsesSheetData.rows.filter(i => {
      return i["Project ID:"] === req.params.projectId;
    });

    responsesSheetData.judgeResponses = responsesSheetData.rows.filter(i => {
      return (i["Reviewed"].toUpperCase() === "YES" && i["Judge Response"].toUpperCase() === "YES");
    });

    responsesSheetData.publicResponses = responsesSheetData.rows.filter(i => {
      return (i["Reviewed"].toUpperCase() === "YES" && i["Judge Response"].toUpperCase() === "NO");
    });

  } catch (error) {
    console.log("Responses Sheet Error:");
    console.log(error);
    responsesSheetData = {}
  }

  // Combine data and render page:
  try {
    // Do not render page if no projectSheetData
    if (!projectSheetData) {
      throw "No data for project " + req.params.projectId;
    }

    // Render page without responses if no responsesSheetData
    if (!responsesSheetData) {
      responsesSheetData = {}
    }

    const combinedData = {
      docTitle: projectSheetData.docTitle,
      projectData: projectSheetData.rows[0],
      responsesData: responsesSheetData
    }
    
    const renderData = Object.assign({}, templateData, combinedData);

    res.render("project", renderData);
  } catch (error) {
    console.log("Error:")
    console.log(error);
    res.render("error", {error: errorText});

  }


  
})

module.exports = router