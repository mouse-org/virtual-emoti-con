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

router.get("/", function(req, res) {
  res.send("Sync");
});

router.get("/projects/:projectId", async function(req, res) {
  const projectSheetIndex = 0;
  const rowIndex = parseInt(req.params.projectId) - 2;
  
  const columns = ["Primary Image", "Images"]

  const updatedData = [];

  for (let m in columns) {
    const column = columns[m];
    
    console.log("*** Syncing ", column);
    
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
