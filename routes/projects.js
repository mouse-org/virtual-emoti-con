var express = require('express')
var router = express.Router()

const FAVICON_URL = "https://cdn.glitch.com/0e6dc89f-4128-4c89-b997-8fa6f2d9cc71%2Femoti-con_logo_square.png?v=1586189918610";

const { GoogleSpreadsheet } = require('google-spreadsheet');

let getSpreadsheetData;
let doc;
if (process.env.SPREADSHEET_ID){
  doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID);

  getSpreadsheetData = require("../helpers/spreadsheet");
} else {
  doc = null;
  getSpreadsheetData = () => ({});
}

const reactions = require("../helpers/reactions");

const templateData = {
  favicon: FAVICON_URL,
  reactions: reactions
}

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
const ProjectData = require("../models/ProjectData");

const errorText = "Sorry, you discovered an error! Email help@mouse.org if you continue seeing this error.";

router.get("/", async function(req, res) {
  // Redirect to root url because that is where projects index is.
  res.redirect("/");
});

router.get("/random", async function(req, res) {
  if (process.env.NUMBER_OF_ROWS) {
    const randomIndex = 2 + Math.floor(Math.random() * Math.floor(process.env.NUMBER_OF_ROWS - 1));
    res.redirect("/projects/" + randomIndex + "?random=true");
  } else {
    const sheetData = await getSpreadsheetData(doc);
    if (sheetData && sheetData.rows) {
      const numberOfProjects = sheetData.rows.length;
      const randomIndex = 2 + Math.floor(Math.random() * Math.floor(numberOfProjects));
      if (randomIndex === 9 || randomIndex === 10) {
        randomIndex += Math.floor(Math.random() * Math.floor(40));
      }
      res.redirect("/projects/" + randomIndex + "?random=true");
    } else {
      res.redirect("/404");
    }
  }  
})

router.get("/sheet-version/:projectId", async function(req, res) {
  const projectSheetIndex = 0;
  const responsesSheetIndex = 1;
  const rowIndex = parseInt(req.params.projectId) - 2;
  

  if (Number.isNaN(parseInt(req.params.projectId)) || parseInt(req.params.projectId) < 2) {
    res.redirect("/404");
    return;
  }

  
  // Get data for specified project 
  try {
    var projectSheetData = await getSpreadsheetData(doc, projectSheetIndex, rowIndex, 1);

    if (!projectSheetData || !projectSheetData.rows || !projectSheetData.rows[0]) {

      throw "Unable to access project.";
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
      return (
        i["Reviewed"]
        && i["Reviewed"].toUpperCase() === "YES"
        && i["Judge Response"].toUpperCase() === "YES"
      );
    });

    responsesSheetData.publicResponses = responsesSheetData.rows.filter(i => {
      return (
        i["Reviewed"]
        && i["Reviewed"].toUpperCase() === "YES"
        && i["Judge Response"].toUpperCase() === "NO"
      );
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
      singleProject: true,
      projectData: projectSheetData.rows[0],
      responsesData: responsesSheetData
    }

    if (req.query.api === "true") {
      res.json(combinedData);
      return
    }
    
    const renderData = Object.assign({}, templateData, combinedData);

    res.render("project", renderData);
  } catch (error) {
    console.log("Error:")
    console.log(error);
    res.render("error", {error: errorText});

  }


  
})

router.get("/:projectId", async function(req, res) {
  const projectSheetIndex = 0;
  const responsesSheetIndex = 1;
  const rowIndex = parseInt(req.params.projectId) - 2;

  if (Number.isNaN(parseInt(req.params.projectId)) || parseInt(req.params.projectId) < 2) {
    res.redirect("/404");
    return;
  }
  
  /*
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
  */

  try {
    var projectData = await ProjectData.findOne({rowId: req.params.projectId}).exec();

    var parsedProjectData = {};
    
    const allowListValues = [
      "rowId", "Reviewed", "ProjectId", "alien", "rocket",
      "globe", "rainbow", "lightbulb", "Primary Image", "Timestamp",
      "Project Name", "Project Description", "Student Names", "Age Range",
      "Project Category", "Organization or Program Affiliation", "Images",
      "Video", "Slides", "Links", "Audio", "More About Our Project",
      "Student Count", "Schools", "Award Name"
    ]

    allowListValues.forEach(i => {
      if (projectData && projectData[i]) {
        try {
          parsedProjectData[i] = JSON.parse(projectData[i]);
        } catch (error) {
          parsedProjectData[i] = projectData[i];
        }
        
      } else {
        parsedProjectData[i] = '';
      }
    });


  } catch (error) {
    console.log("Error:")
    console.log(error);
    res.render("error", {error: errorText});
  }

  // Get responses data:
  try {
    var responsesSheetData = await getSpreadsheetData(doc, responsesSheetIndex);
    
    if (!responsesSheetData || !responsesSheetData.rows) {
      throw `Invalid responses response from spreadsheet`;
    }
    responsesSheetData.rows = responsesSheetData.rows.filter(i => {
      return i["Project ID:"] === req.params.projectId;
    });

    responsesSheetData.judgeResponses = responsesSheetData.rows.filter(i => {
      return (
        i["Reviewed"]
        && i["Reviewed"].toUpperCase() === "YES"
        && i["Judge Response"].toUpperCase() === "YES"
      );
    });

    responsesSheetData.publicResponses = responsesSheetData.rows.filter(i => {
      return (
        i["Reviewed"]
        && i["Reviewed"].toUpperCase() === "YES"
        && i["Judge Response"].toUpperCase() === "NO"
      );
    });

  } catch (error) {
    console.log("Responses Sheet Error:");
    console.log(error);
    responsesSheetData = {}
  }

  // Combine data and render page:
  try {
    // Do not render page if no projectSheetData
    if (
        //!projectSheetData &&
        !parsedProjectData
      ) {
      throw "** No data for project" + req.params.projectId;
    }

    // Render page without responses if no responsesSheetData
    if (!responsesSheetData) {
      responsesSheetData = {}
    }

    const combinedData = {
      docTitle: responsesSheetData.docTitle,
      singleProject: true,
      projectData: parsedProjectData,
      //projectData: projectSheetData.rows[0],
      responsesData: responsesSheetData
    }

    if (req.query.api === "true") {
      res.json(combinedData);
      return
    }
    
    const renderData = Object.assign({}, templateData, combinedData);

    res.render("project", renderData);
  } catch (error) {
    console.log("Error:")
    console.log(error);
    res.render("error", {error: errorText});
  }

});

module.exports = router