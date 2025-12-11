# Resident App - Mobile Application Bootstrap

A comprehensive React Native (Expo) application for residential communities with authenticated access to visitor management, access logs, notification inbox, and security tips.

## 🚀 Features

### Core Functionality
- **🔐 Authentication System**
  - Secure login/register with email and password
  - Biometric authentication (fingerprint/Face ID)
  - Token-based authentication with automatic refresh
  - Secure storage using Expo SecureStore

- **👥 Visitor Management**
  - Add and manage visitors
  - Visitor approval/denial workflow
  - QR code generation for visitor access
  - Real-time visitor status tracking

- **📱 Push Notifications**
  - Real-time visitor arrival alerts
  - Security incident notifications
  - Maintenance and system notifications
  - Customizable notification preferences

- **🚪 Access Logs**
  - Complete entry/exit tracking
  - Multiple access methods (QR, biometric, PIN, facial recognition)
  - Location-based logging
  - Device information tracking

- **🛡️ Security Features**
  - Security tips and best practices
  - Category-based tips (prevention, awareness, emergency, technology)
  - Severity levels (info, warning, critical)
  - Community safety information

- **📊 Dashboard**
  - Real-time statistics
  - Quick actions for common tasks
  - Recent activity overview
  - Visual status indicators

### Technical Features
- **📱 Cross-Platform**: iOS, Android, and Web support
- **🎨 Modern UI**: Beautiful gradient designs with consistent theming
- **⚡ Performance**: Optimized with React Native best practices
- **🔄 State Management**: Context-based state with useReducer
- **📡 API Integration**: Axios-based HTTP client with interceptors
- **🔒 Security**: Encrypted token storage and biometric authentication
- **🧪 Testing**: Comprehensive unit tests with Jest and React Testing Library
- **📦 Build System**: Automated build scripts for multiple platforms

## 🏗️ Architecture

### Directory Structure
```
src/
├── components/
│   ├── auth/          # Authentication components
│   ├── navigation/    # Navigation setup
│   ├── screens/       # Main application screens
│   └── ui/           # Reusable UI components
├── constants/         # App constants and configuration
├── hooks/            # Custom React hooks
├── services/         # API services and external integrations
├── store/            # State management (Context API)
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```

### Key Technologies
- **React Native 0.81.5** - Mobile framework
- **Expo SDK 54** - Development platform
- **TypeScript** - Type safety
- **React Navigation 7** - Navigation solution
- **Expo Router** - File-based routing
- **Expo SecureStore** - Secure data storage
- **Expo Notifications** - Push notifications
- **Expo Local Authentication** - Biometric auth
- **Axios** - HTTP client
- **Jest** - Testing framework

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for iOS development) or Android Emulator
- Expo Go app on your physical device (for testing)

### Installation

1. **Clone and setup**
   ```bash
   git clone <repository-url>
   cd resident-app
   npm install
   ```

2. **Environment Configuration**
   Create `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_API_URL=https://your-api-url.com
   EXPO_PUBLIC_EXPO_PROJECT_ID=your-expo-project-id
   ```

3. **Start Development Server**
   ```bash
   npm start
   # or
   expo start
   ```

4. **Run on Device/Simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app

## 🧪 Testing

Run the test suite:
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📦 Building for Production

### Automated Build
```bash
# Run the complete build script
./scripts/build.sh
```

### Manual Build

**Web:**
```bash
npm run build:web
# Output: web-build/
```

**Android:**
```bash
npm run build:android
# Output: android/app/build/outputs/apk/
```

**iOS (macOS only):**
```bash
npm run build:ios
# Output: ios/build/
```

## 🔧 Configuration

### API Configuration
Update `src/constants/config.ts`:
```typescript
export const API_CONFIG = {
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://your-api.com',
  // ... other config
};
```

### Push Notifications
1. Set up your Expo project ID in `src/services/notification.ts`
2. Configure push notification credentials in Expo dashboard
3. Update notification channel settings for Android

### Biometric Authentication
The app automatically detects available biometric hardware and provides setup options in the profile settings.

## 🗂️ Main Screens

### Authentication
- **Login Screen**: Email/password authentication with biometric support
- **Register Screen**: New user registration with validation

### Main Application
- **Dashboard**: Overview with statistics and quick actions
- **Visitor Management**: Add, approve, and track visitors
- **Notifications**: View and manage alerts
- **Security Tips**: Browse security information
- **Access Logs**: View entry/exit history
- **Profile**: User settings and preferences

## 🔐 Security Features

### Authentication
- JWT-based authentication with refresh tokens
- Secure token storage using Expo SecureStore
- Biometric authentication support
- Automatic token refresh on expiration

### Data Protection
- All sensitive data encrypted at rest
- HTTPS-only API communication
- Input validation and sanitization
- Secure key generation for biometric auth

## 📱 Platform Support

- **iOS**: 13.0+
- **Android**: API Level 21+ (Android 5.0)
- **Web**: Modern browsers with ES2015+ support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 API Integration

The app is designed to work with a REST API backend. Key endpoints include:

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Token refresh

### Visitors
- `GET /visitors` - List visitors
- `POST /visitors` - Create visitor
- `PATCH /visitors/{id}/approve` - Approve visitor
- `PATCH /visitors/{id}/deny` - Deny visitor

### Notifications
- `GET /notifications` - List notifications
- `PATCH /notifications/{id}/read` - Mark as read
- `POST /notifications/register-token` - Register push token

### Access Logs
- `GET /access/logs` - Get access history
- `POST /access/log` - Create access log entry

## 📊 Development Tools

### Code Quality
- ESLint configuration for code linting
- TypeScript for type checking
- Prettier for code formatting (recommended)

### Testing
- Jest for unit testing
- React Testing Library for component testing
- Mock services for isolated testing

### Debugging
- React Native Debugger
- Flipper for advanced debugging
- Expo DevTools

## 🐛 Troubleshooting

### Common Issues

1. **Metro bundler issues**
   ```bash
   npx expo start --clear
   ```

2. **iOS build failures**
   ```bash
   cd ios && pod install
   ```

3. **Android build issues**
   ```bash
   cd android && ./gradlew clean
   ```

4. **Push notification issues**
   - Check Expo project configuration
   - Verify device permissions
   - Test with Expo's push notification tool

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Expo team for the amazing development platform
- React Native community for continuous innovation
- All contributors and maintainers

---

**Built with ❤️ for secure and connected communities**