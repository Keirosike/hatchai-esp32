#pragma once

#include <Arduino.h>
#include "Config.h"

struct ControlSettings {
  bool autoMode = true;
  bool heaterOn = false;
  bool bulb2On = false;
  bool fanOn = false;
  bool turnerOn = false;
  float targetTemperatureC = HatchConfig::DefaultTargetTemperatureC;
  float targetHumidityPercent = HatchConfig::DefaultTargetHumidityPercent;
  uint16_t turnIntervalMinutes = HatchConfig::DefaultTurnIntervalMinutes;
};
