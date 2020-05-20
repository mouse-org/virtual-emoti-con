var express = require('express');
var app = express();
app.use(express.static('public'));
let hbs = require("hbs");
const customHelpers = require('./customHelpers');
hbs = customHelpers(hbs)
app.set("view engine", "hbs");
app.set("views", "views");



const FAVICON_URL = "https://cdn.glitch.com/0e6dc89f-4128-4c89-b997-8fa6f2d9cc71%2Femoti-con_logo_square.png?v=1586189918610";

var apiRouter = require('./routes/api')
var projectsRouter = require('./routes/projects')

app.use('/api', apiRouter);
app.use('/projects', projectsRouter);
app.use('/', projectsRouter);

/*
app.get("/", function(req, res) {
  res.render("home", {layout: "announcementLayout"});
});
*/

app.get("/submit-a-project", function(req, res) {
  res.render("submit-a-project", {layout: "announcementLayout"});
});

app.get("/about", function(req, res) {
  res.render("about", {layout: "announcementLayout"});
});




var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
