package com.outsystems.experts.universalDeepLink

import android.content.Intent
import android.net.Uri
import android.util.Log
import kotlinx.coroutines.*
import org.apache.cordova.CallbackContext
import org.apache.cordova.CordovaPlugin
import org.apache.cordova.PluginResult
import org.json.JSONArray

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
            return true
        } else {
            this.callbackContext?.error("This Action $action is not handled in this plugin")
        }

        return false
    }

    private fun handleIntent(intent: Intent?) {
        scope.launch(Dispatchers.IO) {
            intent?.data?.let { data ->
                Log.d(TAG, "Received full URL: $data")
                if (callbackContext != null) {
                    setUniversalLinkCallback(data)
                }
            }
        }
    }

    private fun setUniversalLinkCallback(data: Uri) {
        scope.launch(Dispatchers.Main) {
            try {
                val url = data.toString()
                val jsonResult = org.json.JSONObject().apply {
                    put("url", url)
                }

                data.queryParameterNames.forEach { key ->
                    data.getQueryParameter(key)?.let { value ->
                        jsonResult.put(key, value)
                    }
                }

                val pluginResult = PluginResult(PluginResult.Status.OK, jsonResult.toString())
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