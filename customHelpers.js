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
      return "https://virtual.emoti-con.org/images/social-card.png";
    }
    /*
    {{#if projectData.[Primary Image] }}
      {{#if projectData.[Primary Image].images}}
        {{#each projectData.[Primary Image].urls}}
          <div class="primary-image">
            <!--{{! Edit URL to make hotlinkable }}-->
              <img src="https://drive.google.com/uc?export=view&id={{this}}" style="width: 500px; max-width: 100%; height: auto" title="Click for the larger version." />
          </div>
        {{/each}}
      {{/if}}
    {{/if}}
    */
    
  })

  return hbs;
}