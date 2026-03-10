import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type AlertVariant = 'success' | 'danger';

type AppAlertModalProps = {
  visible: boolean;
  variant?: AlertVariant;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

const VARIANT_STYLES: Record<
  AlertVariant,
  {
    accent: string;
    border: string;
  }
> = {
  success: {
    accent: '#00C805',
    border: '#1B5E20',
  },
  danger: {
    accent: '#FF6B5F',
    border: '#6B2721',
  },
};

export default function AppAlertModal({
  visible,
  variant = 'success',
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: AppAlertModalProps) {
  const palette = VARIANT_STYLES[variant];
  const dismissAction = cancelLabel ? onCancel : onConfirm;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismissAction}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={dismissAction} />
        <View style={[styles.card, { borderColor: palette.border }]}>
          <View style={[styles.accentBar, { backgroundColor: palette.accent }]} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            {cancelLabel ? (
              <TouchableOpacity
                style={styles.secondaryButton}
                activeOpacity={0.85}
                onPress={onCancel}
              >
                <Text style={styles.secondaryButtonText}>{cancelLabel}</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                {
                  backgroundColor: palette.accent,
                  shadowColor: palette.accent,
                },
              ]}
              activeOpacity={0.9}
              onPress={onConfirm}
            >
              <Text style={styles.primaryButtonText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 6, 10, 0.8)',
  },
  card: {
    backgroundColor: '#12131B',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  accentBar: {
    width: 44,
    height: 4,
    borderRadius: 999,
    marginBottom: 16,
  },
  title: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    color: '#9BA3AF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A3040',
    backgroundColor: '#181C26',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: '#D3D8E2',
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: '#07110A',
    fontSize: 14,
    fontWeight: '700',
  },
});
