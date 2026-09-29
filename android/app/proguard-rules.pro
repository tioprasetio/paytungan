# Add project specific ProGuard rules here.

# React Native & Hermes
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
    @com.facebook.react.uimanager.annotations.ReactProp *;
    @com.facebook.react.uimanager.annotations.ReactPropGroup *;
}

-keepclasseswithmembernames class * {
    native <methods>;
}

# React Native Libraries
-keep class com.th3rdwave.safeareacontext.** { *; }
-keep class com.swmansion.rnscreens.** { *; }
-keep class com.reactnativecommunity.asyncstorage.** { *; }
-keep class com.horcrux.svg.** { *; }
-keep class com.imagepicker.** { *; }

# OkHttp & Socket.io
-dontwarn okhttp3.**
-dontwarn okio.**
-keepnames class okhttp3.internal.publicsuffix.PublicSuffixDatabase
-keep class io.socket.** { *; }

