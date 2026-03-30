chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "ANALYSE_PROMPT") {
    fetch(request.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request.payload)
    })
    .then(res => {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(data => sendResponse({ success: true, data }))
    .catch(err => sendResponse({ success: false, error: err.message }));

    return true; // Keep the message channel open for async response
  }
});
