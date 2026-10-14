import { ReactNode } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { colors } from './theme';

interface Props {
  children: ReactNode;
  /** Defaults to top only: tab bars and native headers already cover the rest. */
  edges?: readonly Edge[];
  style?: StyleProp<ViewStyle>;
}

export function Screen({ children, edges = ['top'], style }: Props) {
  return (
    <SafeAreaView edges={edges} style={[styles.screen, style]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
});
