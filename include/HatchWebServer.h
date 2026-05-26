#pragma once

#include <Arduino.h>
#include <WebServer.h>
#include "IncubatorController.h"
#include "NetworkManager.h"

class HatchWebServer {
public:
  HatchWebServer(IncubatorController& controller, NetworkManager& network);

  void begin();
  void handleClient();

private:
  void registerRoutes();
  void handleApiData();
  void handleApiControl();
  void handleApiTurn();
  void handleWifiScan();
  void handleOptions();
  void handleStaticFile();
  void sendJson(const String& payload, int statusCode = 200);
  void sendNotFound();
  void addCorsHeaders();

  String contentTypeFor(const String& path) const;
  bool parseBoolArg(const String& name, bool fallback);
  float parseFloatArg(const String& name, float fallback);
  uint16_t parseMinutesArg(const String& name, uint16_t fallback);

  WebServer _server;
  IncubatorController& _controller;
  NetworkManager& _network;
};
