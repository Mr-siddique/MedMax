import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text } from 'react-native';
import { totalQty } from '../domain/cart';
import { CartScreen } from '../features/cart/CartScreen';
import { HomeScreen } from '../features/home/HomeScreen';
import { useCartStore } from '../store/cartStore';
import { colors, typography } from '../ui/theme';
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({ glyph }: { glyph: string }) {
  return (
    <Text style={styles.icon} importantForAccessibility="no">
      {glyph}
    </Text>
  );
}

const renderHomeIcon = () => <TabIcon glyph="🏠" />;
const renderCartIcon = () => <TabIcon glyph="🛒" />;

export function MainTabs() {
  const cartCount = useCartStore(state => totalQty(state.lines));

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: typography.captionStrong,
        tabBarStyle: styles.tabBar,
        tabBarBadgeStyle: styles.badge,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarAccessibilityLabel: 'Home, search medicines',
          tabBarIcon: renderHomeIcon,
        }}
      />
      <Tab.Screen
        name="CartTab"
        component={CartScreen}
        options={{
          title: 'Cart',
          tabBarAccessibilityLabel:
            cartCount > 0 ? `Cart, ${cartCount} items` : 'Cart, empty',
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarIcon: renderCartIcon,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: { backgroundColor: colors.surface, borderTopColor: colors.border },
  badge: { backgroundColor: colors.brand, color: colors.textInverse },
  icon: { fontSize: 20 },
});
