import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  AddressErrors,
  AddressField,
  validateAddress,
} from '../../domain/address';
import { Address } from '../../domain/types';
import { useAddressStore } from '../../store/addressStore';
import { animateNextLayout } from '../../ui/animateLayout';
import { AppText } from '../../ui/AppText';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { TextField } from '../../ui/TextField';
import { minTouchTarget, spacing } from '../../ui/theme';

const EMPTY: Address = { name: '', phone: '', line1: '', pincode: '' };

interface Props {
  /** True while the user is changing an address that is already saved (opened from the Place order bar). */
  editing: boolean;
  /** Called when the form closes after Save or Cancel. */
  onDone: () => void;
}

/**
 * Visible only while there is no saved address (a prompt that expands into the form on tap),
 * or while the saved one is being changed. Once saved it disappears; the Place order bar shows it.
 */
export function AddressSection({ editing, onDone }: Props) {
  const address = useAddressStore(state => state.address);
  const saveAddress = useAddressStore(state => state.saveAddress);

  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Address>(address ?? EMPTY);
  const [errors, setErrors] = useState<AddressErrors>({});

  const change = (field: AddressField) => (text: string) => {
    setValues(current => ({ ...current, [field]: text }));
    setErrors(current => ({ ...current, [field]: undefined }));
  };

  const close = () => {
    animateNextLayout();
    setOpen(false);
    onDone();
  };

  const save = () => {
    const result = validateAddress(values);
    if (result.valid) {
      saveAddress(result.address);
      setValues(result.address);
      setErrors({});
      close();
    } else {
      setErrors(result.errors);
    }
  };

  const cancel = () => {
    setValues(address ?? EMPTY);
    setErrors({});
    close();
  };

  if (address !== null && !editing) {
    return null;
  }

  if (!open && !editing) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add delivery address"
        accessibilityHint="Opens the address form"
        onPress={() => {
          animateNextLayout();
          setOpen(true);
        }}
      >
        <Card style={styles.prompt}>
          <AppText style={styles.icon} importantForAccessibility="no">
            📍
          </AppText>
          <View style={styles.promptText}>
            <AppText variant="bodyStrong">Add delivery address</AppText>
            <AppText variant="caption" tone="secondary">
              We need an address to deliver your order
            </AppText>
          </View>
          <AppText variant="heading" tone="brand">
            +
          </AppText>
        </Card>
      </Pressable>
    );
  }

  return (
    <Card style={styles.form}>
      <AppText variant="heading" accessibilityRole="header">
        Delivery address
      </AppText>
      <TextField
        label="Full name"
        value={values.name}
        onChangeText={change('name')}
        error={errors.name}
        autoCapitalize="words"
        autoComplete="name"
        returnKeyType="next"
      />
      <TextField
        label="Mobile number"
        value={values.phone}
        onChangeText={change('phone')}
        error={errors.phone}
        keyboardType="phone-pad"
        maxLength={10}
        autoComplete="tel"
        returnKeyType="next"
      />
      <TextField
        label="House / flat, street and area"
        value={values.line1}
        onChangeText={change('line1')}
        error={errors.line1}
        autoCapitalize="words"
        returnKeyType="next"
      />
      <TextField
        label="Pincode"
        value={values.pincode}
        onChangeText={change('pincode')}
        error={errors.pincode}
        keyboardType="number-pad"
        maxLength={6}
        returnKeyType="done"
        onSubmitEditing={save}
      />
      <Button label="Save address" onPress={save} />
      <Button label="Cancel" variant="ghost" onPress={cancel} />
    </Card>
  );
}

const styles = StyleSheet.create({
  prompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: minTouchTarget,
  },
  promptText: { flex: 1, gap: spacing.xs },
  icon: { fontSize: 22 },
  form: { gap: spacing.md },
});
