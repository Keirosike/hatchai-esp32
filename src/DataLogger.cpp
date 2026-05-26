#include "DataLogger.h"
#include <SD.h>
#include <SPI.h>
#include "Config.h"

DataLogger::DataLogger(uint8_t csPin, const char* logPath)
  : _csPin(csPin), _logPath(logPath) {}

void DataLogger::begin() {
  SPI.begin(
    HatchConfig::SdCardSckPin,
    HatchConfig::SdCardMisoPin,
    HatchConfig::SdCardMosiPin,
    _csPin
  );

  _ready = SD.begin(_csPin);

  if (!_ready) {
    Serial.println("SD card not detected");
    return;
  }

  writeHeaderIfNeeded();
  Serial.println("SD card logger ready");
}

bool DataLogger::isReady() const {
  return _ready;
}

String DataLogger::statusText() const {
  return _ready ? "Ready" : "Not detected";
}

void DataLogger::logReading(
  const String& timestamp,
  const SensorReading& reading,
  const ControlSettings& settings,
  bool bulb1On,
  bool bulb2On,
  bool fanOn,
  bool turnerOn
) {
  if (!_ready || !reading.valid) {
    return;
  }

  File file = SD.open(_logPath, FILE_APPEND);

  if (!file) {
    _ready = false;
    Serial.println("Failed to open SD log file");
    return;
  }

  file.print(timestamp);
  file.print(",");
  file.print(reading.temperatureC, 1);
  file.print(",");
  file.print(reading.humidityPercent, 1);
  file.print(",");
  file.print(settings.autoMode ? "auto" : "manual");
  file.print(",");
  file.print(bulb1On ? "on" : "off");
  file.print(",");
  file.print(bulb2On ? "on" : "off");
  file.print(",");
  file.print(fanOn ? "on" : "off");
  file.print(",");
  file.print(turnerOn ? "on" : "off");
  file.print(",");
  file.print(settings.targetTemperatureC, 1);
  file.print(",");
  file.print(settings.targetHumidityPercent, 1);
  file.print(",");
  file.println(settings.turnIntervalMinutes);
  file.close();
}

void DataLogger::writeHeaderIfNeeded() {
  if (SD.exists(_logPath)) {
    return;
  }

  File file = SD.open(_logPath, FILE_WRITE);

  if (!file) {
    _ready = false;
    return;
  }

  file.println(
    "timestamp,temperature_c,humidity_percent,mode,bulb1,bulb2,fan,turner,"
    "target_temperature_c,target_humidity_percent,turn_interval_minutes"
  );
  file.close();
}
