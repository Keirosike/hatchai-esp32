document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "hatchai_batches";

  const incubationDays = {
    Chicken: 21,
    Duck: 28,
    Quail: 17,
    Goose: 30
  };

  const defaultBatches = [
    {
      id: createId(),
      name: "Batch A-0426",
      type: "Chicken",
      count: 36,
      startDate: "2026-04-20",
      targetTemp: "37.8°C",
      targetHumidity: "58%",
      status: "Active",
      notes: "Check candling status on Day 14. Maintain stable humidity and automatic egg turning.",
      selected: true
    },
    {
      id: createId(),
      name: "Batch C-0326",
      type: "Chicken",
      count: 30,
      startDate: "2026-03-25",
      targetTemp: "37.8°C",
      targetHumidity: "58%",
      status: "Completed",
      notes: "Previous completed batch.",
      selected: false
    }
  ];

  let batches = loadBatches();

  const batchModal = document.getElementById("batchModal");
  const openBatchModal = document.getElementById("openBatchModal");
  const closeBatchModal = document.getElementById("closeBatchModal");
  const batchForm = document.getElementById("batchForm");
  const batchTableBody = document.getElementById("batchTableBody");

  const batchId = document.getElementById("batchId");
  const batchName = document.getElementById("batchName");
  const eggType = document.getElementById("eggType");
  const eggCount = document.getElementById("eggCount");
  const startDate = document.getElementById("startDate");
  const targetTemp = document.getElementById("targetTemp");
  const targetHumidity = document.getElementById("targetHumidity");
  const batchStatus = document.getElementById("batchStatus");
  const isSelected = document.getElementById("isSelected");
  const batchNotes = document.getElementById("batchNotes");
  const formStatus = document.getElementById("formStatus");
  const batchModalTitle = document.getElementById("batchModalTitle");
  const batchModalDescription = document.getElementById("batchModalDescription");
  const resetFormBtn = document.getElementById("resetFormBtn");
  const saveBatchBtn = document.getElementById("saveBatchBtn");

  function loadBatches() {
    const saved = loadData(STORAGE_KEY);

    if (!saved) {
      saveData(STORAGE_KEY, defaultBatches);
      return defaultBatches;
    }

    return saved;
  }

  function saveBatches() {
    saveData(STORAGE_KEY, batches);
  }

  function createId() {
    if (crypto.randomUUID) {
      return crypto.randomUUID();
    }

    return String(Date.now() + Math.random());
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
    const totalDays = incubationDays[batch.type] || 21;
    const started = new Date(batch.startDate + "T00:00:00");
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    if (Number.isNaN(started.getTime())) {
      return {
        hatchDate: "Not set",
        progress: 0,
        dayText: "Day 0 of " + totalDays,
        daysRemaining: "Start date missing"
      };
    }

    const hatch = new Date(started);
    hatch.setDate(started.getDate() + totalDays);

    const elapsedMs = today - started;
    const elapsedDays = Math.max(0, Math.floor(elapsedMs / 86400000));

    const progress = batch.status === "Completed"
      ? 100
      : Math.min(100, Math.round((elapsedDays / totalDays) * 100));

    const remaining = Math.max(0, totalDays - elapsedDays);

    return {
      hatchDate: formatDate(hatch.toISOString().slice(0, 10)),
      progress,
      dayText: "Day " + Math.min(elapsedDays, totalDays) + " of " + totalDays,
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

  function getSelectedBatch() {
    return batches.find(batch => batch.selected) ||
      batches.find(batch => batch.status === "Active") ||
      batches[0];
  }

  function renderTable() {
    batchTableBody.innerHTML = "";

    if (batches.length === 0) {
      batchTableBody.innerHTML = `
        <tr>
          <td colspan="8" class="empty-row">
            No batch records yet. Click Add Batch to create one.
          </td>
        </tr>
      `;
      return;
    }

    batches.forEach(batch => {
      const batchInfo = calculateBatch(batch);
      const row = document.createElement("tr");

      row.dataset.id = batch.id;

      if (batch.selected) {
        row.classList.add("selected-row");
      }

      row.innerHTML = `
        <td><strong>${batch.name}</strong></td>
        <td><span class="egg-type"><span class="egg-dot"></span>${batch.type}</span></td>
        <td>${batch.count}</td>
        <td>${formatDate(batch.startDate)}</td>
        <td>${batchInfo.hatchDate}</td>
        <td>${batchInfo.progress}%</td>
        <td><span class="status-pill ${getStatusClass(batch.status)}">${batch.status}</span></td>
        <td>
          <div class="table-actions">
            <button class="btn btn-primary btn-small" type="button" data-action="edit" data-id="${batch.id}">
              Edit
            </button>
            <button class="btn btn-danger btn-small" type="button" data-action="delete" data-id="${batch.id}">
              Delete
            </button>
          </div>
        </td>
      `;

      batchTableBody.appendChild(row);
    });
  }

  function renderSummary() {
    const selectedBatch = getSelectedBatch();
    const activeCount = batches.filter(batch => batch.status === "Active").length;

    document.getElementById("activeCountBadge").textContent = activeCount + " Active";

    if (!selectedBatch) {
      document.getElementById("currentBatchName").textContent = "No active batch";
      document.getElementById("currentBatchMeta").textContent = "Add a batch to start tracking incubation progress.";
      document.getElementById("progressBar").style.width = "0%";
      document.getElementById("progressPercent").textContent = "0% complete";
      document.getElementById("daysRemaining").textContent = "No batch selected";
      document.getElementById("summaryBatch").textContent = "None";
      document.getElementById("summaryType").textContent = "None";
      document.getElementById("summaryCount").textContent = "0 eggs";
      document.getElementById("summaryStarted").textContent = "Not set";
      document.getElementById("summaryHatch").textContent = "Not set";
      document.getElementById("summaryStatus").innerHTML = `<span class="status-pill status-warning">No Data</span>`;
      return;
    }

    const batchInfo = calculateBatch(selectedBatch);

    document.getElementById("currentBatchName").textContent = selectedBatch.name;
    document.getElementById("currentBatchMeta").textContent =
      `${selectedBatch.type} eggs • ${batchInfo.dayText} • Started ${formatDate(selectedBatch.startDate)}`;

    document.getElementById("progressBar").style.width = batchInfo.progress + "%";
    document.getElementById("progressPercent").textContent = batchInfo.progress + "% complete";
    document.getElementById("daysRemaining").textContent = batchInfo.daysRemaining;

    document.getElementById("summaryBatch").textContent = selectedBatch.name;
    document.getElementById("summaryType").textContent = selectedBatch.type;
    document.getElementById("summaryCount").textContent = selectedBatch.count + " eggs";
    document.getElementById("summaryStarted").textContent = formatDate(selectedBatch.startDate);
    document.getElementById("summaryHatch").textContent = batchInfo.hatchDate;
    document.getElementById("summaryStatus").innerHTML =
      `<span class="status-pill ${getStatusClass(selectedBatch.status)}">${selectedBatch.status}</span>`;
  }

  function renderApp() {
    renderTable();
    renderSummary();
  }

  function openModal(mode = "add") {
    batchModal.classList.add("active");
    batchModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    if (mode === "add") {
      batchModalTitle.textContent = "Add Batch";
      batchModalDescription.textContent = "Enter the details for the new incubator batch.";
      formStatus.textContent = "Ready";
      formStatus.className = "status-pill status-ok";
    }
  }

  function closeModal() {
    batchModal.classList.remove("active");
    batchModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function setFormDisabled(disabled) {
    [
      batchName,
      eggType,
      eggCount,
      startDate,
      targetTemp,
      targetHumidity,
      batchStatus,
      isSelected,
      batchNotes
    ].forEach(input => {
      input.disabled = disabled;
    });

    saveBatchBtn.style.display = disabled ? "none" : "inline-flex";
    resetFormBtn.style.display = disabled ? "none" : "inline-flex";
  }

  function fillForm(batch) {
    batchId.value = batch.id;
    batchName.value = batch.name;
    eggType.value = batch.type;
    eggCount.value = batch.count;
    startDate.value = batch.startDate;
    targetTemp.value = batch.targetTemp;
    targetHumidity.value = batch.targetHumidity;
    batchStatus.value = batch.status;
    isSelected.value = batch.selected ? "yes" : "no";
    batchNotes.value = batch.notes || "";
  }

  function clearForm() {
    setFormDisabled(false);
    batchForm.reset();

    batchId.value = "";
    batchName.value = "";
    eggType.value = "Chicken";
    eggCount.value = "";
    startDate.value = new Date().toISOString().slice(0, 10);
    targetTemp.value = "37.8°C";
    targetHumidity.value = "58%";
    batchStatus.value = "Active";
    isSelected.value = "yes";
    batchNotes.value = "";
    formStatus.textContent = "Ready";
    formStatus.className = "status-pill status-ok";
  }

  function getFormData() {
    return {
      id: batchId.value || createId(),
      name: batchName.value.trim(),
      type: eggType.value,
      count: Number(eggCount.value),
      startDate: startDate.value,
      targetTemp: targetTemp.value.trim(),
      targetHumidity: targetHumidity.value.trim(),
      status: batchStatus.value,
      selected: isSelected.value === "yes",
      notes: batchNotes.value.trim()
    };
  }

  function validateBatch(batch) {
    if (!batch.name) {
      return "Batch name is required.";
    }

    if (!batch.count || batch.count < 1) {
      return "Egg count must be at least 1.";
    }

    if (!batch.startDate) {
      return "Start date is required.";
    }

    return "";
  }

  function saveBatch(batch) {
    const isUpdate = batches.some(item => item.id === batch.id);

    if (batch.selected) {
      batches = batches.map(item => ({ ...item, selected: false }));
    }

    const existingIndex = batches.findIndex(item => item.id === batch.id);

    if (existingIndex >= 0) {
      batches[existingIndex] = batch;
    } else {
      batches.unshift(batch);
    }

    saveBatches();
    renderApp();

    return isUpdate;
  }

  function selectBatch(id) {
    batches = batches.map(batch => ({
      ...batch,
      selected: batch.id === id
    }));

    saveBatches();
    renderApp();
  }

  function viewBatch(id) {
    const batch = batches.find(item => item.id === id);

    if (!batch) {
      return;
    }

    selectBatch(id);
    fillForm({ ...batch, selected: true });
    setFormDisabled(true);

    batchModalTitle.textContent = "View Batch";
    batchModalDescription.textContent = "Viewing this batch record. Click Edit in the table to update it.";
    formStatus.textContent = "Viewing";
    formStatus.className = "status-pill status-ok";

    openModal("view");
  }

  function editBatch(id) {
    const batch = batches.find(item => item.id === id);

    if (!batch) {
      return;
    }

    batchModalTitle.textContent = "Edit Batch";
    batchModalDescription.textContent = "Update the selected batch details.";
    formStatus.textContent = "Editing";
    formStatus.className = "status-pill status-warning";

    fillForm(batch);
    setFormDisabled(false);

    openModal("edit");
  }

  function deleteBatch(id) {
    const batch = batches.find(item => item.id === id);

    if (!batch) {
      return;
    }

    window.HatchModal.open({
      title: "Delete batch?",
      message: `Delete "${batch.name}" from your incubator batch records? This action cannot be undone.`,
      confirmText: "Delete Batch",
      cancelText: "Cancel",
      confirmClass: "modal-btn-danger",
      onConfirm: () => {
        batches = batches.filter(item => item.id !== id);

        if (batches.length > 0 && !batches.some(item => item.selected)) {
          batches[0].selected = true;
        }

        saveBatches();
        renderApp();
        window.HatchToast.success("Batch deleted.");
      }
    });
  }

  batchTableBody.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");

    if (button) {
      const action = button.dataset.action;
      const id = button.dataset.id;

      if (action === "edit") {
        editBatch(id);
      }

      if (action === "delete") {
        deleteBatch(id);
      }

      return;
    }

    const row = event.target.closest("tr[data-id]");

    if (!row) {
      return;
    }

    viewBatch(row.dataset.id);
  });

  openBatchModal.addEventListener("click", () => {
    clearForm();
    openModal("add");
  });

  closeBatchModal.addEventListener("click", closeModal);

  batchModal.addEventListener("click", event => {
    if (event.target === batchModal) {
      closeModal();
    }
  });

  window.addEventListener("keydown", event => {
    if (event.key === "Escape" && batchModal.classList.contains("active")) {
      closeModal();
    }
  });

  resetFormBtn.addEventListener("click", () => {
    clearForm();
    formStatus.textContent = "Reset";
    formStatus.className = "status-pill status-warning";
  });

  batchForm.addEventListener("submit", event => {
    event.preventDefault();

    const batch = getFormData();
    const error = validateBatch(batch);

    if (error) {
      formStatus.textContent = error;
      formStatus.className = "status-pill status-alert";
      window.HatchToast.warning(error);
      return;
    }

    const isUpdate = batches.some(item => item.id === batch.id);

    window.HatchModal.open({
      title: isUpdate ? "Save batch changes?" : "Save new batch?",
      message: `Save "${batch.name}" to your incubator batch records?`,
      confirmText: "Save Batch",
      cancelText: "Cancel",
      confirmClass: "modal-btn-primary",
      onConfirm: () => {
        saveBatch(batch);
        formStatus.textContent = "Saved";
        formStatus.className = "status-pill status-ok";
        closeModal();
        clearForm();
        window.HatchToast.success(isUpdate ? "Batch changes saved." : "Batch saved.");
      }
    });
  });

  renderApp();
});
