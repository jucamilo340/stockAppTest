import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FINNHUB_API_KEY } from '@config/env';
import { useAppDispatch, useAppSelector } from '@store/store';
import { addAlert, removeAlert } from '@store/alertsSlice';
import AppAlertModal from '@components/AppAlertModal';
import {
  addSymbol,
  DEFAULT_WATCHLIST_SYMBOLS,
  removeSymbol,
  updateStockPrice,
} from '@store/Watchlistslice';
import { finnhubApi } from '@api/Finnhub';

type StockOption = { label: string; value: string };

const DEFAULT_STOCKS: StockOption[] = [
  { label: '🪙 Bitcoin',        value: 'BINANCE:BTCUSDT' },
  { label: '🪙 Ethereum',       value: 'BINANCE:ETHUSDT' },
  { label: '🪙 Solana',         value: 'BINANCE:SOLUSDT' },
  { label: '🪙 BNB',            value: 'BINANCE:BNBUSDT' },
  { label: '💱 EUR/USD',        value: 'OANDA:EUR_USD' },
  { label: '💱 GBP/USD',        value: 'OANDA:GBP_USD' },
  { label: 'Apple Inc.',        value: 'AAPL' },
  { label: 'NVIDIA Corp.',      value: 'NVDA' },
  { label: 'Tesla Inc.',        value: 'TSLA' },
  { label: 'Microsoft Corp.',   value: 'MSFT' },
];


const alertSchema = z.object({
  symbol: z.string().min(1, 'Please select a stock'),
  targetPrice: z
    .string()
    .min(1, 'Price is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Enter a valid price greater than 0',
    }),
});

type AlertFormData = z.infer<typeof alertSchema>;
type DialogState = {
  variant: 'success' | 'danger';
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
};

const normalizeSymbol = (symbol: string) => symbol.trim().toUpperCase();

const searchAllExchanges = async (query: string): Promise<StockOption[]> => {
  const encodedQuery = encodeURIComponent(query);

  const [usRes, cryptoRes, forexRes] = await Promise.allSettled([
    fetch(
      `https://finnhub.io/api/v1/search?token=${FINNHUB_API_KEY}&q=${encodedQuery}&exchange=US`
    ).then((response) => response.json()),
    fetch(
      `https://finnhub.io/api/v1/search?token=${FINNHUB_API_KEY}&q=${encodedQuery}&exchange=crypto`
    ).then((response) => response.json()),
    fetch(
      `https://finnhub.io/api/v1/search?token=${FINNHUB_API_KEY}&q=${encodedQuery}&exchange=forex`
    ).then((response) => response.json()),
  ]);

  const results: StockOption[] = [];

  if (usRes.status === 'fulfilled') {
    (usRes.value.result ?? [])
      .filter((item: any) => item.type === 'Common Stock' && item.symbol && item.description)
      .slice(0, 6)
      .forEach((item: any) => {
        results.push({
          label: `${item.description} (${item.displaySymbol || item.symbol})`,
          value: item.symbol,
        });
      });
  }

  if (cryptoRes.status === 'fulfilled') {
    (cryptoRes.value.result ?? [])
      .filter((item: any) => item.symbol && item.description)
      .slice(0, 5)
      .forEach((item: any) => {
        results.push({
          label: item.description,
          value: item.symbol,
        });
      });
  }

  if (forexRes.status === 'fulfilled') {
    (forexRes.value.result ?? [])
      .filter((item: any) => item.symbol && item.description)
      .slice(0, 4)
      .forEach((item: any) => {
        results.push({
          label: item.description,
          value: item.symbol,
        });
      });
  }

  return results;
};

