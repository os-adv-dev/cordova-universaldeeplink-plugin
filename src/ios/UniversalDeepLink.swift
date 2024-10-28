import Foundation
import UIKit

@objc(UniversalDeeplink)
class UniversalDeeplink: CDVPlugin {
    
    private var callbackId: String?
    
    override func pluginInitialize() {
        super.pluginInitialize()
        swizzleAppDelegateMethod()
    }
    
    private func swizzleAppDelegateMethod() {
        guard let originalMethod = class_getInstanceMethod(AppDelegate.self, #selector(AppDelegate.application(_:continue:restorationHandler:))),
              let swizzledMethod = class_getInstanceMethod(UniversalDeeplinkPlugin.self, #selector(UniversalDeeplinkPlugin.swizzled_application(_:continue:restorationHandler:))) else {
            return
        }
        
        method_exchangeImplementations(originalMethod, swizzledMethod)
    }
    
    @objc 
    func swizzled_application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        
        // Check if the user activity is for Universal Links
        if userActivity.activityType == NSUserActivityTypeBrowsingWeb, let url = userActivity.webpageURL {
            
            // Post notification so the plugin can handle the Universal Link
            NotificationCenter.default.post(name: Notification.Name.CDVPluginHandleOpenURL, object: url)
            
            // Call the original method in case other parts of the app rely on it
            return true
        }
        
        // Call the original implementation (swizzled)
        return self.swizzled_application(application, continue: userActivity, restorationHandler: restorationHandler)
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