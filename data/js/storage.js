function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function loadData(key, fallback = null) {
  const saved = localStorage.getItem(key);

  if (!saved) {
    return fallback;
  }

  try {
    return JSON.parse(saved);
  } catch (error) {
    return fallback;
  }
}

function removeData(key) {
  localStorage.removeItem(key);
}

window.HatchStorage = {
  set: saveData,
  get: loadData,
  remove: removeData
};
