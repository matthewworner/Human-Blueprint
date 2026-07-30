# BUILD INSTRUCTIONS

## Prerequisites

1. **Mac with Apple silicon** (M1, M2, M3, etc.)
2. **Xcode 15+** installed from Mac App Store
3. **Apple Vision Pro** (for testing on device)
   - OR visionOS Simulator (for basic testing)

## Install XcodeGen

XcodeGen is required to generate the Xcode project from `project.yml`.

```bash
# Using Homebrew (recommended)
brew install xcodegen

# Or using MacPorts
sudo port install xcodegen
```

If you don't have Homebrew, install it first:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

## Generate Xcode Project

```bash
cd /Users/pro/Projects/Secondary/HumanBlueprint/visionOS
xcodegen generate
```

This creates `HumanBlueprint.xcodeproj`.

## Build

### Command Line

```bash
xcodebuild \
  -project HumanBlueprint.xcodeproj \
  -scheme HumanBlueprint \
  -configuration Debug \
  -destination 'platform=visionOS' \
  build
```

### Xcode IDE

1. Open `HumanBlueprint.xcodeproj`
2. Select "Human Blueprint" scheme
3. Select destination:
   - **Vision Pro** (device) — for full experience with eye tracking
   - **visionOS Simulator** — for basic testing (no eye tracking)
4. Press **Cmd+B** to build
5. Press **Cmd+R** to run

## Testing on Device

### 1. Set Up Development Team

1. Open `HumanBlueprint.xcodeproj` in Xcode
2. Select project in navigator
3. Under "Signing & Capabilities", select your team
4. Check "Automatically manage signing"

### 2. Connect Vision Pro

1. Put on Vision Pro
2. Go to Settings → General → VPN & Device Management
3. Enable Developer Mode
4. Connect to Mac via USB-C or WiFi

### 3. Run

In Xcode, select your Vision Pro as the destination and press Run.

## Testing in Simulator

visionOS Simulator doesn't support eye tracking, so gaze interaction won't work.
The app will still render marks, but you can't test gaze-based selection.

**Workaround:** Use tap gesture to select marks in simulator.
- Look at a mark (cursor shows which mark is targeted)
- Tap to trigger connection
- This bypasses the gaze dwell mechanic for testing

## Project Structure

```
HumanBlueprint/
├── project.yml              # XcodeGen configuration
├── HumanBlueprint/
│   ├── Info.plist           # App configuration
│   ├── Assets.xcassets/     # App icons, colors
│   ├── CoreModels.swift     # Mark, Era, factories, models
│   ├── MarkWorldContent.swift # Main view, systems
│   └── README.md            # Documentation
└── BUILD.md                 # This file
```

## Key Files to Modify

| File | Purpose | When to Modify |
|------|---------|---------------|
| `CoreModels.swift` | Mark model, Era colors, factories | Change eras, add mark types |
| `MarkWorldContent.swift` | Main view, gaze handling | Change interaction logic |
| `project.yml` | Xcode settings | Change bundle ID, capabilities |

## Troubleshooting

### "Command line tool not installed"
```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

### "No team selected"
Set your Apple Developer team in Xcode → Signing & Capabilities

### "Device not found"
Make sure Vision Pro is connected and in developer mode

### "Eye tracking not working in simulator"
This is expected. Eye tracking requires physical Vision Pro device.