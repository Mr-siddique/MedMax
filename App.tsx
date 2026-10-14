import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useHydrated } from './src/app/useHydrated';
import { usePermissionSync } from './src/app/usePermissionSync';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/ui/theme';
import { ToastHost } from './src/ui/ToastHost';

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.brand,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
  },
};

function App() {
  const hydrated = useHydrated();
  usePermissionSync();

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      {hydrated ? (
        <NavigationContainer theme={navigationTheme}>
          <RootNavigator />
        </NavigationContainer>
      ) : (
        <View style={styles.splash} accessibilityLabel="Loading MedMax">
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      )}
      <ToastHost />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});

export default App;
