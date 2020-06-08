var express = require("express");
var app = express();
app.use(express.static("public"));
let hbs = require("hbs");
const customHelpers = require("./customHelpers");
hbs = customHelpers(hbs);
app.set("view engine", "hbs");
app.set("views", "views");

const FAVICON_URL =
  "https://cdn.glitch.com/0e6dc89f-4128-4c89-b997-8fa6f2d9cc71%2Femoti-con_logo_square.png?v=1586189918610";

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
const ProjectData = require("./models/ProjectData");


const reactions = require("./helpers/reactions");

const templateData = {
  favicon: FAVICON_URL,
  reactions: reactions
}

var apiRouter = require("./routes/api");
var projectsRouter = require("./routes/projects");
var syncRouter = require("./routes/sync");

app.use("/api", apiRouter);
app.use("/projects", projectsRouter);
app.use("/sync", syncRouter);

/*
app.get("/", function(req, res) {
  res.render("home", {layout: "announcementLayout"});
});
*/

app.get("/submit-a-project", function(req, res) {
  res.render("submit-a-project", { layout: "announcementLayout" });
});

app.get("/about", function(req, res) {
  res.render("about", { layout: "announcementLayout" });
});

app.use("/404", function(req, res) {
  res.render("error", {error: "Page not found"});
})

app.get("/", async function(req, res) {
  
  //const sheetData = await getSpreadsheetData(doc);
  

  const rows = await ProjectData.find();

  let parsedRows = rows.map(projectData => {
    let parsedProjectData = {};

    parsedProjectData["rowId"] = projectData["rowId"];
    parsedProjectData["Reviewed"] = JSON.parse(projectData["Reviewed"]);
    parsedProjectData["ProjectId"] = projectData["ProjectId"];
    parsedProjectData["alien"] = projectData["alien"];
    parsedProjectData["rocket"] = projectData["rocket"];
    parsedProjectData["globe"] = projectData["globe"];
    parsedProjectData["rainbow"] = projectData["rainbow"];
    parsedProjectData["lightbulb"] = projectData["lightbulb"];
    parsedProjectData["Primary Image"] = JSON.parse(projectData["Primary Image"]);
    parsedProjectData["Timestamp"] = JSON.parse(projectData["Timestamp"]);
    parsedProjectData["Project Name"] = JSON.parse(projectData["Project Name"]);
    parsedProjectData["Project Description"] = JSON.parse(projectData["Project Description"]);
    parsedProjectData["Student Names"] = JSON.parse(projectData["Student Names"]);
    parsedProjectData["Age Range"] = JSON.parse(projectData["Age Range"]);
    parsedProjectData["Project Category"] = JSON.parse(projectData["Project Category"]);
    parsedProjectData["Organization or Program Affiliation"] = JSON.parse(projectData["Organization or Program Affiliation"]);
    parsedProjectData["Images"] = JSON.parse(projectData["Images"]);
    parsedProjectData["Video"] = JSON.parse(projectData["Video"]);
    parsedProjectData["Slides"] = JSON.parse(projectData["Slides"]);
    parsedProjectData["Links"] = JSON.parse(projectData["Links"]);
    parsedProjectData["Audio"] = JSON.parse(projectData["Audio"]);
    parsedProjectData["More About Our Project"] = JSON.parse(projectData["More About Our Project"]);
    parsedProjectData["Student Count"] = JSON.parse(projectData["Student Count"]);
    parsedProjectData["Schools"] = JSON.parse(projectData["Schools"]);
    if (projectData["Award Name"]) {
      parsedProjectData["Award Name"] = JSON.parse(projectData["Award Name"]);
    }

    return parsedProjectData;
  })

  parsedRows = parsedRows.sort((a,b) => {
    let p = "Project Name"
    let aProjectName = '';
    let bProjectName = '';

    if (a[p]) {
      aProjectName = a[p].toUpperCase();
    }

    if (b[p]) {
      bProjectName = b[p].toUpperCase();
    }

    return aProjectName > bProjectName ? 1 : -1;   
  });

  const allProjects = {
    rows: parsedRows
  }

  /*
  if (sheetData && sheetData.rows) {
    const renderData = Object.assign({}, templateData, sheetData);

    res.render("projectsIndex", renderData);
  } else {
    res.redirect("/404");
  }
  */

  if (allProjects) {
    const renderData = Object.assign({}, templateData, allProjects);

    res.render("projectsIndex", renderData);
  } else {
    res.redirect("/404");
  }
  
});

app.use("*", function(req, res) {
  res.render("error", {error: "Page not found"});
})

var listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});
