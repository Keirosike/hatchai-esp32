const CONTROL_DEVICES = {
  bulb: {
    switchId: "bulbSwitch",
    cardId: "bulbCard",
    textId: "bulbText",
    summaryId: "summaryBulb",
    label: "Heating bulbs",
    autoText: "Both bulbs are auto-controlled by temperature target",
    onText: "Heating bulbs are ON",
    offText: "Heating bulbs are OFF"
  },
  fan: {
    switchId: "fanSwitch",
    cardId: "fanCard",
    textId: "fanText",
    summaryId: "summaryFan",
    label: "Fan",
    autoText: "Auto-controlled for air circulation",
    onText: "Fan is ON",
    offText: "Fan is OFF"
  },
  turner: {
    switchId: "turnerSwitch",
    cardId: "turnerCard",
    textId: "turnerText",
    summaryId: "summaryTurner",
    label: "Egg turner",
    autoText: "Auto-controlled by turning interval",
    onText: "Egg turner is ON",
    offText: "Egg turner is OFF"
  }
};

const HatchControl = {
  degreeC: "\u00B0C",
  elements: {},
  devices: {},
  isSyncing: false,
  pollTimer: null,

  init() {
    this.cacheElements();
    this.bindEvents();
    this.updateControlState();
    this.loadControllerState({ updateFields: true });

    this.pollTimer = setInterval(() => {
      this.loadControllerState();
    }, 5000);
  },

  cacheElements() {
    this.elements = {
      autoModeSwitch: HatchApp.get("autoModeSwitch"),
      turnEggBtn: HatchApp.get("turnEggBtn"),
      saveSettingsBtn: HatchApp.get("saveControlSettingsBtn"),
      controlStatusBadge: HatchApp.get("controlStatusBadge"),
      autoStateText: HatchApp.get("autoStateText"),
      autoDescription: HatchApp.get("autoDescription"),
      lockBadge: HatchApp.get("lockBadge"),
      summaryAuto: HatchApp.get("summaryAuto"),
      summaryLock: HatchApp.get("summaryLock"),
      lastTurnValue: HatchApp.get("lastTurnValue"),
      settingsStatus: HatchApp.get("settingsStatus"),
      targetTemp: HatchApp.get("targetTemp"),
      targetHumidity: HatchApp.get("targetHumidity"),
      turnInterval: HatchApp.get("turnInterval")
    };

    this.devices = Object.fromEntries(
      Object.entries(CONTROL_DEVICES).map(([key, config]) => [
        key,
        {
          ...config,
          switch: HatchApp.get(config.switchId),
          card: HatchApp.get(config.cardId),
          text: HatchApp.get(config.textId),
          summary: HatchApp.get(config.summaryId)
        }
      ])
    );
  },

  confirmAction(options) {
    if (window.HatchModal?.open && HatchModal.open(options)) {
      return;
    }

    const fallbackConfirm = confirm(options.message || "Are you sure?");

    if (fallbackConfirm && typeof options.onConfirm === "function") {
      options.onConfirm();
    }
  },

  bindEvents() {
    this.elements.autoModeSwitch?.addEventListener("click", event => {
      if (this.elements.autoModeSwitch.checked) {
        this.updateControlState();
        this.syncControlSettings("Auto mode enabled.");
        return;
      }

      this.confirmSwitchChange(event, {
        title: "Turn auto mode off?",
        message: "Warning: Auto mode will stop controlling the bulb, fan, and egg turner. Manual controls will stay active until auto mode is turned back on.",
        confirmText: "Turn auto off",
        confirmClass: "modal-btn-danger",
        onConfirm: () => {
          this.updateControlState();
          this.syncControlSettings("Manual controls unlocked.");
        }
      });
    });

    Object.values(this.devices).forEach(device => {
      device.switch?.addEventListener("change", () => {
        this.updateControlState();
        this.syncControlSettings(`${device.label} updated.`);
      });
    });

    this.elements.turnEggBtn?.addEventListener("click", () => {
      this.confirmAction({
        title: "Turn eggs now?",
        message: "This will run a manual egg turn cycle immediately.",
        confirmText: "Turn eggs",
        confirmClass: "modal-btn-primary",
        cancelText: "Cancel",
        onConfirm: () => this.turnEggsNow()
      });
    });

    this.elements.saveSettingsBtn?.addEventListener("click", () => {
      this.confirmAction({
        title: "Save control settings?",
        message: "This will save the target temperature, humidity, and egg turn interval to the ESP32.",
        confirmText: "Save settings",
        confirmClass: "modal-btn-primary",
        cancelText: "Cancel",
        onConfirm: () => this.saveSettings()
      });
    });
  },

  confirmSwitchChange(event, options) {
    const switchInput = event.currentTarget;
    const requestedValue = switchInput.checked;

    event.preventDefault();
    switchInput.checked = !requestedValue;

    this.confirmAction({
      ...options,
      cancelText: "Cancel",
      onConfirm: () => {
        switchInput.checked = requestedValue;
        options.onConfirm();
      }
    });
  },

  updateControlState() {
    const autoOn = this.elements.autoModeSwitch?.checked ?? true;

    Object.values(this.devices).forEach(device => {
      if (device.switch) {
        device.switch.disabled = autoOn;
      }

      device.card?.classList.toggle("locked", autoOn);
      this.updateDeviceText(device, autoOn);
    });

    if (this.elements.turnEggBtn) {
      this.elements.turnEggBtn.disabled = autoOn;
    }

    HatchApp.setText("controlStatusBadge", autoOn ? "Auto Mode: ON" : "Auto Mode: OFF");
    HatchApp.setText("autoStateText", autoOn ? "Auto ON" : "Auto OFF");
    HatchApp.setText(
      "autoDescription",
      autoOn
        ? "Manual controls are locked while automatic mode is active."
        : "Manual controls are now available for the bulb, fan, and egg turner."
    );
    HatchApp.setText("lockBadge", autoOn ? "Manual Controls Locked" : "Manual Controls Unlocked");
    HatchApp.setText("summaryAuto", autoOn ? "ON" : "OFF");
    HatchApp.setText("summaryLock", autoOn ? "Locked" : "Unlocked");

    if (this.elements.lockBadge) {
      this.elements.lockBadge.className = autoOn
        ? "status-pill status-ok"
        : "status-pill status-warning";
    }
  },

  updateDeviceText(device, autoOn) {
    if (!device.switch) return;

    const deviceOn = device.switch.checked;
    const statusText = autoOn ? "Auto" : (deviceOn ? "ON" : "OFF");
    const detailText = autoOn ? device.autoText : (deviceOn ? device.onText : device.offText);

    if (device.summary) {
      device.summary.textContent = statusText;
    }

    if (device.text) {
      device.text.textContent = detailText;
    }
  },

  collectPayload() {
    return {
      autoMode: this.elements.autoModeSwitch?.checked ?? true,
      bulbOn: this.devices.bulb.switch?.checked ?? false,
      fanOn: this.devices.fan.switch?.checked ?? false,
      turnerOn: this.devices.turner.switch?.checked ?? false,
      targetTemperature: this.parseNumber(
        this.elements.targetTemp?.value,
        37.8
      ),
      targetHumidity: this.parseNumber(
        this.elements.targetHumidity?.value,
        58
      ),
      turnIntervalMinutes: Number(this.elements.turnInterval?.value) || 120
    };
  },

  parseNumber(value, fallback) {
    const parsed = Number.parseFloat(String(value || "").replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : fallback;
  },

  formatTemperature(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed.toFixed(1) + this.degreeC : "37.8" + this.degreeC;
  },

  applyRemoteState(data, options = {}) {
    const control = data.control || {};
    const updateFields = options.updateFields === true;

    if (typeof control.autoMode === "boolean" && this.elements.autoModeSwitch) {
      this.elements.autoModeSwitch.checked = control.autoMode;
    }

    if (typeof control.bulbOn === "boolean" && this.devices.bulb.switch) {
      this.devices.bulb.switch.checked = control.bulbOn;
    }

    if (typeof control.fanOn === "boolean" && this.devices.fan.switch) {
      this.devices.fan.switch.checked = control.fanOn;
    }

    if (typeof control.turnerOn === "boolean" && this.devices.turner.switch) {
      this.devices.turner.switch.checked = control.turnerOn;
    }

    if (updateFields) {
      if (control.targetTemperature != null && this.elements.targetTemp) {
        this.elements.targetTemp.value = this.formatTemperature(control.targetTemperature);
      }

      if (control.targetHumidity != null && this.elements.targetHumidity) {
        this.elements.targetHumidity.value = Math.round(Number(control.targetHumidity)) + "%";
      }

      if (control.turnIntervalMinutes && this.elements.turnInterval) {
        this.elements.turnInterval.value = String(control.turnIntervalMinutes);
      }
    }

    HatchApp.setText("lastTurnValue", data.lastTurn || "None");
    HatchApp.setText("wifiStatus", data.wifiStatus || "Offline");

    this.updateControlState();
  },

  async loadControllerState(options = {}) {
    if (this.isSyncing || !window.HatchEspApi) {
      return;
    }

    try {
      const data = await HatchEspApi.getData();
      this.applyRemoteState(data, options);
      HatchApp.setText("settingsStatus", "Synced");
    } catch (error) {
      HatchApp.setText("wifiStatus", "Offline");
      HatchApp.setText("settingsStatus", "Waiting for ESP32");
    }
  },

  async syncControlSettings(successMessage) {
    if (!window.HatchEspApi) {
      HatchApp.setText("settingsStatus", "Local only");
      return;
    }

    this.isSyncing = true;
    HatchApp.setText("settingsStatus", "Saving...");

    try {
      const data = await HatchEspApi.updateControl(this.collectPayload());
      this.applyRemoteState(data, { updateFields: true });
      HatchApp.setText("settingsStatus", "Saved");

      if (successMessage) {
        window.HatchToast?.success(successMessage);
      }
    } catch (error) {
      HatchApp.setText("settingsStatus", "ESP32 not reachable");
      window.HatchToast?.warning("ESP32 not reachable. Check Wi-Fi and firmware upload.");
    } finally {
      this.isSyncing = false;
    }
  },

  async turnEggsNow() {
    if (!window.HatchEspApi) {
      HatchApp.setText("lastTurnValue", "Just now");
      HatchApp.setText("turnerText", "Manual egg turn completed");
      return;
    }

    this.isSyncing = true;
    HatchApp.setText("settingsStatus", "Turning...");

    try {
      const data = await HatchEspApi.turnEggsNow();
      this.applyRemoteState(data);
      HatchApp.setText("lastTurnValue", "Just now");
      HatchApp.setText("settingsStatus", "Saved");
      window.HatchToast?.success("Manual egg turn started.");
    } catch (error) {
      HatchApp.setText("settingsStatus", "ESP32 not reachable");
      window.HatchToast?.warning("Unable to reach the ESP32 turner endpoint.");
    } finally {
      this.isSyncing = false;
    }
  },

  saveSettings() {
    this.syncControlSettings("Control settings saved to ESP32.");
  }
};

document.addEventListener("DOMContentLoaded", () => {
  HatchControl.init();
});
