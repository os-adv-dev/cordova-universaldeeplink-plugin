//
//  UniversalLinkStorage.swift
//
//  Created by Andre Grillo on 30/10/2024.
//

import Foundation

class UniversalLinkStorage {
    static let shared = UniversalLinkStorage()
    private init() {}
    
    // Property to store the Universal Link URL temporarily
    var storedUniversalLinkURL: URL?
}