module.exports = function(hbs) {

  hbs.registerHelper('helper_name', function (options) { return 'helper value'; });

  hbs.registerHelper('over2Students', function(studentCount) {
    if (parseInt(studentCount) > 2) {
      return true;
    } else {
      return false;
    }
  });

  hbs.registerHelper('projectCategory', function(fullProjectCategory) {
    // Examples:
    // "Activism & Social Change - Technology-infused social action projects"
    // "Computational Media - interactive visual arts, animation, data visualization"
    return fullProjectCategory.split(" - ")[0];
  })

  return hbs;
}