#pragma once

#include <Arduino.h>

struct DateTimeValue {
  uint16_t year = 2000;
  uint8_t month = 1;
  uint8_t day = 1;
  uint8_t hour = 0;
  uint8_t minute = 0;
  uint8_t second = 0;
  bool valid = false;
};

class RealTimeClock {
public:
  explicit RealTimeClock(uint8_t address);

  void begin();
  bool isReady() const;
  bool lostPower() const;
  String statusText() const;
  DateTimeValue now() const;
  String timestamp() const;
  String shortTime() const;

private:
  uint8_t bcdToDecimal(uint8_t value) const;
  uint8_t decimalToBcd(uint8_t value) const;
  uint8_t buildMonth() const;
  void setDateTime(
    uint16_t year,
    uint8_t month,
    uint8_t day,
    uint8_t hour,
    uint8_t minute,
    uint8_t second
  );
  void setToBuildTime();
  String twoDigits(uint8_t value) const;

  uint8_t _address;
  bool _ready = false;
  bool _lostPower = false;
};