export default function AddAlertScreen() {
  const dispatch = useAppDispatch();
  const alerts = useAppSelector((state) => state.alerts.list);

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<StockOption[]>(DEFAULT_STOCKS);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<AlertFormData>({
    resolver: zodResolver(alertSchema),
    defaultValues: { symbol: '', targetPrice: '' },
  });

  const selectedSymbol = watch('symbol');

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setSuggestions(DEFAULT_STOCKS);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        const results = await searchAllExchanges(trimmedQuery);
        setSuggestions(results.length > 0 ? results : DEFAULT_STOCKS);
      } catch {
        setSuggestions(DEFAULT_STOCKS);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const handleSelect = (option: StockOption) => {
    setValue('symbol', option.value, { shouldValidate: true });
    setQuery(`${option.label} (${option.value})`);
    setShowSuggestions(false);
  };

  const closeDialog = () => setDialog(null);

  const handleRemoveAlert = (alertId: string, symbol: string) => {
    setDialog({
      variant: 'danger',
      title: 'Delete alert',
      message: `Remove the alert for ${symbol}?`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      onConfirm: () => {
        closeDialog();
        dispatch(removeAlert(alertId));

        const normalizedSymbol = normalizeSymbol(symbol);
        const hasOtherAlertsForSymbol = alerts.some(
          (alert) =>
            alert.id !== alertId &&
            normalizeSymbol(alert.symbol) === normalizedSymbol
        );
        const isDefaultWatchlistSymbol =
          DEFAULT_WATCHLIST_SYMBOLS.includes(normalizedSymbol);

        if (!hasOtherAlertsForSymbol && !isDefaultWatchlistSymbol) {
          dispatch(removeSymbol(normalizedSymbol));
        }
      },
    });
  };

  const onSubmit = async (data: AlertFormData) => {
    const price = parseFloat(data.targetPrice);
    const symbol = normalizeSymbol(data.symbol);

    dispatch(addSymbol(symbol));

    try {
      const quote = await finnhubApi.getQuote(symbol);
      if (quote?.c && quote.c > 0) {
        dispatch(updateStockPrice({ symbol, price: quote.c }));
      }
    } catch {}

    dispatch(addAlert({ symbol, targetPrice: price }));

    setDialog({
      variant: 'success',
      title: 'Alert created',
      message: `You'll be notified when ${symbol} reaches $${price.toFixed(2)}`,
      confirmLabel: 'Continue',
      onConfirm: () => {
        closeDialog();
        reset();
        setQuery('');
        setSuggestions(DEFAULT_STOCKS);
        setShowSuggestions(false);
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Add Alert</Text>
          <Text style={styles.subtitle}>
            Get notified when a stock hits your target price
          </Text>

          <Text style={styles.label}>Stock</Text>
          <View style={styles.autocompleteWrapper}>
            <View style={[styles.inputRow, errors.symbol && styles.fieldError]}>
              <TextInput
                style={styles.stockInput}
                placeholder="Search stocks, crypto, forex..."
                placeholderTextColor="#444"
                value={query}
                onChangeText={(text) => {
                  setQuery(text);
                  setValue('symbol', '', { shouldValidate: false });
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {isSearching ? (
                <ActivityIndicator
                  size="small"
                  color="#00C805"
                  style={styles.spinner}
                />
              ) : null}
              {selectedSymbol ? (
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText} numberOfLines={1}>
                    {selectedSymbol}
                  </Text>
                </View>
              ) : null}
            </View>

            {showSuggestions ? (
              <View style={styles.suggestions}>
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                >
                  {suggestions.map((item, index) => (
                    <React.Fragment key={item.value}>
                      <TouchableOpacity
                        style={styles.suggestionItem}
                        onPress={() => handleSelect(item)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.suggestionSymbol} numberOfLines={1}>
                          {item.value}
                        </Text>
                        <Text style={styles.suggestionLabel} numberOfLines={1}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                      {index < suggestions.length - 1 ? (
                        <View style={styles.separator} />
                      ) : null}
                    </React.Fragment>
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </View>
          {errors.symbol ? (
            <Text style={styles.errorText}>{errors.symbol.message}</Text>
          ) : null}

          <Text style={styles.label}>Price Alert (USD)</Text>
          <Controller
            name="targetPrice"
            control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[
                  styles.priceInput,
                  errors.targetPrice && styles.fieldError,
                ]}
                placeholder="e.g. 180.00"
                placeholderTextColor="#444"
                keyboardType="decimal-pad"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.targetPrice ? (
            <Text style={styles.errorText}>{errors.targetPrice.message}</Text>
          ) : null}

          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit(onSubmit)}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Create Alert</Text>
          </TouchableOpacity>

          {alerts.length > 0 ? (
            <View style={styles.alertsSection}>
              <Text style={styles.alertsTitle}>
                Active Alerts ({alerts.length})
              </Text>
              {alerts.map((alert) => (
                <View key={alert.id} style={styles.alertItem}>
                  <View style={styles.alertInfo}>
                    <Text style={styles.alertSymbol}>{alert.symbol}</Text>
                    <View style={styles.alertMeta}>
                      <Text style={styles.alertPrice}>
                        ${alert.targetPrice.toFixed(2)}
                      </Text>
                      {alert.triggered ? (
                        <Text style={styles.alertTriggered}>Triggered</Text>
                      ) : null}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleRemoveAlert(alert.id, alert.symbol)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
      <AppAlertModal
        visible={dialog !== null}
        variant={dialog?.variant}
        title={dialog?.title ?? ''}
        message={dialog?.message ?? ''}
        confirmLabel={dialog?.confirmLabel ?? 'OK'}
        cancelLabel={dialog?.cancelLabel}
        onConfirm={dialog?.onConfirm ?? closeDialog}
        onCancel={closeDialog}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A14' },
  flex: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 48 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 32,
    lineHeight: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  autocompleteWrapper: { zIndex: 999, marginBottom: 4 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E2E',
    borderColor: '#2E2E3E',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 2,
  },
  stockInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    paddingVertical: 12,
  },
  spinner: { marginLeft: 8 },
  selectedBadge: {
    backgroundColor: '#00C80522',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
    maxWidth: 120,
  },
  selectedBadgeText: {
    color: '#00C805',
    fontWeight: '700',
    fontSize: 11,
  },
  suggestions: {
    backgroundColor: '#1E1E2E',
    borderColor: '#2E2E3E',
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    maxHeight: 240,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  suggestionSymbol: {
    color: '#00C805',
    fontWeight: '700',
    fontSize: 12,
    width: 96,
  },
  suggestionLabel: {
    color: '#AAA',
    fontSize: 13,
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: '#2E2E3E',
    marginHorizontal: 16,
  },
  priceInput: {
    backgroundColor: '#1E1E2E',
    borderColor: '#2E2E3E',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFF',
    fontSize: 15,
    marginBottom: 4,
  },
  fieldError: { borderColor: '#FF453A' },
  errorText: {
    color: '#FF453A',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#00C805',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 28,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  alertsSection: { marginTop: 40 },
  alertsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 12,
  },
  alertItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E2E',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  alertInfo: {
    flex: 1,
    marginRight: 12,
  },
  alertSymbol: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
  alertMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  alertPrice: {
    color: '#00C805',
    fontWeight: '600',
    fontSize: 15,
  },
  alertTriggered: {
    color: '#888',
    fontSize: 12,
    marginLeft: 12,
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#5A1F1B',
    backgroundColor: '#2B1515',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deleteButtonText: {
    color: '#FF6B5F',
    fontSize: 12,
    fontWeight: '700',
  },
});
