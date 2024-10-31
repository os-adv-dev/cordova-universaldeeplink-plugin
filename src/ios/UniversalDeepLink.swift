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
        let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: url.absoluteString)
        self.commandDelegate.send(pluginResult, callbackId: self.callbackId)
        self.callbackId = nil
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
