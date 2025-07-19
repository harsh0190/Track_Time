function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

function getPastDates(days) {
  const dates = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toLocaleDateString());
  }
  return dates;
}

function loadAnalytics(filter = "today") {
  chrome.storage.local.get(null, (data) => {
    const analytics = document.getElementById("analytics");
    analytics.innerHTML = "";

    const relevantDates = filter === "week" ? getPastDates(7) : [new Date().toLocaleDateString()];
    const todayData = Object.entries(data).filter(([key]) => {
      return relevantDates.some(date => key.endsWith(`__${date}`));
    });

    const domainMap = {};
    for (const [key, val] of todayData) {
      const domain = key.split("__")[0];
      domainMap[domain] = (domainMap[domain] || 0) + val;
    }

    const total = Object.values(domainMap).reduce((sum, val) => sum + val, 0);
    const sorted = Object.entries(domainMap).sort((a, b) => b[1] - a[1]);

    for (const [domain, time] of sorted) {
      const percent = total > 0 ? ((time / total) * 100).toFixed(1) : 0;
      const siteElem = document.createElement("div");
      siteElem.className = "site";
      siteElem.innerHTML = `
        <div><strong>${domain}</strong>: ${formatTime(time)} <span style="color:gray">(${percent}%)</span></div>
        <div class="bar" style="width:${percent}%"></div>
      `;
      analytics.appendChild(siteElem);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Load initial theme
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    document.getElementById("theme-icon").textContent = "🌞";
  }

  // Initial load
  loadAnalytics();

  // Reset button
  document.getElementById("reset").onclick = () => {
    chrome.storage.local.clear(() => location.reload());
  };

  // Dark mode toggle
  document.getElementById("theme-icon").onclick = () => {
    const body = document.body;
    const isDark = body.classList.toggle("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    document.getElementById("theme-icon").textContent = isDark ? "🌞" : "🌙";
  };

  // Time filter
  document.getElementById("time-filter").onchange = (e) => {
    loadAnalytics(e.target.value);
  };
});
