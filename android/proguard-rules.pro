-keepnames class com.transistorsoft.bggeo.capacitor.BackgroundGeolocationPlugin

-keep class com.transistorsoft** { *; }
-dontwarn com.transistorsoft.**

# Huawei Adapter
-keep class com.google.android.gms.** {*;}
-keep interface com.google.android.gms.** {*;}
-dontwarn com.huawei.**

# BackgroundGeolocation (EventBus)
-keepattributes *Annotation*
-keepclassmembers class * {
    @org.greenrobot.eventbus.Subscribe <methods>;
}
-keep enum org.greenrobot.eventbus.ThreadMode { *; }

# And if you use AsyncExecutor:
-keepclassmembers class * extends org.greenrobot.eventbus.util.ThrowableFailureEvent {
    <init>(java.lang.Throwable);
}

# logback
-keep class ch.qos** { *; }
-keep class org.slf4j** { *; }
-dontwarn ch.qos.logback.core.net.*

# OkHttp3
-dontwarn okio.**
-dontwarn okhttp3.**
-dontwarn javax.annotation.**
-dontwarn org.conscrypt.**
# A resource is loaded with a relative path so the package of this class must be preserved.
-keepnames class okhttp3.internal.publicsuffix.PublicSuffixDatabase

# LifecycleObserver
-keep class androidx.lifecycle.FullLifecycleObserver
