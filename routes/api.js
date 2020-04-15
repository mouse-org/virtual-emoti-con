var express = require('express')
var router = express.Router()

const { GoogleSpreadsheet } = require('google-spreadsheet');
const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID);

const getSpreadsheetData = require("../helpers/spreadsheet");

router.get("/:projectId/:reaction/plus-one", async function(req, res) {
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

module.exports = router