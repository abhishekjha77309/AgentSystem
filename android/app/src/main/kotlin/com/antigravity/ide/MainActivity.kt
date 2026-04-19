package com.antigravity.ide

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.antigravity.ide.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private lateinit var orchestrator: OpenClawOrchestrator

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        orchestrator = OpenClawOrchestrator(this)
        
        setupUI()
        initializeAIEngine()
    }

    private fun setupUI() {
        // Initialize File Explorer, Terminal, and snippets UI
        binding.root.setOnLongClickListener {
            // Mock UI trigger for model selection
            orchestrator.selectModel("edge-1")
            true
        }
    }

    private fun initializeAIEngine() {
        // Setup LiteRT and Cloud Gemini fallback
    }
}
