import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AddressScreen } from '../features/address/AddressScreen';
import { CouponsScreen } from '../features/coupons/CouponsScreen';
import { OnboardingScreen } from '../features/onboarding/OnboardingScreen';
import { OrderPlacedScreen } from '../features/order/OrderPlacedScreen';
import { usePermissionStore } from '../store/permissionStore';
import { colors, typography } from '../ui/theme';
import { MainTabs } from './MainTabs';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const onboardingDone = usePermissionStore(state => state.onboardingDone);

  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: colors.textPrimary,
        headerTitleStyle: typography.heading,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {!onboardingDone ? (
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Main"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Address"
            component={AddressScreen}
            options={{ title: 'Delivery address', presentation: 'modal' }}
          />
          <Stack.Screen
            name="Coupons"
            component={CouponsScreen}
            options={{ title: 'Apply coupon', presentation: 'modal' }}
          />
          <Stack.Screen
            name="OrderPlaced"
            component={OrderPlacedScreen}
            options={{ headerShown: false, gestureEnabled: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
