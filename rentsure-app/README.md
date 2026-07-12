# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.

## 🧪 Payment Testing Protocol

This app uses Paystack for payments. Since we don't have a backend yet, the frontend handles the checkout via a secure WebView and marks payments as `PENDING_VERIFICATION` in the mock database.

### Mode Toggling
Toggle `EXPO_PUBLIC_USE_MOCKS` in your `.env` file to switch between the local sandbox and real Paystack payments.
- `true`: Uses the internal dummy flow.
- `false`: Uses the real Paystack WebView.

### Test Key Instructions (`pk_test_...`)
1. Ensure `.env` has `EXPO_PUBLIC_USE_MOCKS=false` and a valid Paystack test key.
2. Go through the booking flow to the Payment screen.
3. Tap "Pay with Paystack".
4. When the Paystack modal opens, enter one of the test cards:
   - Success: `4084 0840 8408 4081` (CVV: `123`, Expiry: any future date, PIN: `1234` or OTP `123456`)
   - Insufficient Funds: `4084 0840 8408 4082`
5. Upon success, the UI will display "Payment received — confirmation pending" because the backend webhook hasn't run yet.

### Live Key Instructions (`pk_live_...`)
*Warning: Real money will be deducted.*
1. Set a valid live key in `.env`.
2. Perform a test transaction for the smallest possible amount (e.g. GHS 1).
3. Confirm the charge succeeded in your bank.
4. Go to your Paystack Dashboard and **refund** the transaction immediately.

## 🤝 Contributing
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Paystack Environment Variables

RentSure uses Paystack to process rent and escrow payments securely. 

To swap between **test** and **live** environments, you should **only** edit your `.env` file. Do not copy or hardcode keys into the source code!

1. Open your `.env` file (create it from `.env.example` if it doesn't exist).
2. Update the `EXPO_PUBLIC_PAYSTACK_KEY` variable:
   - For testing: Use `pk_test_...`
   - For production: Use `pk_live_...`
3. Restart the Expo packager completely to ensure the new environment variables are loaded:
   ```bash
   npx expo start -c
   ```

**Security Note:** The frontend does not require or use the Paystack Secret Key (`sk_`). This must remain solely on the backend. The frontend never verifies payment success directly; it only polls the backend API.
