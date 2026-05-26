#pragma once

#include <Arduino.h>

class NetworkManager {
public:
  void begin();
  String statusText() const;
  String ipAddress() const;
  String scanNetworksJson() const;

private:
  bool shouldUseStationMode() const;
  void startAccessPoint();
};
