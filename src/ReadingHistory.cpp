#include "ReadingHistory.h"
#include "JsonBuilder.h"

void ReadingHistory::add(const SensorReading& reading) {
  if (!reading.valid) {
    return;
  }

  HistoryPoint point;
  point.temperatureC = reading.temperatureC;
  point.humidityPercent = reading.humidityPercent;
  point.timestampMs = reading.timestampMs;

  _points[_nextIndex] = point;

  _nextIndex = (_nextIndex + 1) % Capacity;

  if (_count < Capacity) {
    _count++;
  }
}

String ReadingHistory::toJson() const {
  String json = "{";
  appendWindow(json, "hour", 12);
  json += ",";
  appendWindow(json, "day", 24);
  json += ",";
  appendWindow(json, "week", 32);
  json += ",";
  appendWindow(json, "month", 48);
  json += "}";

  return json;
}

ReadingHistory::HistoryPoint ReadingHistory::pointAt(size_t logicalIndex) const {
  const size_t oldestIndex = (_nextIndex + Capacity - _count) % Capacity;
  const size_t physicalIndex = (oldestIndex + logicalIndex) % Capacity;
  return _points[physicalIndex];
}

void ReadingHistory::appendWindow(String& json, const char* name, size_t maxPoints) const {
  const uint32_t nowMs = millis();
  const size_t pointsToWrite = _count < maxPoints ? _count : maxPoints;
  const size_t firstPoint = _count > pointsToWrite ? _count - pointsToWrite : 0;

  json += HatchJson::quote(name);
  json += ":{\"labels\":[";

  for (size_t i = 0; i < pointsToWrite; i++) {
    if (i > 0) {
      json += ",";
    }

    json += HatchJson::quote(labelFor(pointAt(firstPoint + i).timestampMs, nowMs));
  }

  json += "],\"temperature\":[";

  for (size_t i = 0; i < pointsToWrite; i++) {
    if (i > 0) {
      json += ",";
    }

    json += HatchJson::number(pointAt(firstPoint + i).temperatureC, 1);
  }

  json += "],\"humidity\":[";

  for (size_t i = 0; i < pointsToWrite; i++) {
    if (i > 0) {
      json += ",";
    }

    json += HatchJson::number(pointAt(firstPoint + i).humidityPercent, 0);
  }

  json += "]}";
}

String ReadingHistory::labelFor(uint32_t timestampMs, uint32_t nowMs) const {
  const uint32_t ageMs = nowMs - timestampMs;

  if (ageMs < 1500) {
    return "now";
  }

  const uint32_t seconds = ageMs / 1000;

  if (seconds < 60) {
    return String("-") + String(seconds) + "s";
  }

  const uint32_t minutes = seconds / 60;

  if (minutes < 60) {
    return String("-") + String(minutes) + "m";
  }

  return String("-") + String(minutes / 60) + "h";
}
