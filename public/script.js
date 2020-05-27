const emojis = {
  alien: "👾",
  rocket: "🚀",
  globe: "🌎",
  rainbow: "🌈",
  lightbulb: "💡"
}

let sentReactions = {};
let pleaseDontSpamTheAPIThanks = "its_not_in_the_spirit_of_emoticon"

function sendReaction(projectId, reaction) {
  //console.log("project id:", projectId);
  //console.log("reaction:", reaction);

  if (sentReactions[projectId] && sentReactions[projectId] > 10) {
    return;
  }

  if (!sentReactions[projectId]) {
    sentReactions[projectId] = 0;
  }

  sentReactions[projectId] += 1;

  displayReaction(emojis[reaction]);
  
  const counterIdBefore = `project-${projectId}-field-${reaction}-reaction-count`;
  const counterBefore = document.getElementById(counterIdBefore);
  counterBefore.innerHTML = Number.isNaN(parseInt(counterBefore.innerHTML)) ? 1 : parseInt(counterBefore.innerHTML) + 1;
  
  fetch(`/api/${projectId}/${reaction}/plus-one?key=pleaseDontSpamTheAPITHanks`)
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

    // Increment counter
    if (parseInt(counter.innerHTML) < data.total) {
      counter.innerHTML = data.total;
    }

    
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
  if (publicFeedbackSubmit) {
  var projectId = document.getElementById("project-id").innerHTML.trim();
  publicFeedbackSubmit.addEventListener('click', sendPublicFeedback.bind(this, projectId));
}



function displayReaction(emoji) {
  const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
  const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

  const reactions = document.getElementById("reactions-display");
  for (let i = 0; i < 100; i++) {

    var node = document.createElement("div");
    const randomW = Math.floor(Math.random() * Math.floor(vw));
    const randomW2 = Math.floor(Math.random() * Math.floor(vw));
    const randomH = Math.floor(Math.random() * Math.floor(vh));
    const randomH2 = Math.floor(Math.random() * Math.floor(vh));
    node.style.cssText = `font-size: 30px;position: fixed; top: ${randomH}px; left: ${randomW}px; z-index: 20; animation: .7s ease-out 0s 1 emojiAnimate;`;
    var textnode = document.createTextNode(emoji);
    node.appendChild(textnode);
    reactions.appendChild(node);
    setTimeout(() => {
      reactions.innerHTML = '';
    }, 650);
  }
}


function copyLink(projectId) {
  var copyText = document.getElementById("project-link-to-copy");

  /* Select the text field */
  copyText.select();
  copyText.setSelectionRange(0, 999); /*For mobile devices*/

  /* Copy the text inside the text field */
  document.execCommand("copy");

  /* Alert the copied text */
  alert("Copied the text: " + copyText.value);
}