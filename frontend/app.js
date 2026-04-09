const bodyEl = document.getElementById("playersBody");
const statusEl = document.getElementById("statusText");
const refreshBtn = document.getElementById("refreshBtn");

async function api(path, method = "GET", payload = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY
    }
  };

  if (payload) options.body = JSON.stringify(payload);

  const res = await fetch(`${API_URL}${path}`, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function statusClass(status) {
  if (status === "approved") return "badge-approved";
  if (status === "rejected") return "badge-rejected";
  return "badge-pending";
}

function rowHtml(username, player) {
  return `
    <tr>
      <td>${username}</td>
      <td>${player.coins}</td>
      <td>${player.job}</td>
      <td class="${statusClass(player.status)}">${player.status}</td>
      <td class="actions">
        <button data-user="${username}" data-action="approve">Approve</button>
        <button class="btn-reject" data-user="${username}" data-action="reject">Reject</button>
      </td>
    </tr>
  `;
}

async function loadPlayers() {
  try {
    statusEl.textContent = "Refreshing players...";
    const data = await api("/admin/players");
    const players = data.players || {};
    const names = Object.keys(players).sort((a, b) => a.localeCompare(b));

    if (!names.length) {
      bodyEl.innerHTML = "";
      statusEl.textContent = "No players found.";
      return;
    }

    bodyEl.innerHTML = names.map((name) => rowHtml(name, players[name])).join("");
    statusEl.textContent = `Loaded ${names.length} player(s).`;
  } catch (err) {
    statusEl.textContent = `Error: ${err.message}`;
  }
}

bodyEl.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;

  const username = target.dataset.user;
  const action = target.dataset.action;
  if (!username || !action) return;

  try {
    target.disabled = true;
    await api(`/admin/${action}`, "POST", { username });
    await loadPlayers();
  } catch (err) {
    statusEl.textContent = `Action failed: ${err.message}`;
  } finally {
    target.disabled = false;
  }
});

refreshBtn.addEventListener("click", loadPlayers);
loadPlayers();
setInterval(loadPlayers, 5000);
