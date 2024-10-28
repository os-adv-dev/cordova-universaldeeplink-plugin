import Foundation
import UIKit

@objc(UniversalDeeplink)
class UniversalDeepLink: CDVPlugin {
    
    private var callbackId: String?
    
    override func pluginInitialize() {
        super.pluginInitialize()
        NotificationCenter.default.addObserver(self, selector: #selector(handleOpenURL), name: Notification.Name.CDVPluginHandleOpenURL, object: nil)
    }
    
    @objc func handleOpenURL(notification: Notification) {
        if let url = notification.object as? URL {
            processUniversalLink(url)
            let alert = UIAlertController(title: nil, message: "Universal Link triggered!", preferredStyle: .alert)
            DispatchQueue.main.async {
                self.viewController.present(alert, animated: true) {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                        alert.dismiss(animated: true, completion: nil)
                    }
                }
            }
        }
    }
    
    @objc 
    func getUniversalDeeplinkData(_ command: CDVInvokedUrlCommand) {
        callbackId = command.callbackId
        if let url = UIApplication.shared.delegate?.window??.rootViewController?.presentedViewController as? UIViewController {
            processUniversalLink(url)
        }
        
        let pluginResult = CDVPluginResult(status: CDVCommandStatus_NO_RESULT)
        pluginResult?.setKeepCallbackAs(true)
        commandDelegate.send(pluginResult, callbackId: callbackId)
    }
    
    private func processUniversalLink(_ universalLink: URL) {
        DispatchQueue.global(qos: .background).async {
            self.sendLinkDataToCallback(universalLink)
        }
    }
    
    private func sendLinkDataToCallback(_ universalLink: URL) {
        do {
            var result = [String: Any]()
            result["url"] = universalLink.absoluteString
            result["token"] = universalLink.queryParameters?["token"]
            
            let jsonData = try JSONSerialization.data(withJSONObject: result, options: [])
            if let jsonString = String(data: jsonData, encoding: .utf8) {
                let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: jsonString)
                pluginResult?.setKeepCallbackAs(true)
                commandDelegate.send(pluginResult, callbackId: callbackId)
            }
        } catch {
            let pluginResult = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: "Failed to parse link")
            pluginResult?.setKeepCallbackAs(true)
            commandDelegate.send(pluginResult, callbackId: callbackId)
        }
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self, name: Notification.Name.CDVPluginHandleOpenURL, object: nil)
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