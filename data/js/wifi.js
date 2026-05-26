const WIFI_KEY = "hatchaiWifi";

function getWifiElements() {
  return {
    wifiStatus: document.getElementById("wifiStatus"),
    wifiNetworkList: document.getElementById("wifiNetworkList"),
    espWifiBadge: document.getElementById("espWifiBadge"),
    espIpAddress: document.getElementById("espIpAddress"),
    espSignal: document.getElementById("espSignal")
  };
}

function setEspWifiState(label, statusClass, ip, signal) {
  const {
    wifiStatus,
    espWifiBadge,
    espIpAddress,
    espSignal
  } = getWifiElements();

  if (!espWifiBadge || !espIpAddress || !espSignal) return;

  espWifiBadge.textContent = label;
  espWifiBadge.className = "status-pill " + statusClass;

  espIpAddress.textContent = ip;
  espSignal.textContent = signal;

  if (wifiStatus) {
    wifiStatus.textContent =
      label === "Connected" || label === "Selected" ? "Online" : "Offline";
  }
}

async function scanWifiNetworks(setStatus) {
  const { wifiNetworkList } = getWifiElements();

  if (!wifiNetworkList) return;

  wifiNetworkList.innerHTML = "<li>Scanning Wi-Fi networks...</li>";

  if (typeof setStatus === "function") {
    setStatus("Scanning Wi-Fi networks from ESP32...", "#D97706");
  }

  const esp32Urls = [
    window.location.protocol.startsWith("http") ? window.location.origin : "",
    "http://hatchai.local",
    "http://192.168.4.1"
  ].filter(Boolean);

  for (const baseUrl of esp32Urls) {
    try {
      const response = await fetch(baseUrl + "/scan-wifi");
      const networks = await response.json();

      if (!Array.isArray(networks) || networks.length === 0) {
        wifiNetworkList.innerHTML = "<li>No Wi-Fi networks found.</li>";

        if (typeof setStatus === "function") {
          setStatus("No Wi-Fi networks found.", "#2563EB");
        }

        return;
      }

      renderWifiNetworks(networks, baseUrl, setStatus);

      if (typeof setStatus === "function") {
        setStatus("Wi-Fi scan complete. Select a network from the list.", "#16A34A");
      }

      return;
    } catch (error) {
      continue;
    }
  }

  wifiNetworkList.innerHTML =
    "<li>Cannot scan. Make sure the ESP32 server is running at hatchai.local or 192.168.4.1.</li>";

  if (typeof setStatus === "function") {
    setStatus("Wi-Fi scan failed. Check ESP32 setup mode and /scan-wifi endpoint.", "#DC2626");
  }
}

function renderWifiNetworks(networks, baseUrl, setStatus) {
  const { wifiNetworkList } = getWifiElements();

  if (!wifiNetworkList) return;

  wifiNetworkList.innerHTML = networks.map((network, index) => {
    const ssid = network.ssid || "Hidden Network";
    const lock = network.secure ? "Locked" : "Open";
    const rssi = network.rssi !== undefined ? network.rssi + " dBm" : "Signal unknown";

    return `
      <li>
        <button type="button" data-index="${index}">
          <span>${ssid} &middot; ${lock}</span>
          <span>${rssi}</span>
        </button>
      </li>
    `;
  }).join("");

  document.querySelectorAll("#wifiNetworkList button").forEach((button, index) => {
    button.addEventListener("click", () => {
      selectWifiNetwork(networks[index], button, baseUrl, setStatus);
    });
  });
}

function selectWifiNetwork(network, button, baseUrl, setStatus) {
  const ssid = network.ssid || "Hidden Network";
  const signal = network.rssi !== undefined ? network.rssi + " dBm" : "Signal unknown";
  const server = baseUrl.replace("http://", "");

  document.querySelectorAll("#wifiNetworkList button").forEach(item => {
    item.classList.remove("selected");
  });

  button.classList.add("selected");

  setEspWifiState("Selected", "status-warning", server, signal);

  saveData(WIFI_KEY, {
    ssid,
    signal,
    server,
    selected: true
  });

  if (typeof setStatus === "function") {
    setStatus("Selected Wi-Fi network: " + ssid + ".", "#2563EB");
  }
}

function loadSavedWifi() {
  const savedWifi = loadData(WIFI_KEY);

  if (savedWifi && savedWifi.selected) {
    setEspWifiState(
      "Selected",
      "status-warning",
      savedWifi.server || "hatchai.local",
      savedWifi.signal || "Signal unknown"
    );
  }
}

function resetWifiState() {
  const { wifiNetworkList } = getWifiElements();

  if (wifiNetworkList) {
    wifiNetworkList.innerHTML =
      "<li>No scan yet. Connect to the ESP32 setup Wi-Fi first, then click Scan Wi-Fi.</li>";
  }

  setEspWifiState("Disconnected", "status-alert", "---", "---");
  removeData(WIFI_KEY);
}
