#include "IncubatorController.h"
#include "JsonBuilder.h"

IncubatorController::IncubatorController(
  DhtSensor& sensor,
  OutputDevice& heater,
  OutputDevice& bulb2,
  OutputDevice& fan,
  OutputDevice& turner,
  RealTimeClock& clock,
  DataLogger& logger,
  LcdStatusDisplay& display
) : _sensor(sensor),
    _heater(heater),
    _bulb2(bulb2),
    _fan(fan),
    _turner(turner),
    _clock(clock),
    _logger(logger),
    _display(display) {}

void IncubatorController::begin() {
  _startedMs = millis();
  _clock.begin();
  _logger.begin();
  _display.begin();
  _sensor.begin();
  _heater.begin();
  _bulb2.begin();
  _fan.begin();
  _turner.begin();
}

void IncubatorController::update() {
  const uint32_t nowMs = millis();

  readSensorIfDue(nowMs);
  updateOutputs(nowMs);
  refreshDisplayIfDue(nowMs);
}

void IncubatorController::setNetworkStatus(const String& status) {
  _networkStatus = status;
}

void IncubatorController::applySettings(const ControlSettings& settings) {
  _settings = settings;

  if (_settings.turnIntervalMinutes == 0) {
    _settings.turnIntervalMinutes = HatchConfig::DefaultTurnIntervalMinutes;
  }

  if (!_settings.autoMode) {
    _heater.set(_settings.heaterOn);
    _bulb2.set(_settings.bulb2On);
    _fan.set(_settings.fanOn);
    _turner.set(_settings.turnerOn);
  } else {
    _settings.bulb2On = _settings.heaterOn;
  }
}

void IncubatorController::triggerTurnCycle() {
  const uint32_t nowMs = millis();

  _turner.set(true);
  _turnerStopMs = nowMs + HatchConfig::TurnerPulseMs;
  _lastTurnMs = nowMs;
  _hasTurned = true;
}

ControlSettings IncubatorController::settings() const {
  ControlSettings current = _settings;
  current.heaterOn = _heater.isOn();
  current.bulb2On = _bulb2.isOn();
  current.fanOn = _fan.isOn();
  current.turnerOn = _turner.isOn();

  return current;
}

