var express = require('express')
var router = express.Router()

const FAVICON_URL = "https://cdn.glitch.com/0e6dc89f-4128-4c89-b997-8fa6f2d9cc71%2Femoti-con_logo_square.png?v=1586189918610";

const { GoogleSpreadsheet } = require('google-spreadsheet');
const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID);

const getSpreadsheetData = require("../helpers/spreadsheet");

const templateData = {
  favicon: FAVICON_URL,
  reactions: ["📢", "🌍", "🦄"]
}

router.get("/", async function(req, res) {
  const sheetData = await getSpreadsheetData(doc);
  if (sheetData && sheetData.rows) {
    const renderData = Object.assign({}, templateData, sheetData);

    res.render("index", renderData);
  } else {
    res.send("error");
  }
});

router.get("/:projectId", async function(req, res) {
  const projectSheetIndex = 0;
  //const projectResponsesSheetIndex = 1;
  const rowIndex = parseInt(req.params.projectId) - 2;
  
  try {
    // Get data for specified project
    const projectSheetData = await getSpreadsheetData(doc, projectSheetIndex, rowIndex, 1);

    if (!projectSheetData || !projectSheetData.rows) {
      throw "Unable to access project." 
    }
    
    /*
    // Get judging data for specified project
    const projectResponsesSheetData = await getSpreadsheetData(doc, projectResponsesSheetIndex);
    
    projectResponsesSheetData.rows = projectResponsesSheetData.rows.map((i, index) => {
      const projectId = i["What is the project id of the project you are judging?"];
      
      if (projectId === req.params.projectId) {
        const judge = i["Are you an Emoti-Con judge?"] === "Yes";
        const projectData = {
          feedbackId: i.rowId,
          projectId: projectId,
          judge: judge
        }
        
        if (judge) {
          projectData.feedback = i["Public Narrative Feedback"];
          projectData.author = i["What is your name?"];
        } else {
          projectData.feedback = i["What positive feedback do you have for the creators of this project?"];
          projectData.author = i["What is your first name?"] + ", " + i["What city do you live in?"];
        }
        
        return projectData;
      }
    });
    */
    
    const combinedData = {
      docTitle: projectSheetData.docTitle,
      projectData: projectSheetData.rows[0],
      //responsesData: projectResponsesSheetData
    }
    
    const renderData = Object.assign({}, templateData, combinedData);

    res.render("project", renderData);
    
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

module.exports = router