# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a Chrome/Edge browser extension built with:
- **TypeScript** for type safety
- **React** for UI components
- **Vite** for fast development and building
- **Chrome Extension Manifest V3** for modern browser support

## Purpose
The extension helps users manage localStorage JSON values that follow a naming convention (e.g., "mock_" prefix). It provides an easy-to-use interface for editing JSON values without manually copying/pasting from localStorage.

## Key Features
- Display all localStorage items with "mock_" prefix
- JSON editor for easy value modification
- TypeScript interfaces for type safety
- React components for clean UI
- Chrome extension popup interface

## Development Guidelines
- Use TypeScript for all components and utilities
- Follow React best practices and hooks patterns
- Implement proper error handling for JSON parsing/validation
- Use Chrome extension APIs for accessing tab localStorage
- Keep the UI simple and intuitive
- Ensure proper manifest.json configuration for extension permissions
