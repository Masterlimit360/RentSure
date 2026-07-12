import React from 'react';
import { Modal, StyleSheet, View, ActivityIndicator, SafeAreaView, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/constants/theme';

interface PaystackCheckoutProps {
  visible: boolean;
  amountPesewas: number;
  email: string;
  paystackKey: string;
  reference: string;
  bookingId: string;
  onSuccess: (reference: string) => void;
  onCancel: () => void;
}

export function PaystackCheckout({
  visible,
  amountPesewas,
  email,
  paystackKey,
  reference,
  bookingId,
  onSuccess,
  onCancel,
}: PaystackCheckoutProps) {
  
  const isMockKey = !paystackKey.startsWith('pk_');
  
  const htmlContent = isMockKey ? `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>Test Payment</title>
      <style>
        body { margin: 0; padding: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        .card { background: white; padding: 32px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); text-align: center; max-width: 90%; }
        h2 { color: #111827; margin-bottom: 8px; }
        p { color: #6B7280; margin-bottom: 24px; }
        .amount { font-size: 24px; font-weight: bold; color: #059669; margin-bottom: 24px; }
        .btn { background-color: #059669; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; width: 100%; margin-bottom: 12px; }
        .btn-cancel { background-color: #F3F4F6; color: #374151; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Paystack Demo Mode</h2>
        <p>You are using a test/invalid API key.</p>
        <div class="amount">GHS ${(amountPesewas / 100).toFixed(2)}</div>
        <button class="btn" onclick="success()">Simulate Success</button>
        <button class="btn btn-cancel" onclick="cancel()">Simulate Cancel</button>
      </div>
      <script>
        function success() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'success', reference: 'mock_ref_' + Date.now() }));
        }
        function cancel() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'cancelled' }));
        }
      </script>
    </body>
    </html>
  ` : `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>Paystack Checkout</title>
      <style>
        body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        .loader { border: 4px solid #f3f3f3; border-top: 4px solid #000; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      </style>
    </head>
    <body>
      <div id="loader" class="loader"></div>
      <script src="https://js.paystack.co/v1/inline.js"></script>
      <script>
        function payWithPaystack() {
          var handler = PaystackPop.setup({
            key: '${paystackKey}',
            email: '${email}',
            amount: ${amountPesewas},
            currency: 'GHS',
            ref: '${reference}',
            metadata: {
              custom_fields: [
                {
                  display_name: "Booking ID",
                  variable_name: "booking_id",
                  value: "${bookingId}"
                }
              ]
            },
            callback: function(response) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'success', reference: response.reference }));
            },
            onClose: function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'cancelled' }));
            }
          });
          handler.openIframe();
        }

        // Initialize immediately
        window.onload = function() {
          payWithPaystack();
        };
      </script>
    </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.status === 'success') {
        onSuccess(data.reference);
      } else if (data.status === 'cancelled') {
        onCancel();
      }
    } catch (err) {
      console.error('Failed to parse Paystack WebView message', err);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onCancel}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>
        <WebView
          source={{ html: htmlContent }}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
          style={styles.webview}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.md,
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: spacing.xs,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
