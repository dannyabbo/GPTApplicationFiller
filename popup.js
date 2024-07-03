document
  .getElementById("configForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    const apiKey = document.getElementById("apiKey").value;
    const resume = document.getElementById("resume").files[0];
    const status = document.getElementById("status");

    if (apiKey && resume) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const resumeContent = e.target.result;
        chrome.storage.local.set({ apiKey, resumeContent }, function () {
          console.log("Configuration saved!");
          status.textContent = "Configuration saved!";
        });
      };
      reader.readAsText(resume);
    } else {
      console.log("Please fill out all fields.");
      status.textContent = "Please fill out all fields.";
    }
  });

document.getElementById("fillButton").addEventListener("click", function () {
  const status = document.getElementById("status");
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    status.textContent = "Filling application...";
    chrome.tabs.sendMessage(
      tabs[0].id,
      { action: "fillApplication" },
      (response) => {
        if (chrome.runtime.lastError || !response || !response.success) {
          status.textContent = "Error executing fill application script.";
          console.error(chrome.runtime.lastError || response.error);
        } else {
          status.textContent = "Application filled successfully!";
          console.log("Fill application script executed.");
        }
      }
    );
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateStatus") {
    const status = document.getElementById("status");
    status.textContent = request.status;
  }
});