String IncubatorController::buildStatusJson(
  const String& wifiStatus,
  const String& ipAddress
) const {
  const bool valid = _currentReading.valid;
  const bool heatingOn = _heater.isOn() || _bulb2.isOn();
  const uint32_t nowMs = millis();
  const uint32_t nextTurnMs = nextTurnInMs(nowMs);

  String json = "{";
  json += "\"temperature\":";
  json += HatchJson::number(_currentReading.temperatureC, 1);
  json += ",";
  json += "\"humidity\":";
  json += HatchJson::number(_currentReading.humidityPercent, 0);
  json += ",";
  json += "\"relayStatus\":";
  json += HatchJson::quote(heatingOn ? "Heating ON" : "Heating OFF");
  json += ",";
  json += "\"relayBadge\":";
  json += HatchJson::quote(heatingOn ? "Bulbs Active" : "Bulbs Idle");
  json += ",";
  json += "\"relayOn\":";
  json += HatchJson::boolValue(heatingOn);
  json += ",";
  json += "\"motorStatus\":";
  json += HatchJson::quote(_turner.isOn() ? "Turning" : "Idle");
  json += ",";
  json += "\"motorNote\":";

  if (_turner.isOn()) {
    json += HatchJson::quote("Egg turn cycle is running");
  } else if (_settings.autoMode) {
    json += HatchJson::quote(String("Next egg turning in ") + formatDuration(nextTurnMs));
  } else {
    json += HatchJson::quote("Manual control mode");
  }

  json += ",";
  json += "\"predictedDay\":\"Training pending\",";
  json += "\"hatchDate\":\"Prediction skipped until dataset training is ready\",";
  json += "\"predictionStatus\":\"training_pending\",";
  json += "\"clockStatus\":";
  json += HatchJson::quote(_clock.statusText());
  json += ",";
  json += "\"rtcTime\":";
  json += HatchJson::quote(_clock.timestamp());
  json += ",";
  json += "\"sdStatus\":";
  json += HatchJson::quote(_logger.statusText());
  json += ",";
  json += "\"lcdStatus\":";
  json += HatchJson::quote(_display.statusText());
  json += ",";
  json += "\"lastUpdated\":";
  json += HatchJson::quote(_lastReadingTimestamp);
  json += ",";
  json += "\"summaryTemp\":";
  json += HatchJson::quote(temperatureSummary());
  json += ",";
  json += "\"summaryHumidity\":";
  json += HatchJson::quote(humiditySummary());
  json += ",";
  json += "\"summaryRelay\":";
  json += HatchJson::quote(_settings.autoMode ? "Automatic" : "Manual");
  json += ",";
  json += "\"summaryTurning\":";
  json += HatchJson::quote(_settings.autoMode ? "Enabled" : "Manual");
  json += ",";
  json += "\"lastTurn\":";
  json += HatchJson::quote(_hasTurned ? formatUptime(_lastTurnMs) : "None");
  json += ",";
  json += "\"lastAnomaly\":";
  json += HatchJson::quote(_lastAnomaly);
  json += ",";
  json += "\"sensorStatus\":";
  json += HatchJson::quote(valid ? "Connected" : "No reading");
  json += ",";
  json += "\"wifiStatus\":";
  json += HatchJson::quote(wifiStatus);
  json += ",";
  json += "\"ipAddress\":";
  json += HatchJson::quote(ipAddress);
  json += ",";
  json += "\"history\":";
  json += _history.toJson();
  json += ",";
  json += "\"control\":{";
  json += "\"autoMode\":";
  json += HatchJson::boolValue(_settings.autoMode);
  json += ",";
  json += "\"bulbOn\":";
  json += HatchJson::boolValue(heatingOn);
  json += ",";
  json += "\"bulb1On\":";
  json += HatchJson::boolValue(_heater.isOn());
  json += ",";
  json += "\"bulb2On\":";
  json += HatchJson::boolValue(_bulb2.isOn());
  json += ",";
  json += "\"fanOn\":";
  json += HatchJson::boolValue(_fan.isOn());
  json += ",";
  json += "\"turnerOn\":";
  json += HatchJson::boolValue(_turner.isOn());
  json += ",";
  json += "\"targetTemperature\":";
  json += HatchJson::number(_settings.targetTemperatureC, 1);
  json += ",";
  json += "\"targetHumidity\":";
  json += HatchJson::number(_settings.targetHumidityPercent, 0);
  json += ",";
  json += "\"turnIntervalMinutes\":";
  json += String(_settings.turnIntervalMinutes);
  json += "}}";

  return json;
}

bool IncubatorController::hasElapsed(
  uint32_t nowMs,
  uint32_t previousMs,
  uint32_t intervalMs
) const {
  return nowMs - previousMs >= intervalMs;
}

void IncubatorController::readSensorIfDue(uint32_t nowMs) {
  if (
    _hasReadSensor &&
    !hasElapsed(nowMs, _lastSensorReadMs, HatchConfig::SensorReadIntervalMs)
  ) {
    return;
  }

  _lastSensorReadMs = nowMs;
  _hasReadSensor = true;

  const SensorReading reading = _sensor.read();
  _lastReadingTimestamp = _clock.isReady() ? _clock.timestamp() : formatUptime(reading.timestampMs);

  if (reading.valid) {
    _currentReading = reading;
    _history.add(reading);
    _logger.logReading(
      _lastReadingTimestamp,
      reading,
      _settings,
      _heater.isOn(),
      _bulb2.isOn(),
      _fan.isOn(),
      _turner.isOn()
    );
    _lastAnomaly = "None";
    return;
  }

  _currentReading = reading;
  _lastAnomaly = reading.error;
}

void IncubatorController::updateOutputs(uint32_t nowMs) {
  updateTurnerPulse(nowMs);

  if (_settings.autoMode) {
    updateAutomaticOutputs();
    maybeStartScheduledTurn(nowMs);
  }
}

