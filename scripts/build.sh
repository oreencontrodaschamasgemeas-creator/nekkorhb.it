#!/bin/bash

# Build script for Resident App
set -e

echo "🏗️  Building Resident App..."

# Check if Expo CLI is installed
if ! command -v expo &> /dev/null; then
    echo "Installing Expo CLI..."
    npm install -g @expo/cli
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .expo/
rm -rf dist/
rm -rf web-build/

# Install dependencies if needed
echo "📦 Installing dependencies..."
npm install

# Type checking
echo "🔍 Running type check..."
npx tsc --noEmit

# Linting
echo "🧹 Running lint..."
npm run lint

# Run tests
echo "🧪 Running tests..."
npm test

# Build for web
echo "🌐 Building for web..."
expo export:web

# Build for Android
echo "🤖 Building for Android..."
expo build:android -t apk

# Build for iOS (if on macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 Building for iOS..."
    expo build:ios -t archive
else
    echo "⚠️  Skipping iOS build (not on macOS)"
fi

echo "✅ Build completed successfully!"
echo "📱 Android APK: android/app/build/outputs/apk/"
echo "🌐 Web build: web-build/"
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 iOS build: ios/build/"
fi