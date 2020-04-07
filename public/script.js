function sendReaction(projectId, reaction) {
  console.log("project id:", projectId);
  console.log("reaction:", reaction);
  
  
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