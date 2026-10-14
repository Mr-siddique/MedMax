import { NavigatorScreenParams } from '@react-navigation/native';

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

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
