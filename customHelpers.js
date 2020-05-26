module.exports = function(hbs) {

  hbs.registerHelper('helper_name', function (options) { return 'helper value'; });

  hbs.registerHelper('over2Students', function(studentCount) {
    if (parseInt(studentCount) > 2) {
      return true;
    } else {
      return false;
    }
  });

  hbs.registerHelper("projectCategory", function(fullProjectCategory) {
    // Examples:
    // "Activism & Social Change - Technology-infused social action projects"
    // "Computational Media - interactive visual arts, animation, data visualization"
    return fullProjectCategory.split(" - ")[0];
  });

  hbs.registerHelper("roleAndOrg", function(role, org) {
    if (role && org) {
      return `${role} at ${org}`;
    } else {
      if (org) {
        return `from ${org}`;
      }
      if (role) {
        return `${role}`
      }
      return ""
    }
  })

  hbs.registerHelper('breaklines', function(text) {
    text = hbs.Utils.escapeExpression(text);
    text = text.replace(/(\r\n|\n|\r)/gm, '<br>');
    return new hbs.SafeString(text);
  });

  hbs.registerHelper('twitterImage', function(singleProject, projectData) {
    if (
      singleProject
      && projectData["Primary Image"]
      && projectData["Primary Image"].images
      && projectData["Primary Image"].urls
      && projectData["Primary Image"].urls[0]
    ) {
      return `https://drive.google.com/uc?export=view&id=${projectData["Primary Image"].urls[0]}`
    } else {
      return "/images/social-card-logo.png";
    }
    
  })

  hbs.registerHelper('socialImage', function(singleProject, projectData) {
    if (
      singleProject
      && projectData["Primary Image"]
      && projectData["Primary Image"].images
      && projectData["Primary Image"].urls
      && projectData["Primary Image"].urls[0]
    ) {
      return `https://drive.google.com/uc?export=view&id=${projectData["Primary Image"].urls[0]}`
    } else {
      return "/images/emoti-con-header.gif";
    }
    
  })

  hbs.registerHelper('tweetText', function(projectData) {
    if (!projectData) {
      return "https://virtual.emoti-con.org/";
    }

    let tweetText = '';
    if (projectData["Project Name"]) {
      tweetText += "Take a look at " + projectData["Project Name"] + " a project in the Emoti-Con NYC Project Fair! "
    }

    if (projectData.rowId) {
      tweetText += "https://virtual.emoti-con.org/projects/" + projectData.rowId
    }

    if (!tweetText) {
      return "https://virtual.emoti-con.org/";
    }

    return tweetText;

  })

  hbs.registerHelper('facebookText', function(projectData) {
    if (!projectData) {
      return "?href=https://virtual.emoti-con.org/";
    }
    /*
    let facebookText = '?';
    if (projectData["Project Name"]) {
      facebookText += "quote=Take%20a%20look%20at%20" + projectData["Project Name"] + "%20a%20project%20in%20the%20Emoti-Con%20NYC%20Project%20Fair!&"
    }

    if (projectData.rowId) {
      facebookText += "href=https://virtual.emoti-con.org/projects/" + projectData.rowId
    }

    
    if (!facebookText) {
      return "?href=https://virtual.emoti-con.org/";
    }
    */

    if (projectData.rowId) {
      return "https://www.facebook.com/sharer/sharer.php?u=https://virtual.emoti-con.org/projects/" + projectData.rowId;
    }

    return facebookText;
  })

  return hbs;
}