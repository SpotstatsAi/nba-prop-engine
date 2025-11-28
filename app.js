async function loadData() {
  const rosters = await fetch("https://spotstatsai.github.io/SpotstatsAi/rosters.json").then(r=>r.json());
  const schedule = await fetch("https://spotstatsai.github.io/SpotstatsAi/schedule.json").then(r=>r.json());
  
  document.getElementById("app").innerHTML =
    "<h3>Data Loaded</h3><pre>" + JSON.stringify({
      teams: Object.keys(rosters),
      gamesToday: schedule.today
    }, null, 2) + "</pre>";
}

loadData();
