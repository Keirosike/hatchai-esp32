#include "NetworkManager.h"
#include <ESPmDNS.h>
#include <WiFi.h>
#include "Config.h"
#include "JsonBuilder.h"

void NetworkManager::begin() {
  if (!shouldUseStationMode()) {
    startAccessPoint();
    return;
  }

  WiFi.mode(WIFI_STA);
  WiFi.begin(HatchConfig::WifiSsid, HatchConfig::WifiPassword);

  Serial.print("Connecting to Wi-Fi");

  const uint32_t started = millis();

  while (WiFi.status() != WL_CONNECTED && millis() - started < 15000) {
    delay(250);
    Serial.print(".");
  }

  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    if (MDNS.begin("hatchai")) {
      MDNS.addService("http", "tcp", HatchConfig::WebServerPort);
    }

    Serial.print("HatchAI online at http://");
    Serial.println(WiFi.localIP());
    Serial.println("mDNS name: http://hatchai.local");
    return;
  }

  Serial.println("Wi-Fi connection failed. Starting access point instead.");
  startAccessPoint();
}

String NetworkManager::statusText() const {
  if (WiFi.getMode() == WIFI_AP || WiFi.getMode() == WIFI_AP_STA) {
    return "Access Point";
  }

  return WiFi.status() == WL_CONNECTED ? "Online" : "Offline";
}

String NetworkManager::ipAddress() const {
  if (WiFi.getMode() == WIFI_AP || WiFi.getMode() == WIFI_AP_STA) {
    return WiFi.softAPIP().toString();
  }

  if (WiFi.status() == WL_CONNECTED) {
    return WiFi.localIP().toString();
  }

  return "0.0.0.0";
}

String NetworkManager::scanNetworksJson() const {
  const int networkCount = WiFi.scanNetworks();

  if (networkCount <= 0) {
    return "[]";
  }

  String json = "[";

  for (int i = 0; i < networkCount; i++) {
    if (i > 0) {
      json += ",";
    }

    json += "{";
    json += "\"ssid\":";
    json += HatchJson::quote(WiFi.SSID(i));
    json += ",";
    json += "\"rssi\":";
    json += String(WiFi.RSSI(i));
    json += ",";
    json += "\"secure\":";
    json += HatchJson::boolValue(WiFi.encryptionType(i) != WIFI_AUTH_OPEN);
    json += "}";
  }

  WiFi.scanDelete();
  return json;
}

bool NetworkManager::shouldUseStationMode() const {
  const String ssid = HatchConfig::WifiSsid;

  return ssid.length() > 0 && !ssid.startsWith("YOUR_");
}

void NetworkManager::startAccessPoint() {
  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP(HatchConfig::AccessPointSsid, HatchConfig::AccessPointPassword);

  if (MDNS.begin("hatchai")) {
    MDNS.addService("http", "tcp", HatchConfig::WebServerPort);
  }

  Serial.print("HatchAI access point started: ");
  Serial.println(HatchConfig::AccessPointSsid);
  Serial.print("Open http://");
  Serial.println(WiFi.softAPIP());
}
