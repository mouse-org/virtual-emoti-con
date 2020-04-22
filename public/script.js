function sendReaction(projectId, reaction) {
  console.log("project id:", projectId);
  console.log("reaction:", reaction);
  
  const counterIdBefore = `project-${projectId}-field-${reaction}-reaction-count`;
  const counterBefore = document.getElementById(counterIdBefore);
  counterBefore.innerHTML = Number.isNaN(parseInt(counterBefore.innerHTML)) ? 1 : parseInt(counterBefore.innerHTML) + 1;
  
  fetch(`/api/${projectId}/${reaction}/plus-one`)
  .then((response) => {
    return response.json();
  })
  .then((data) => {
    console.log(data);
    if (data.error) {
      throw "Could not add reaction."
    }
    
    const counterId = `project-${data.projectId}-field-${data.reaction}-reaction-count`;
    const counter = document.getElementById(counterId);
    counter.innerHTML = data.total;
  })
  .catch(error => {
    console.log("Error: ", error);
  })
  
}


function sendPublicFeedback(projectId, event) {
  event.preventDefault();
  console.log("Sending Public Feedback:")
  var feedbackInput = document.getElementById("public-feedback-feedback");
  var feedback = feedbackInput.value;
  feedbackInput.value = "";
  
  var authorInput = document.getElementById("public-feedback-author");
  var author = authorInput.value;
  authorInput.value = "";
  
  console.log("feedback:", feedback);
  console.log("author:", author);
  
  var baseUrl = `/api/${projectId}/public-feedback`;
  var url = `${baseUrl}?author=${author}&feedback=${feedback}`;
  
  console.log("url:", url);
  
  fetch(url)
  .then((response) => {
    return response.json();
  })
  .then((data) => {
    console.log(data);
    if (data.error) {
      throw "Could save feedback."
    }
  })
  .catch(error => {
    console.log("Error: ", error);
  })
  
}


var publicFeedbackSubmit = document.getElementById("public-feedback-submit");
var projectId = document.getElementById("project-id").innerHTML.trim();
publicFeedbackSubmit.addEventListener('click', sendPublicFeedback.bind(this, projectId));