// popup.js — update status based on current tab URL
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const url = tabs[0]?.url || "";
  const dot = document.getElementById("statusDot");
  const text = document.getElementById("statusText");

  if (url.includes("youtube.com/shorts")) {
    dot.classList.add("active");
    text.textContent = "Active — Shorts detected ✓";
    text.style.color = "#44ff88";
  } else if (url.includes("youtube.com")) {
    dot.classList.add("active");
    text.textContent = "On YouTube — navigate to a Short";
    text.style.color = "#aaa";
  } else {
    dot.classList.remove("active");
    text.textContent = "Not on YouTube";
    text.style.color = "#555";
  }
});
