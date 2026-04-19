plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.antigravity.ide"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.antigravity.ide"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }
    
    buildFeatures {
        viewBinding = true
        buildConfig = true
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.11.0")
    
    // AI Edge SDK (LiteRT)
    implementation("com.google.ai.edge.litert:litert:0.1.0")
    
    // Gemini SDK
    implementation("com.google.ai.client.generativeai:generativeai:0.2.0")
    
    // OpenClaw Core (Simulated via local modules)
    implementation(project(":openclaw-sdk"))
}
