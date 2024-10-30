//
//  UniversalDeeplink.swift
//
//  Created by Andre Grillo on 30/10/2024.
//

import Foundation
import UIKit

@objc(UniversalDeepLink)
class UniversalDeepLink: NSObject {

    var callbackId: String?
    
    @obj(setUniversalLinkCallback:)
    func setUniversalLinkCallback(command: CDVInvokedUrlCommand) {

        callbackId = command.callbackId
        
        // Add observer for Universal Links received while the app is running
        NotificationCenter.default.addObserver(self, selector: #selector(handleUniversalLink(notification:)), name: Notification.Name("UniversalLinkReceived"), object: nil)
        
        // Check if there is a stored Universal Link from app launch and handle it if present
        if let initialURL = UniversalLinkStorage.shared.storedUniversalLinkURL {
            processUniversalLink(initialURL)
            // Clear the stored URL after handling it to avoid duplicate handling
            UniversalLinkStorage.shared.storedUniversalLinkURL = nil
        }
    }
    
    @objc 
    func handleUniversalLink(notification: Notification) {
        // Handle the Universal Link received while the app is running
        if let url = notification.object as? URL {
            processUniversalLink(url)
        }
    }
    
    private func processUniversalLink(_ url: URL) {
        // Logic to handle the Universal Link
        print("Universal Link received: \(url.absoluteString)")
        
        // Extracting a token from the URL's query parameters
        if let token = url.queryParameters?["token"] {
            print("Token from Universal Link: \(token)")
            // Use the token or pass it to your app logic as needed
        }

        //MARK: TODO - Ajustar o que será devolvido (messageAs)
        let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: token)
        self.commandDelegate.send(pluginResult, callbackId: self.callbackId)
        self.callbackId = nil
    }
    
    deinit {
        // Remove observer on deinitialization
        NotificationCenter.default.removeObserver(self, name: Notification.Name("UniversalLinkReceived"), object: nil)
        UniversalLinkStorage.shared.storedUniversalLinkURL = nil
    }
}

// URL extension for query parameter extraction
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