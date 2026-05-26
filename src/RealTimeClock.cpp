#include "RealTimeClock.h"
#include <Wire.h>

RealTimeClock::RealTimeClock(uint8_t address) : _address(address) {}

void RealTimeClock::begin() {
  Wire.beginTransmission(_address);
  _ready = Wire.endTransmission() == 0;

  if (!_ready) {
    Serial.println("DS3231 not detected");
    return;
  }

  Wire.beginTransmission(_address);
  Wire.write(0x0F);

  if (Wire.endTransmission() != 0 || Wire.requestFrom(_address, static_cast<uint8_t>(1)) != 1) {
    _lostPower = false;
    return;
  }

  _lostPower = (Wire.read() & 0x80) != 0;

  if (_lostPower) {
    setToBuildTime();
    _lostPower = false;
  }

  Serial.println(_lostPower ? "DS3231 detected, time may need setting" : "DS3231 detected");
}

bool RealTimeClock::isReady() const {
  return _ready;
}

bool RealTimeClock::lostPower() const {
  return _lostPower;
}

String RealTimeClock::statusText() const {
  if (!_ready) {
    return "Not detected";
  }

  return _lostPower ? "Needs time set" : "Ready";
}

DateTimeValue RealTimeClock::now() const {
  DateTimeValue value;

  if (!_ready) {
    return value;
  }

  Wire.beginTransmission(_address);
  Wire.write(0x00);

  if (Wire.endTransmission() != 0) {
    return value;
  }

  if (Wire.requestFrom(_address, static_cast<uint8_t>(7)) != 7) {
    return value;
  }

  value.second = bcdToDecimal(Wire.read() & 0x7F);
  value.minute = bcdToDecimal(Wire.read() & 0x7F);
  value.hour = bcdToDecimal(Wire.read() & 0x3F);
  Wire.read();
  value.day = bcdToDecimal(Wire.read() & 0x3F);
  value.month = bcdToDecimal(Wire.read() & 0x1F);
  value.year = 2000 + bcdToDecimal(Wire.read());
  value.valid = true;

  return value;
}

String RealTimeClock::timestamp() const {
  const DateTimeValue value = now();

  if (!value.valid) {
    return "RTC unavailable";
  }

  return String(value.year) + "-" +
    twoDigits(value.month) + "-" +
    twoDigits(value.day) + " " +
    twoDigits(value.hour) + ":" +
    twoDigits(value.minute) + ":" +
    twoDigits(value.second);
}

String RealTimeClock::shortTime() const {
  const DateTimeValue value = now();

  if (!value.valid) {
    return "--:--";
  }

  return twoDigits(value.hour) + ":" + twoDigits(value.minute);
}

uint8_t RealTimeClock::bcdToDecimal(uint8_t value) const {
  return ((value / 16) * 10) + (value % 16);
}

uint8_t RealTimeClock::decimalToBcd(uint8_t value) const {
  return ((value / 10) << 4) | (value % 10);
}

uint8_t RealTimeClock::buildMonth() const {
  const String month = String(__DATE__).substring(0, 3);

  if (month == "Jan") return 1;
  if (month == "Feb") return 2;
  if (month == "Mar") return 3;
  if (month == "Apr") return 4;
  if (month == "May") return 5;
  if (month == "Jun") return 6;
  if (month == "Jul") return 7;
  if (month == "Aug") return 8;
  if (month == "Sep") return 9;
  if (month == "Oct") return 10;
  if (month == "Nov") return 11;
  if (month == "Dec") return 12;

  return 1;
}

void RealTimeClock::setDateTime(
  uint16_t year,
  uint8_t month,
  uint8_t day,
  uint8_t hour,
  uint8_t minute,
  uint8_t second
) {
  Wire.beginTransmission(_address);
  Wire.write(0x00);
  Wire.write(decimalToBcd(second));
  Wire.write(decimalToBcd(minute));
  Wire.write(decimalToBcd(hour));
  Wire.write(decimalToBcd(1));
  Wire.write(decimalToBcd(day));
  Wire.write(decimalToBcd(month));
  Wire.write(decimalToBcd(year >= 2000 ? year - 2000 : year));
  Wire.endTransmission();

  Wire.beginTransmission(_address);
  Wire.write(0x0F);
  Wire.write(0x00);
  Wire.endTransmission();
}

void RealTimeClock::setToBuildTime() {
  const String date = __DATE__;
  const String time = __TIME__;
  const uint16_t year = date.substring(7, 11).toInt();
  const uint8_t day = date.substring(4, 6).toInt();
  const uint8_t hour = time.substring(0, 2).toInt();
  const uint8_t minute = time.substring(3, 5).toInt();
  const uint8_t second = time.substring(6, 8).toInt();

  setDateTime(year, buildMonth(), day, hour, minute, second);
  Serial.println("DS3231 was reset to firmware build time");
}

String RealTimeClock::twoDigits(uint8_t value) const {
  if (value < 10) {
    return String("0") + String(value);
  }

  return String(value);
}
