async function loadData() {
  try {
    const rostersURL = "https://spotstatsai.github.io/SpotstatsAi/rosters.json";
    const scheduleURL = "https://spotstatsai.github.io/SpotstatsAi/schedule.json";

    const rosters = await fetch(rostersURL).then(r => r.json());
    const schedule = await fetch(scheduleURL).then(r => r.json());

    renderTeams(rosters);
    renderGames(schedule);

    log("Data loaded.");
  } catch (err) {
    console.error(err);
    alert("Failed to load data.");
  }
}

// -- UI Rendering ---

function renderTeams(rosters) {
  const container = document.getElementById("teamsList");
  container.innerHTML = "";

  Object.keys(rosters).forEach(team => {
    const div = document.createElement("div");
    div.className = "teamEntry";
    div.textContent = team;
    div.onclick = () => showTeamPlayers(team, rosters[team]);
    container.appendChild(div);
  });
}

function renderGames(schedule) {
  const gamesDiv = document.getElementById("games");
  gamesDiv.innerHTML = "";

  if (!schedule.today || schedule.today.length === 0) {
    gamesDiv.innerHTML = "<p>No games today.</p>";
    return;
  }

  schedule.today.forEach(game => {
    const card = document.createElement("div");
    card.className = "gameCard";

    card.innerHTML = `
      <strong>${game.away} @ ${game.home}</strong><br>
      ${game.time}
    `;

    gamesDiv.appendChild(card);
  });
}

function showTeamPlayers(team, players) {
  const propsPanel = document.getElementById("propsOutput");
  propsPanel.innerHTML = `<h3>${team} Players</h3>`;

  players.forEach(p => {
    propsPanel.innerHTML += `<div>${p}</div>`;
  });
}

function log(msg) {
  console.log("[ENGINE]", msg);
}

// Button trigger
document.getElementById("loadButton").onclick = loadData;
