//
//  AppDelegate+UniversalLinks.swift
//
//  Created by Andre Grillo on 30/10/2024.
//

import Foundation
import UIKit

extension AppDelegate {
    
    override open func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        
        if userActivity.activityType == NSUserActivityTypeBrowsingWeb, let url = userActivity.webpageURL {
            
            // Store the Universal Link URL in the singleton
            UniversalLinkStorage.shared.storedUniversalLinkURL = url
            
            // Post a notification for handling the Universal Link if the app is already running
            NotificationCenter.default.post(name: Notification.Name("UniversalLinkReceived"), object: url)
            
            return true
        }
        
        return false
    }
}
