# Virtual Emoticon


# Update 7/14/20

Everything below is for the dyanmic version of the site, this version is a new static version of the site with just html files.

The static version lives in the /docs folder

GitHub Pages made me choose a Jeckyll theme even though we're not using Jeckyll.

---

Virtual Emoti-Con is kind of a mess, sorry! To be honest, I wouldn’t recommend re-using this code, and more just using the lessons learned when designing a future Virtual Emoti-Con website.

### Lessons Learned from this Project:

- In 2020 we used a Google form for both Project Submissions and 	Community/Judge comments.
  - Using a Google Form for project submissions addend a lot of complexity to the code because it meant that 
- It is a node.js app that uses Handlebars (via hbs npm package) templating.

### General Notes

- It is hosted on Heroku
  - For project data it uses a free tier MongoDB database through a Heroku plugin. It uses the Mongoose package as an ORM.
- There is a secondary database in a Google Spreadsheet
  - This db can be enabled for project data (and is currently enabled on a secondary route (https://virtual.emoti-con.org/projects/sheet-version/66).
  - This database is currently used for comment data.
  - If the app gets very high traffic (500 requests per second -- which may be possible more on this later) the Google Sheet db will give a 403 error.
  - The only real-time user data input is emoji reactions on each project. The app tries to save these reaction increments in both the MongoDB db and the Google Sheet db.

### Setup:
  - ENV variables are available in the settings on Heroku, you can use the PROD values for development.

### Urgent questions:

#### How do I remove a project from displaying?
- Remove from both the Heroku MongoDB database and the Google Sheet
  - Removing from MongoDB database:
    - Login to Heroku
    - accounts@mouse.org
    - Look up in lastpass ¯\\_(ツ)_/¯ 
    - Click on virtual-emoti-con project
    - Go to Resources tab
    - Click on mLab MongoDB (will open in a new tab)
    - Click on projectdatas under Collections
    - Find the project you want to delete and click the trashcan icon
  - Removing from Google Sheet
    - Delete the row (actually delete the whole row, don’t just clear the data)
    - Have a snack

#### How do I edit a field on a project?

  - It is probably easier to follow the steps above for deleting a project from MongoDB, then resyncing it
  - Delete project from MongoDB
  - Edit the field in the Google Sheet
  - Go to:
    - https://virtual.emoti-con.org/sync/projects/data/PROJECTID?p=[LONG STRING PASSWORD]
    - With the PROJECTID text replaced with the project’s id
    - The sync key at the end is stored in the project’s ENV variables
  - Double check to make sure everything worked correctly by viewing the project in the frontend.

#### Ongoing costs:

  - Currently we are paying for 2 services related to Virtual Emoti-Con:
    - Heroku
      - This is a $7 a month charge for hosting the project. We can turn off the web worker in the heroku project to revert to the free tier. This means the project will take ~20 seconds to start up when someone tries to view it.
        - Go to the Resources tab of the virtual-emoti-con project in Heroku
        - Click on the edit pencil next to $7.00
        - Turn off the toggle
    - AWS S3
      - The project stores images and videos in AWS S3. It’s hard to separate out this cost from the Mouse Create AWS cost, but it is probably minimal.
      - If for some reason we need to turn this off, it is possible to revert the project to read the files from Google Drive, but I would recommend just taking down the site instead.

### Overview of Code:

#### Routes:
  - There are relatively few routes in the app:
    - / - Projects index, defined in `/server.js`
    - `/projects` - Redirects to /
    - `/projects/[project id]`
      - Individual project page
      - Defined in /routes/projects.js
    - `/projects/sheet-version/[project id]`
      - Individual project page powered by Google Sheet backend instead of MongoDB database
      - Defined in /routes/projects.js
    - `/sync/projects/data/[project id]`
      - Admin only route to sync Google Sheet data to new MongoDB record
      - Env variable matched query string password required on query string param “p”
    - `/sync/projects/images/[project id]`
      - Admin only route to sync certain columns from the Google Sheet that have image urls. Uploads the images stored in Google Drive to AWS S3 and stores the new S3 urls in a different tab in the Google Sheet.
      - Env variable matched query string password required on query string param “p”
      - Very hastily written and probably a mess
    - `/api/[project id]/[reaction]/plus-one`
      - Increments the reaction count for a specified project and reaction in both the Google Sheet and the MongoDB backend
      - This is vulnerable to automated requests, which happened once. I added comments to discourage this, but there’s nothing technically stopping it from happening.
        - The main issue with the automated requests besides ridiculous reaction count numbers is that the Google Sheet backend will start 403ing if it gets too many requests. This will temporarily take down the Community and Judge responses, but project detail pages will still load without them.
    - `/submit-a-project`
      - Standalone page, defined in server.js
    - `/about`
    - Standalone page, defined in server.js

### Views:

  - There are two layout files that pages are rendered into:
    - `announcementLayout.hbs`
      - `/about`
      - `/submit-a-project`
    - `layout.hbs` (default)
      - All other non api routes (Project fair)
  - Project Fair Routes:
    - In the Project Fair views there is some unintuitive conditional nesting to prevent rendering errors on incomplete or unexpected data when rendering from the Google Sheet.
    - These route are not very DRY and nothing is separated out into partials because this project was put together very quickly.
