#include "OutputDevice.h"

OutputDevice::OutputDevice(uint8_t pin, bool activeHigh, const char* name)
  : _pin(pin), _activeHigh(activeHigh), _name(name) {}

void OutputDevice::begin() {
  pinMode(_pin, OUTPUT);
  set(false);
}

void OutputDevice::set(bool on) {
  _on = on;
  digitalWrite(_pin, outputLevel(on));
}

bool OutputDevice::isOn() const {
  return _on;
}

const char* OutputDevice::name() const {
  return _name;
}

uint8_t OutputDevice::outputLevel(bool on) const {
  const bool high = _activeHigh ? on : !on;
  return high ? HIGH : LOW;
}
