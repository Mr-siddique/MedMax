import { LayoutAnimation } from 'react-native';

/** Call right before a state change that expands or collapses content, so the height change is animated. */
export function animateNextLayout() {
  LayoutAnimation.configureNext(
    LayoutAnimation.create(220, 'easeInEaseOut', 'opacity'),
  );
}
