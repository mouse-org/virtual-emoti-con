var express = require("express");
var router = express.Router();

const { GoogleSpreadsheet } = require("google-spreadsheet");
const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID);

const getSpreadsheetData = require("../helpers/spreadsheet");

// I will use the UUID package for s3 file names
const { v4: uuidv4 } = require("uuid");

// The AWS functionality is isolated for clarity:
const aws = require("../helpers/aws.js");

// Multer processes the file in the request body
// This allows one file to be uploaded at a time.
var multer = require("multer");

// Axios is used to get the images from google drive
var axios = require("axios");

const {PassThrough} = require('stream')

var memoryStorage = multer.memoryStorage();
var memoryUpload = multer({
  storage: memoryStorage,
  limits: {
    //fileSize: 4*1024, // 4KB filesize limit
    fileSize: 100 * 1024 * 1024, // 100 Mb filesize limit
    files: 1
  }
}).single("file");

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

const ProjectData = require("../models/ProjectData");

router.get("/", function(req, res) {
  res.send("Sync");
});


router.get("/projects/data/:projectId", async function(req, res) {

  if (!req.query.p || req.query.p != process.env.SYNC_PASSWORD) {
    res.redirect("/404")
    return;
  }

  const projectSheetIndex = 0;
  const rowIndex = parseInt(req.params.projectId) - 2;

  // Get data for specified project
  try {
    var projectSheetData = await getSpreadsheetData(
      doc,
      projectSheetIndex,
      rowIndex,
      1
    );

    if (!projectSheetData || !projectSheetData.rows) {
      throw "Unable to access project.";
    }
  } catch (error) {
    console.log("Error:");
    console.log(error);

    //🛎 Error Handling
  }

  try {
    const projectData = projectSheetData.rows[0];

    const dbProjectData = {
      "rowId": parseInt(projectData["rowId"]),
      "Reviewed": JSON.stringify(projectData["Reviewed"]),
      "ProjectId": parseInt(projectData["ProjectId"]),
      "alien": Number.isNaN(parseInt(projectData["alien"])) ? 0 : parseInt(projectData["alien"]),
      "rocket": Number.isNaN(parseInt(projectData["rocket"])) ? 0 : parseInt(projectData["rocket"]),
      "globe": Number.isNaN(parseInt(projectData["globe"])) ? 0 : parseInt(projectData["globe"]),
      "rainbow": Number.isNaN(parseInt(projectData["rainbow"])) ? 0 : parseInt(projectData["rainbow"]),
      "lightbulb": Number.isNaN(parseInt(projectData["lightbulb"])) ? 0 : parseInt(projectData["lightbulb"]),
      "Primary Image": JSON.stringify(projectData["Primary Image"]),
      "Timestamp": JSON.stringify(projectData["Timestamp"]),
      //"I confirm that this project meets the three requirements above. ": JSON.stringify(JSON.stringify(projectData["I confirm that this project meets the three requirements above. "])),
      //"Adult Name (First & Last)": JSON.stringify(projectData["Adult Name (First & Last)"]),
      //"Adult Email Address": JSON.stringify(projectData["Adult Email Address"]),
      "School or Organization": JSON.stringify(projectData["School or Organization"]),
      //"Relationship to Student/s:": JSON.stringify(projectData["Relationship to Student/s:"]),
      //"(Optional) Are there other email addresses we should include in outreach about this project?  List here separated by commas. ": JSON.stringify(projectData["(Optional) Are there other email addresses we should include in outreach about this project?  List here separated by commas. "]),
      "Project Name": JSON.stringify(projectData["Project Name"]),
      "Project Description": JSON.stringify(projectData["Project Description"]),
      "Student Names": JSON.stringify(projectData["Student Names"]),
      "Age Range": JSON.stringify(projectData["Age Range"]),
      "Project Category": JSON.stringify(projectData["Project Category"]),
      "Organization or Program Affiliation": JSON.stringify(projectData["Organization or Program Affiliation"]),
      "Images": JSON.stringify(projectData["Images"]),
      "Video": JSON.stringify(projectData["Video"]),
      "Slides": JSON.stringify(projectData["Slides"]),
      "Links": JSON.stringify(projectData["Links"]),
      "Audio": JSON.stringify(projectData["Audio"]),
      "More About Our Project": JSON.stringify(projectData["More About Our Project"]),
      "Student Count": JSON.stringify(projectData["Student Count"]),
      "Schools": JSON.stringify(projectData["Schools"]),
      "Award Name": JSON.stringify(projectData["Award Name"])
    }

    const mongoSavedProjectData = new ProjectData(dbProjectData);
    let savedResponse = await mongoSavedProjectData.save();

    if (!savedResponse) {
      throw "Response not saved";
    }

    res.json(savedResponse);
  } catch (error) {
    res.send({error: error});
  }



})


router.get("/projects/images/:projectId", async function(req, res) {

  if (!req.query.p || req.query.p != process.env.SYNC_PASSWORD) {
    res.redirect("/404")
    return;
  }

  const projectSheetIndex = 0;
  const rowIndex = parseInt(req.params.projectId) - 2;
  
  const columns = ["Primary Image", "Images"]

  const updatedData = [];
  
  
  // Get data for specified project
  try {
    var projectSheetData = await getSpreadsheetData(
      doc,
      projectSheetIndex,
      rowIndex,
      1
    );

    if (!projectSheetData || !projectSheetData.rows) {
      throw "Unable to access project.";
    }
  } catch (error) {
    console.log("Error:");
    console.log(error);

    //🛎 Error Handling
  }

  for (let m in columns) {

    const column = columns[m];
    console.log("*** Syncing ", column);

    const awsImages = [];
    try {
      const projectData = projectSheetData.rows[0];
      const images = projectData[column];
      if (!images) {
        continue;
      }
      
      if (column === "Images" || column === "Primary Image") {
        if (!images.images || !images.urls) {
          throw "Invalid " + column;
        }
      }
      
      let syncData = images;
      console.log("####")
      console.log(images);
      if (images.images && images.images === true) {
        syncData = images.urls;
      }

      for (let i in syncData) {
        let imageUrl =
          "https://drive.google.com/uc?export=view&id=" + syncData[i];
        console.log("$$ Image URL:", imageUrl);
        let image = await axios({
            method: 'get',
            url: imageUrl,
            responseType: 'stream'
        });

        const contentType = image.headers['content-type'];
        const passThroughData = new PassThrough();
        const upload = {
          file: image.data.pipe(passThroughData),
          filetype: contentType,
          id: uuidv4()
        }

        // Upload happens in ./helpers/aws.js:
        const response = await aws.upload(upload);
        console.log(response);

        awsImages.push(response.url);

        if (!response.success || response.error) {
          throw "Reponse Error: " + response.error;
        }
      }

      // Return JSON:
      //res.status(200).send(awsImages.map(i => `<img src="${i}" /><br/>`).join(""));

    } catch (error) {
      console.log("Error:")
      console.log(error);
      updatedData.unshift({error: error});
    }

    const s3SheetIndex = 2;
    const editable = true;
    try {
      const sheetObject = await getSpreadsheetData(doc, s3SheetIndex, rowIndex, 1, editable);
      const row = sheetObject[0];

      const awsImageString = awsImages.join(", ");

      row[column] = awsImageString;

      await sheetObject[0].save();

      let dataobj = {};
      dataobj[column] = awsImages;
      updatedData.push(dataobj);

    } catch (err) {
      console.log("ERROR:", err)
      res.status(500).send({error: 'Error'})
      return;
    }
  }
  
  res.json(updatedData); 
});

module.exports = router;
