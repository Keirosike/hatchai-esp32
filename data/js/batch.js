document.addEventListener("DOMContentLoaded", () => {
  const BatchStore = window.HatchBatchStore;
  let batches = BatchStore.loadBatches();

  const batchModal = document.getElementById("batchModal");
  const openBatchModal = document.getElementById("openBatchModal");
  const closeBatchModal = document.getElementById("closeBatchModal");
  const batchForm = document.getElementById("batchForm");
  const batchTableBody = document.getElementById("batchTableBody");

  const batchId = document.getElementById("batchId");
  const batchName = document.getElementById("batchName");
  const eggType = document.getElementById("eggType");
  const eggCount = document.getElementById("eggCount");
  const laidDate = document.getElementById("laidDate");
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

  function saveBatches() {
    BatchStore.saveBatches(batches);
  }

  function formatDate(dateInput) {
    return BatchStore.formatDate(dateInput);
  }

  function calculateBatch(batch) {
    return BatchStore.calculateBatch(batch);
  }

  function getStatusClass(status) {
    return BatchStore.getStatusClass(status);
  }

  function getSelectedBatch() {
    return BatchStore.getSelectedBatch(batches);
  }

  function getGeneratedBatchName() {
    return BatchStore.getNextBatchName(batches);
  }

  function renderTable() {
    batchTableBody.innerHTML = "";

    if (batches.length === 0) {
      batchTableBody.innerHTML = `
        <tr>
          <td colspan="9" class="empty-row">
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
        <td>${formatDate(batch.laidDate)}</td>
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
      document.getElementById("summaryLaid").textContent = "Not set";
      document.getElementById("summaryStarted").textContent = "Not set";
      document.getElementById("summaryHatch").textContent = "Not set";
      document.getElementById("summaryStatus").innerHTML = `<span class="status-pill status-warning">No Data</span>`;
      return;
    }

    const batchInfo = calculateBatch(selectedBatch);

    document.getElementById("currentBatchName").textContent = selectedBatch.name;
    document.getElementById("currentBatchMeta").textContent =
      `${selectedBatch.type} eggs - ${batchInfo.dayText} - Laid ${formatDate(selectedBatch.laidDate)} - Started ${formatDate(selectedBatch.startDate)}`;
    document.getElementById("progressBar").style.width = batchInfo.progress + "%";
    document.getElementById("progressPercent").textContent = batchInfo.progress + "% complete";
    document.getElementById("daysRemaining").textContent = batchInfo.daysRemaining;

    document.getElementById("summaryBatch").textContent = selectedBatch.name;
    document.getElementById("summaryType").textContent = selectedBatch.type;
    document.getElementById("summaryCount").textContent = selectedBatch.count + " eggs";
    document.getElementById("summaryLaid").textContent = formatDate(selectedBatch.laidDate);
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
      eggType,
      eggCount,
      laidDate,
      startDate,
      targetTemp,
      targetHumidity,
      batchStatus,
      isSelected,
      batchNotes
    ].forEach(input => {
      input.disabled = disabled;
    });

    batchName.disabled = disabled;
    batchName.readOnly = true;
    saveBatchBtn.style.display = disabled ? "none" : "inline-flex";
    resetFormBtn.style.display = disabled ? "none" : "inline-flex";
  }

  function fillForm(batch) {
    batchId.value = batch.id;
    batchName.value = batch.name;
    batchName.readOnly = true;
    eggType.value = "Chicken";
    eggCount.value = batch.count;
    laidDate.value = batch.laidDate || "";
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
    batchName.value = getGeneratedBatchName();
    batchName.readOnly = true;
    eggType.value = "Chicken";
    eggCount.value = "";
    laidDate.value = new Date().toISOString().slice(0, 10);
    startDate.value = new Date().toISOString().slice(0, 10);
    targetTemp.value = "37.8\u00B0C";
    targetHumidity.value = "58%";
    batchStatus.value = "Active";
    isSelected.value = "yes";
    batchNotes.value = "";
    formStatus.textContent = "Ready";
    formStatus.className = "status-pill status-ok";
  }

  function getFormData() {
    return {
      id: batchId.value || BatchStore.createId(),
      name: batchName.value.trim() || getGeneratedBatchName(),
      type: "Chicken",
      count: Number(eggCount.value),
      laidDate: laidDate.value,
      startDate: startDate.value,
      targetTemp: targetTemp.value.trim(),
      targetHumidity: targetHumidity.value.trim(),
      status: batchStatus.value,
      selected: isSelected.value === "yes",
      notes: batchNotes.value.trim()
    };
  }

  function validateBatch(batch) {
    if (!batch.count || batch.count < 1) {
      return "Egg count must be at least 1.";
    }

    if (!batch.laidDate) {
      return "Egg laid date is required.";
    }

    if (!batch.startDate) {
      return "Start date is required.";
    }

    if (batch.laidDate > batch.startDate) {
      return "Egg laid date cannot be after the incubation start date.";
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
    batches = BatchStore.loadBatches();
    renderApp();

    return isUpdate;
  }

  function selectBatch(id) {
    batches = batches.map(batch => ({
      ...batch,
      selected: batch.id === id
    }));

    saveBatches();
    batches = BatchStore.loadBatches();
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
    batchModalDescription.textContent = "Update the selected batch details. The generated batch name stays fixed.";
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
        batches = BatchStore.loadBatches();
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
