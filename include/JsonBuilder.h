#pragma once

#include <Arduino.h>
#include <math.h>

namespace HatchJson {

inline String escape(const String& value) {
  String escaped;
  escaped.reserve(value.length() + 8);

  for (size_t i = 0; i < value.length(); i++) {
    const char c = value[i];

    if (c == '"') {
      escaped += "\\\"";
    } else if (c == '\\') {
      escaped += "\\\\";
    } else if (c == '\n') {
      escaped += "\\n";
    } else if (c == '\r') {
      escaped += "\\r";
    } else if (c == '\t') {
      escaped += "\\t";
    } else if (c >= 0 && c < 0x20) {
      continue;
    } else {
      escaped += c;
    }
  }

  return escaped;
}

inline String quote(const String& value) {
  return String("\"") + escape(value) + "\"";
}

inline String boolValue(bool value) {
  return value ? "true" : "false";
}

inline String number(float value, unsigned int decimals = 1) {
  if (isnan(value) || isinf(value)) {
    return "null";
  }

  return String(value, decimals);
}

}