void IncubatorController::updateAutomaticOutputs() {
  if (!_currentReading.valid) {
    _heater.set(false);
    _bulb2.set(false);
    _fan.set(false);
    return;
  }

  const float temp = _currentReading.temperatureC;
  const float humidity = _currentReading.humidityPercent;
  const float targetTemp = _settings.targetTemperatureC;
  const float targetHumidity = _settings.targetHumidityPercent;

  if (temp < targetTemp - 0.3f) {
    _heater.set(true);
    _bulb2.set(true);
  } else if (temp > targetTemp + 0.3f) {
    _heater.set(false);
    _bulb2.set(false);
  }

  _fan.set(temp > targetTemp + 0.5f || humidity > targetHumidity + 5.0f);
}

void IncubatorController::updateTurnerPulse(uint32_t nowMs) {
  if (_turnerStopMs == 0) {
    return;
  }

  if (static_cast<int32_t>(nowMs - _turnerStopMs) < 0) {
    return;
  }

  _turnerStopMs = 0;
  _turner.set(_settings.autoMode ? false : _settings.turnerOn);
}

void IncubatorController::maybeStartScheduledTurn(uint32_t nowMs) {
  if (_turnerStopMs != 0) {
    return;
  }

  const uint32_t intervalMs =
    static_cast<uint32_t>(_settings.turnIntervalMinutes) * 60000UL;
  const uint32_t baseMs = _hasTurned ? _lastTurnMs : _startedMs;

  if (hasElapsed(nowMs, baseMs, intervalMs)) {
    triggerTurnCycle();
  }
}

void IncubatorController::refreshDisplayIfDue(uint32_t nowMs) {
  if (
    _lastDisplayRefreshMs != 0 &&
    !hasElapsed(nowMs, _lastDisplayRefreshMs, HatchConfig::LcdRefreshIntervalMs)
  ) {
    return;
  }

  _lastDisplayRefreshMs = nowMs;
  _display.showStatus(
    _currentReading,
    _settings,
    _clock.shortTime(),
    _networkStatus,
    _logger.isReady() ? "OK" : "ERR",
    _heater.isOn() || _bulb2.isOn(),
    _fan.isOn(),
    _turner.isOn()
  );
}

String IncubatorController::temperatureSummary() const {
  if (!_currentReading.valid) {
    return "No Data";
  }

  if (_currentReading.temperatureC < _settings.targetTemperatureC - 0.5f) {
    return "Low";
  }

  if (_currentReading.temperatureC > _settings.targetTemperatureC + 0.5f) {
    return "High";
  }

  return "Stable";
}

String IncubatorController::humiditySummary() const {
  if (!_currentReading.valid) {
    return "No Data";
  }

  if (_currentReading.humidityPercent < _settings.targetHumidityPercent - 5.0f) {
    return "Low";
  }

  if (_currentReading.humidityPercent > _settings.targetHumidityPercent + 5.0f) {
    return "High";
  }

  return "Normal";
}

String IncubatorController::formatDuration(uint32_t durationMs) const {
  uint32_t minutes = (durationMs + 59999UL) / 60000UL;

  if (minutes == 0) {
    return "less than 1 min";
  }

  const uint32_t hours = minutes / 60;
  minutes %= 60;

  if (hours == 0) {
    return String(minutes) + " min";
  }

  if (minutes == 0) {
    return String(hours) + " hr";
  }

  return String(hours) + " hr " + String(minutes) + " min";
}

String IncubatorController::formatUptime(uint32_t timestampMs) const {
  const uint32_t totalSeconds = timestampMs / 1000;
  const uint32_t hours = totalSeconds / 3600;
  const uint32_t minutes = (totalSeconds % 3600) / 60;
  const uint32_t seconds = totalSeconds % 60;

  char buffer[16];
  snprintf(
    buffer,
    sizeof(buffer),
    "%02lu:%02lu:%02lu",
    static_cast<unsigned long>(hours),
    static_cast<unsigned long>(minutes),
    static_cast<unsigned long>(seconds)
  );

  return String(buffer);
}

uint32_t IncubatorController::nextTurnInMs(uint32_t nowMs) const {
  const uint32_t intervalMs =
    static_cast<uint32_t>(_settings.turnIntervalMinutes) * 60000UL;
  const uint32_t baseMs = _hasTurned ? _lastTurnMs : _startedMs;
  const uint32_t elapsedMs = nowMs - baseMs;

  if (elapsedMs >= intervalMs) {
    return 0;
  }

  return intervalMs - elapsedMs;
}
