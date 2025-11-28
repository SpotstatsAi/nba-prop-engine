let rostersData = {};
let scheduleData = {};
let playerStats = {};
let lastProps = [];
let currentFilter = "all";

async function loadData() {
  try {
    const rostersURL = "https://spotstatsai.github.io/SpotstatsAi/rosters.json";
    const scheduleURL = "https://spotstatsai.github.io/SpotstatsAi/schedule.json";
    const statsURL   = "https://spotstatsai.github.io/SpotstatsAi/player_stats.json";

    const [rosters, schedule] = await Promise.all([
      fetch(rostersURL).then(r => r.json()),
      fetch(scheduleURL).then(r => r.json())
    ]);

    rostersData = rosters;
    scheduleData = schedule;

    // Try to load stats (ok if this fails for now)
    try {
      playerStats = await fetch(statsURL).then(r => r.json());
      console.log("[ENGINE] player_stats.json loaded");
    } catch (e) {
      playerStats = {};
      console.warn("[ENGINE] No player_stats.json yet – using placeholder scoring.");
    }

    renderTeams();
    renderGames();
  } catch (err) {
    console.error(err);
    alert("Failed to load data from Spotstats Bible.");
  }
}

/* ---------- UI RENDERING ---------- */

function renderTeams() {
  const container = document.getElementById("teamsList");
  container.innerHTML = "";

  Object.keys(rostersData).forEach(team => {
    const div = document.createElement("div");
    div.className = "teamEntry";
    div.textContent = team;
    div.onclick = () => showTeamPlayers(team);
    container.appendChild(div);
  });
}

function renderGames() {
  const gamesDiv = document.getElementById("games");
  gamesDiv.innerHTML = "";

// Detect today's date in YYYY-MM-DD format
const todayKey = new Date().toISOString().split("T")[0];

// Pull the games for that date from schedule.json
const games = scheduleData[todayKey] || [];

  if (!games.length) {
    gamesDiv.innerHTML = `<p>No games found for ${todayKey}</p>`;
    return;
  }

  games.forEach(game => {
    const card = document.createElement("div");
    card.className = "gameCard";

    card.innerHTML = `
      <strong>${game.away_team} @ ${game.home_team}</strong><br>
      <span>${game.time_et || ""}</span>
    `;

    card.onclick = () => showGameProps(game);
    gamesDiv.appendChild(card);
  });
}

function showTeamPlayers(team) {
  const panel = document.getElementById("propsOutput");
  const players = rostersData[team] || [];

  panel.innerHTML = `<h3>${team} Roster</h3>`;

  players.forEach(name => {
    panel.innerHTML += `<div class="propRow"><span>${name}</span></div>`;
  });

  lastProps = [];
}

/* ---------- PROP ENGINE ---------- */

function showGameProps(game) {
  const awayTeam = game.away_team;
  const homeTeam = game.home_team;


  const awayPlayers = rostersData[awayTeam] || [];
  const homePlayers = rostersData[homeTeam] || [];

  const allEntries = [];

  awayPlayers.forEach(name => {
    allEntries.push(buildPropEntry(name, awayTeam, "away"));
  });

  homePlayers.forEach(name => {
    allEntries.push(buildPropEntry(name, homeTeam, "home"));
  });

  lastProps = allEntries;
  renderProps();
}

function buildPropEntry(name, team, side) {
  const stats = playerStats[name] || null;
  const score = scorePlayer(name, stats);

  let tier, cssClass;
  if (score >= 0.75) {
    tier = "GREEN";
    cssClass = "propGreen";
  } else if (score >= 0.55) {
    tier = "YELLOW";
    cssClass = "propYellow";
  } else {
    tier = "RED";
    cssClass = "propRed";
  }

  return {
    name,
    team,
    side,
    score,
    tier,
    cssClass,
    statsSummary: stats ? summarizeStats(stats) : "No stats – placeholder tier"
  };
}

// Placeholder scoring until we wire real stats
function scorePlayer(name, stats) {
  if (!stats) {
    // Deterministic based on name so it doesn't jump around
    const code = name.charCodeAt(0) + name.charCodeAt(name.length - 1);
    const mod = code % 3;
    if (mod === 0) return 0.8;   // green
    if (mod === 1) return 0.6;   // yellow
    return 0.45;                 // red
  }

  // Example real logic template (will adjust once stats JSON exists)
  let score = 0.5;

  if (stats.minutes >= 30) score += 0.1;
  if (stats.usage   >= 25) score += 0.15;
  if (stats.hitRate && stats.hitRate >= 0.6) score += 0.1;
  if (stats.backToBack) score -= 0.1;

  if (score > 1) score = 1;
  if (score < 0) score = 0;
  return score;
}

function summarizeStats(stats) {
  const parts = [];
  if (stats.minutes) parts.push(`Min: ${stats.minutes}`);
  if (stats.usage) parts.push(`USG: ${stats.usage}`);
  if (stats.hitRate) parts.push(`Hit: ${(stats.hitRate * 100).toFixed(0)}%`);
  return parts.join(" · ");
}

function renderProps() {
  const panel = document.getElementById("propsOutput");
  panel.innerHTML = "";

  const filtered = lastProps.filter(p => {
    if (currentFilter === "all") return true;
    if (currentFilter === "green") return p.tier === "GREEN";
    if (currentFilter === "yellow") return p.tier === "YELLOW";
    if (currentFilter === "red") return p.tier === "RED";
    return true;
  });

  if (!filtered.length) {
    panel.innerHTML = "<p>No props for this filter.</p>";
    return;
  }

  filtered
    .sort((a, b) => b.score - a.score)
    .forEach(p => {
      const row = document.createElement("div");
      row.className = "propRow";

      row.innerHTML = `
        <span>
          <span class="${p.cssClass}">${p.tier}</span>
          &nbsp;${p.name} (${p.team})
        </span>
        <span class="propMeta">${p.statsSummary}</span>
      `;

      panel.appendChild(row);
    });
}

/* ---------- FILTER BUTTONS ---------- */

function initFilters() {
  const buttons = document.querySelectorAll(".filterButton");
  buttons.forEach(btn => {
    btn.onclick = () => {
      currentFilter = btn.getAttribute("data-filter");
      buttons.forEach(b => b.classList.remove("filterActive"));
      btn.classList.add("filterActive");
      renderProps();
    };
  });
}

/* ---------- INIT ---------- */

document.getElementById("loadButton").onclick = loadData;
initFilters();
