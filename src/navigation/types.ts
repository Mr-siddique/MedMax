import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  CompositeNavigationProp,
  NavigatorScreenParams,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type MainTabParamList = {
  HomeTab: undefined;
  CartTab: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  Address: undefined;
  Coupons: undefined;
  OrderPlaced: { orderId: string; total: number };
};

/** Navigation from a tab screen: its sibling tabs plus the root stack's modals. */
export type TabScreenNavigation<T extends keyof MainTabParamList> =
  CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, T>,
    NativeStackNavigationProp<RootStackParamList>
  >;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
