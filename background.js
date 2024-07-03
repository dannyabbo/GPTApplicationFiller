chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "callChatGPT") {
    callChatGPT(request.apiKey, request.cleanHtml, request.resumeContent);
  } else if (request.action === "retryFetch") {
    fetch(request.url, request.options)
      .then((response) => response.json())
      .then((data) => {
        console.log("Fetch success:", data);
        sendResponse({ success: true, data });
      })
      .catch((error) => {
        console.error("Fetch error:", error);
        sendResponse({ success: false, error });
      });
    return true; // Keep the message channel open for sendResponse
  }
});

function callChatGPT(apiKey, cleanHtml, resumeContent, retryCount = 0) {
  fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that helps fill out job application forms.",
        },
        {
          role: "user",
          content: `Fill out the following job application form using the resume content below:\n${cleanHtml}\n\nResume:\n${resumeContent}`,
        },
      ],
      max_tokens: 1500,
    }),
  })
    .then((response) => {
      if (!response.ok && retryCount < 5) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`Retrying in ${delay}ms...`);
        chrome.runtime.sendMessage({
          action: "updateStatus",
          status: `Retrying in ${delay}ms...`,
        });
        setTimeout(
          () => callChatGPT(apiKey, cleanHtml, resumeContent, retryCount + 1),
          delay
        );
      } else {
        console.log("Response received");
        chrome.runtime.sendMessage({
          action: "updateStatus",
          status: "Response received. Parsing...",
        });
        return response.json();
      }
    })
    .then((result) => {
      const jsonResponse = JSON.parse(result.choices[0].message.content.trim());
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            function: fillInputs,
            args: [jsonResponse],
          },
          (results) => {
            if (chrome.runtime.lastError || !results || !results[0]) {
              chrome.runtime.sendMessage({
                action: "updateStatus",
                status: "Error filling inputs.",
              });
              console.error(chrome.runtime.lastError);
            } else {
              console.log("Inputs filled successfully.");
              chrome.runtime.sendMessage({
                action: "updateStatus",
                status: "Application filled successfully!",
              });
            }
          }
        );
      });
    })
    .catch((error) => {
      console.error("Error:", error);
      chrome.runtime.sendMessage({
        action: "updateStatus",
        status: `Error: ${error.message}`,
      });
    });
}
