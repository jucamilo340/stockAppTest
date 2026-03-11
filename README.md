# 📈 StockTracker

Real-time stock tracking app built with React Native + Expo. Monitor stocks with live WebSocket updates and price alert notifications.

---

## ✨ Features

- **Live price tracking** via Finnhub WebSocket — stocks
- **Watchlist** with real-time cards showing name, price, and % change
- **Price alerts** with push notifications via Firebase Cloud Messaging
- **Interactive chart** plotting all watched assets in dollar value
- **Symbol search** across US stocks, crypto, and forex exchanges
- **Auth0 authentication** with PKCE flow
- **Persistent watchlist** with Redux Toolkit + AsyncStorage

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo |
| Language | TypeScript |
| State | Redux Toolkit + redux-persist |
| Navigation | React Navigation v6 |
| Auth | Auth0 (expo-auth-session, PKCE) |
| Real-time | Finnhub WebSocket API |
| Notifications | Firebase Cloud Messaging |
| Charts | Victory Native |
| Forms | react-hook-form + Zod |
| Build | Android (Gradle) |

---

## 📱 Screens

### Watchlist
Live stock cards updated in real time via WebSocket. Shows name, current price, and marginal % change.

### Add Alert
Search any symbol across US stocks. Set a target price and get notified when it's reached.

### Chart
Multi-line chart plotting the dollar value history of all watched assets simultaneously.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI
- Android Studio (for local builds)

### Install

```bash
git clone https://github.com/tu-usuario/StockTrackerApp.git
cd StockTrackerApp
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
EXPO_PUBLIC_FINNHUB_API_KEY=your_finnhub_api_key
EXPO_PUBLIC_AUTH0_DOMAIN=your_auth0_domain
EXPO_PUBLIC_AUTH0_CLIENT_ID=your_auth0_client_id
```

Get your Finnhub API key at [finnhub.io](https://finnhub.io).

### Run

```bash
npx expo start
```

---

## 🏗 Build APK

```bash
# Generate native Android folder
npx expo prebuild --platform android

# Build release APK
cd android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`


## 📂 Project Structure

```
src/
├── api/          # Finnhub REST + WebSocket client
├── auth/         # Auth0 PKCE hook
├── components/   # StockCard
├── hooks/        # useStockSocket, useAlerts
├── navigation/   # RootNavigator
├── notifications/# Firebase FCM
├── screens/      # Watchlist, AddAlert, Chart, Login
├── store/        # Redux slices
├── types/
└── utils/        # formatCurrency
```
