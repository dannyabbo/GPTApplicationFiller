console.log("Content script loaded");

function scrapeInputs() {
  console.log("Scraping inputs");
  const inputs = document.querySelectorAll("input, textarea, select");
  let inputDetails = [];
  inputs.forEach((input) => {
    inputDetails.push({
      name: input.name || input.id,
      type: input.type,
      value: input.value,
      placeholder: input.placeholder,
    });
  });
  console.log("Inputs scraped:", inputDetails);
  return inputDetails;
}

function cleanHTML() {
  console.log("Cleaning HTML");
  const scripts = document.querySelectorAll("script");
  scripts.forEach((script) => script.remove());
  const html = document.body.innerHTML;
  console.log("HTML cleaned:", html);
  return html;
}

function fillInputs(jsonResponse) {
  console.log("Filling inputs with JSON response:", jsonResponse);
  jsonResponse.forEach((field) => {
    const input = document.querySelector(
      `[name="${field.name}"], [id="${field.name}"]`
    );
    if (input) {
      input.value = field.value;
    }
  });
}

function fillApplication() {
  chrome.storage.local.get(["apiKey", "resumeContent"], function (data) {
    if (data.apiKey && data.resumeContent) {
      console.log("Data retrieved successfully");
      const inputs = scrapeInputs();
      const cleanHtml = cleanHTML();
      chrome.runtime.sendMessage({
        action: "callChatGPT",
        apiKey: data.apiKey,
        cleanHtml: cleanHtml,
        resumeContent: data.resumeContent,
      });
    } else {
      console.log("Please save your API key and resume first.");
      alert("Please save your API key and resume first.");
    }
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Received message:", request.action);
  if (request.action === "scrapeInputs") {
    const inputs = scrapeInputs();
    const html = cleanHTML();
    sendResponse({ inputs, html });
  } else if (request.action === "fillInputs") {
    fillInputs(request.jsonResponse);
  } else if (request.action === "fillApplication") {
    fillApplication();
    sendResponse({ success: true });
  }
});
