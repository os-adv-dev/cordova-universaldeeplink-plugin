//
//  UniversalDeeplink.swift
//
//  Created by Andre Grillo on 30/10/2024.
//

import Foundation

@objc(UniversalDeepLink)
class UniversalDeepLink: CDVPlugin {

    var callbackId: String?
    
    @objc(setUniversalLinkCallback:)
    func setUniversalLinkCallback(command: CDVInvokedUrlCommand) {
        callbackId = command.callbackId
        NotificationCenter.default.removeObserver(self, name: Notification.Name("UniversalLinkReceived"), object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(handleUniversalLink(notification:)), name: Notification.Name("UniversalLinkReceived"), object: nil)
        
        if let initialURL = UniversalLinkStorage.shared.storedUniversalLinkURL {
            processUniversalLink(initialURL)
            UniversalLinkStorage.shared.storedUniversalLinkURL = nil
        }
    }
    
    @objc
    func handleUniversalLink(notification: Notification) {
        if let url = notification.object as? URL {
            processUniversalLink(url)
        }
    }
    
    private func processUniversalLink(_ url: URL) {
        // Get all query parameters as a dictionary
        var jsonDict = url.queryParameters ?? [String: String]()
        jsonDict["url"] = url.absoluteString
        
        // Convert the dictionary to JSON data
        if let jsonData = try? JSONSerialization.data(withJSONObject: jsonDict, options: []),
           let jsonString = String(data: jsonData, encoding: .utf8) {
            print(jsonString)
            // Send the JSON string as a result back to Cordova
            let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: jsonString)
            pluginResult?.setKeepCallbackAs(true)
            UniversalLinkStorage.shared.storedUniversalLinkURL = nil
            self.commandDelegate.send(pluginResult, callbackId: self.callbackId)
        } else {
            // If JSON conversion fails, send an error message
            let errorResult = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: "Failed to parse query parameters.")
            UniversalLinkStorage.shared.storedUniversalLinkURL = nil
            self.commandDelegate.send(errorResult, callbackId: self.callbackId)
        }
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self, name: Notification.Name("UniversalLinkReceived"), object: nil)
        UniversalLinkStorage.shared.storedUniversalLinkURL = nil
    }
}

extension URL {
    var queryParameters: [String: String]? {
        guard let components = URLComponents(url: self, resolvingAgainstBaseURL: true),
              let queryItems = components.queryItems else {
            return nil
        }
        
        var params = [String: String]()
        for item in queryItems {
            params[item.name] = item.value
        }
        return params
    }
}
