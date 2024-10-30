package com.outsystems.experts.universalDeepLink

import android.content.Intent
import android.net.Uri
import android.util.Log
import kotlinx.coroutines.*
import org.apache.cordova.CallbackContext
import org.apache.cordova.CordovaPlugin
import org.apache.cordova.PluginResult
import org.json.JSONArray
import org.json.JSONObject

private const val TAG = "UniversalDeeplinkPlugin"
private const val SET_UNIVERSAL_LINK_CALLBACK = "setUniversalLinkCallback"

class UniversalDeeplinkPlugin : CordovaPlugin() {

    private val scope: CoroutineScope = CoroutineScope(Dispatchers.Main) + SupervisorJob()
    private var callbackContext: CallbackContext? = null

    override fun onNewIntent(intent: Intent) {
        handleIntent(intent)
    }

    override fun execute(
        action: String,
        args: JSONArray,
        callbackContext: CallbackContext
    ): Boolean {

        if (action == SET_UNIVERSAL_LINK_CALLBACK) {
            this.callbackContext = callbackContext

            cordova.activity.intent?.let { intent ->
                handleIntent(intent)
            }

            val pluginResult = PluginResult(PluginResult.Status.NO_RESULT)
            pluginResult.keepCallback = true
            callbackContext.sendPluginResult(pluginResult)
            return true
        }

        return false
    }

    private fun handleIntent(intent: Intent?) {
        scope.launch(Dispatchers.IO) {
            intent?.data?.let { data ->
                if (callbackContext != null) {
                    setUniversalLinkCallback(data)
                }
            }
        }
    }

    private fun setUniversalLinkCallback(data: Uri) {
        scope.launch(Dispatchers.Main) {
            try {
                val result = JSONObject().apply {
                    put("url", data.toString())
                }
                val pluginResult = PluginResult(PluginResult.Status.OK, result)
                pluginResult.keepCallback = true
                callbackContext?.sendPluginResult(pluginResult)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to parse link: ${e.message}")
                val pluginResult = PluginResult(PluginResult.Status.ERROR, "Failed to parse link")
                pluginResult.keepCallback = true
                callbackContext?.sendPluginResult(pluginResult)
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
    }
}