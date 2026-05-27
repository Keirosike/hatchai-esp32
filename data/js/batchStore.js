const HatchBatchStore = (() => {
  const STORAGE_KEY = "hatchai_batches";
  const CHICKEN_INCUBATION_DAYS = 21;
  const BATCH_NAME_PREFIX = "Chicken Batch ";

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    return String(Date.now() + Math.random());
  }

  function todayIso() {
    return new Date().toISOString().slice(0, 10);
  }

  function getDefaultBatches() {
    return [
      {
        id: createId(),
        name: "Chicken Batch 001",
        type: "Chicken",
        count: 36,
        laidDate: "2026-04-18",
        startDate: "2026-04-20",
        targetTemp: "37.8\u00B0C",
        targetHumidity: "58%",
        status: "Active",
        notes: "Check candling status on Day 14. Maintain stable humidity and automatic egg turning.",
        selected: true
      },
      {
        id: createId(),
        name: "Chicken Batch 002",
        type: "Chicken",
        count: 30,
        laidDate: "2026-03-23",
        startDate: "2026-03-25",
        targetTemp: "37.8\u00B0C",
        targetHumidity: "58%",
        status: "Completed",
        notes: "Previous completed batch.",
        selected: false
      }
    ];
  }

  function normalizeBatch(batch) {
    return {
      id: batch.id || createId(),
      name: batch.name || "Chicken Batch",
      type: "Chicken",
      count: Number(batch.count) || 0,
      laidDate: batch.laidDate || batch.layDate || "",
      startDate: batch.startDate || todayIso(),
      targetTemp: batch.targetTemp || "37.8\u00B0C",
      targetHumidity: batch.targetHumidity || "58%",
      status: batch.status || "Active",
      notes: batch.notes || "",
      selected: Boolean(batch.selected)
    };
  }

  function normalizeBatches(records) {
    let selectedFound = false;
    const batches = Array.isArray(records)
      ? records.map(normalizeBatch).filter(batch => batch.count > 0)
      : [];

    batches.forEach(batch => {
      if (batch.selected && !selectedFound) {
        selectedFound = true;
        return;
      }

      batch.selected = false;
    });

    if (batches.length > 0 && !batches.some(batch => batch.selected)) {
      batches[0].selected = true;
    }

    return batches;
  }

  function getBatchNumber(name) {
    const match = String(name || "").match(/^Chicken Batch\s+(\d+)$/i);
    return match ? Number(match[1]) : 0;
  }

  function getNextBatchName(batches) {
    const maxBatchNumber = Array.isArray(batches)
      ? batches.reduce((max, batch) => Math.max(max, getBatchNumber(batch.name)), 0)
      : 0;

    return BATCH_NAME_PREFIX + String(maxBatchNumber + 1).padStart(3, "0");
  }

  function loadBatches() {
    const saved = loadData(STORAGE_KEY);
    const batches = normalizeBatches(saved);

    if (batches.length > 0) {
      saveBatches(batches);
      return batches;
    }

    const defaults = getDefaultBatches();
    saveBatches(defaults);
    return defaults;
  }

  function saveBatches(batches) {
    saveData(STORAGE_KEY, normalizeBatches(batches));
  }

  function formatDate(dateInput) {
    const date = new Date(dateInput + "T00:00:00");

    if (Number.isNaN(date.getTime())) {
      return "Not set";
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric"
    });
  }

  function calculateBatch(batch) {
    const started = new Date(batch.startDate + "T00:00:00");
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    if (Number.isNaN(started.getTime())) {
      return {
        hatchDate: "Not set",
        progress: 0,
        dayText: "Day 0 of " + CHICKEN_INCUBATION_DAYS,
        daysRemaining: "Start date missing"
      };
    }

    const hatch = new Date(started);
    hatch.setDate(started.getDate() + CHICKEN_INCUBATION_DAYS);

    const elapsedMs = today - started;
    const elapsedDays = Math.max(0, Math.floor(elapsedMs / 86400000));
    const progress = batch.status === "Completed"
      ? 100
      : Math.min(100, Math.round((elapsedDays / CHICKEN_INCUBATION_DAYS) * 100));
    const remaining = Math.max(0, CHICKEN_INCUBATION_DAYS - elapsedDays);

    return {
      hatchDate: formatDate(hatch.toISOString().slice(0, 10)),
      progress,
      dayText: "Day " + Math.min(elapsedDays, CHICKEN_INCUBATION_DAYS) + " of " + CHICKEN_INCUBATION_DAYS,
      daysRemaining: remaining === 0 ? "Hatch due" : remaining + " days left"
    };
  }

  function getStatusClass(status) {
    if (status === "Active" || status === "Completed") {
      return "status-ok";
    }

    if (status === "Paused") {
      return "status-warning";
    }

    return "status-alert";
  }

  function getSelectedBatch(batches) {
    return batches.find(batch => batch.selected) ||
      batches.find(batch => batch.status === "Active") ||
      batches[0] ||
      null;
  }

  return {
    STORAGE_KEY,
    CHICKEN_INCUBATION_DAYS,
    createId,
    todayIso,
    getNextBatchName,
    loadBatches,
    saveBatches,
    formatDate,
    calculateBatch,
    getStatusClass,
    getSelectedBatch
  };
})();

window.HatchBatchStore = HatchBatchStore;
