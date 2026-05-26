#include "HatchWebServer.h"
#include <FS.h>
#include <SPIFFS.h>

HatchWebServer::HatchWebServer(
  IncubatorController& controller,
  NetworkManager& network
) : _server(HatchConfig::WebServerPort), _controller(controller), _network(network) {}

void HatchWebServer::begin() {
  registerRoutes();
  _server.begin();
  Serial.println("HTTP server started");
}

void HatchWebServer::handleClient() {
  _server.handleClient();
}

void HatchWebServer::registerRoutes() {
  _server.on("/api/data", HTTP_GET, [this]() { handleApiData(); });
  _server.on("/api/control", HTTP_POST, [this]() { handleApiControl(); });
  _server.on("/api/control", HTTP_OPTIONS, [this]() { handleOptions(); });
  _server.on("/api/turn", HTTP_POST, [this]() { handleApiTurn(); });
  _server.on("/api/turn", HTTP_OPTIONS, [this]() { handleOptions(); });
  _server.on("/scan-wifi", HTTP_GET, [this]() { handleWifiScan(); });
  _server.on("/scan-wifi", HTTP_OPTIONS, [this]() { handleOptions(); });
  _server.on("/api/wifi/scan", HTTP_GET, [this]() { handleWifiScan(); });
  _server.on("/api/wifi/scan", HTTP_OPTIONS, [this]() { handleOptions(); });
  _server.onNotFound([this]() { handleStaticFile(); });
}

void HatchWebServer::handleApiData() {
  sendJson(_controller.buildStatusJson(_network.statusText(), _network.ipAddress()));
}

void HatchWebServer::handleApiControl() {
  ControlSettings settings = _controller.settings();

  settings.autoMode = parseBoolArg("autoMode", settings.autoMode);
  settings.heaterOn = parseBoolArg("bulbOn", settings.heaterOn);
  settings.bulb2On = parseBoolArg("bulb2On", settings.heaterOn);
  settings.bulb2On = parseBoolArg("auxiliaryOn", settings.bulb2On);
  settings.fanOn = parseBoolArg("fanOn", settings.fanOn);
  settings.turnerOn = parseBoolArg("turnerOn", settings.turnerOn);
  settings.targetTemperatureC =
    parseFloatArg("targetTemperature", settings.targetTemperatureC);
  settings.targetHumidityPercent =
    parseFloatArg("targetHumidity", settings.targetHumidityPercent);
  settings.turnIntervalMinutes =
    parseMinutesArg("turnIntervalMinutes", settings.turnIntervalMinutes);

  _controller.applySettings(settings);
  sendJson(_controller.buildStatusJson(_network.statusText(), _network.ipAddress()));
}

void HatchWebServer::handleApiTurn() {
  _controller.triggerTurnCycle();
  sendJson(_controller.buildStatusJson(_network.statusText(), _network.ipAddress()));
}

void HatchWebServer::handleWifiScan() {
  sendJson(_network.scanNetworksJson());
}

void HatchWebServer::handleOptions() {
  addCorsHeaders();
  _server.send(204);
}

void HatchWebServer::handleStaticFile() {
  String path = _server.uri();

  if (path == "/") {
    path = "/dashboard.html";
  }

  if (path.endsWith("/")) {
    path += "dashboard.html";
  }

  if (!SPIFFS.exists(path)) {
    sendNotFound();
    return;
  }

  File file = SPIFFS.open(path, "r");

  if (!file) {
    sendNotFound();
    return;
  }

  _server.streamFile(file, contentTypeFor(path));
  file.close();
}

void HatchWebServer::sendJson(const String& payload, int statusCode) {
  addCorsHeaders();
  _server.sendHeader("Cache-Control", "no-store");
  _server.send(statusCode, "application/json", payload);
}

void HatchWebServer::sendNotFound() {
  addCorsHeaders();
  _server.send(404, "text/plain", "Not found");
}

void HatchWebServer::addCorsHeaders() {
  _server.sendHeader("Access-Control-Allow-Origin", "*");
  _server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  _server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

String HatchWebServer::contentTypeFor(const String& path) const {
  if (path.endsWith(".html")) {
    return "text/html";
  }

  if (path.endsWith(".css")) {
    return "text/css";
  }

  if (path.endsWith(".js")) {
    return "application/javascript";
  }

  if (path.endsWith(".svg")) {
    return "image/svg+xml";
  }

  if (path.endsWith(".webp")) {
    return "image/webp";
  }

  if (path.endsWith(".woff2")) {
    return "font/woff2";
  }

  return "text/plain";
}

bool HatchWebServer::parseBoolArg(const String& name, bool fallback) {
  if (!_server.hasArg(name)) {
    return fallback;
  }

  String value = _server.arg(name);
  value.toLowerCase();

  return value == "1" || value == "true" || value == "on" || value == "yes";
}

float HatchWebServer::parseFloatArg(const String& name, float fallback) {
  if (!_server.hasArg(name)) {
    return fallback;
  }

  return _server.arg(name).toFloat();
}

uint16_t HatchWebServer::parseMinutesArg(
  const String& name,
  uint16_t fallback
) {
  if (!_server.hasArg(name)) {
    return fallback;
  }

  const int minutes = _server.arg(name).toInt();

  if (minutes <= 0) {
    return fallback;
  }

  return static_cast<uint16_t>(minutes);
}
