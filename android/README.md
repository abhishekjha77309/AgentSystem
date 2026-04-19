# Digital Organism IDE - Android Build Instructions

This project is a native Android (Kotlin) implementation of the Digital Organism IDE.

## Configuration
Before building, ensure you have your Gemini API Key.
Add it to your `local.properties` file:
```properties
GEMINI_API_KEY=your_api_key_here
```

## Architecture
- **app**: Main UI and IDE logic.
- **openclaw-sdk**: The underlying orchestration engine for model switching and context management.
- **LiteRT Integration**: Found in `AIEngine.kt`, handles local TFLite model inference.

## Tools
All current web IDE tools (Search, FS, Terminal) are mapped into the `MCPManager.kt` using Model Context Protocol specifications.
