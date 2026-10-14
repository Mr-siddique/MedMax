import { useEffect, useState } from 'react';
import { FlatList, KeyboardAvoidingView, StyleSheet, View } from 'react-native';
import { Medicine } from '../../domain/types';
import { catalog } from '../../data/medicineCatalog';
import { SearchStatus, useSearchStore } from '../../store/searchStore';
import { useDebouncedValue } from '../../utils/useDebouncedValue';
import { AppText } from '../../ui/AppText';
import { EmptyState } from '../../ui/EmptyState';
import { Screen } from '../../ui/Screen';
import { spacing } from '../../ui/theme';
import { DeliveryLocation } from '../permissions/DeliveryLocation';
import {
  PermissionPrompts,
  PermissionStatusLine,
} from '../permissions/PermissionBanner';
import { MedicineRow } from './MedicineRow';
import { RecentSearches } from './RecentSearches';
import { SearchBar } from './SearchBar';
import { SearchSkeleton } from './SearchSkeleton';

export const SEARCH_DEBOUNCE_MS = 300;

export function HomeScreen() {
  const status = useSearchStore(state => state.status);
  const searchedQuery = useSearchStore(state => state.query);
  const results = useSearchStore(state => state.results);
  const recents = useSearchStore(state => state.recents);
  const search = useSearchStore(state => state.search);
  const recordRecent = useSearchStore(state => state.recordRecent);
  const clearRecents = useSearchStore(state => state.clearRecents);

  // The box keeps the last query when switching tabs, because the store does.
  const [text, setText] = useState(() => useSearchStore.getState().query);
  const debouncedText = useDebouncedValue(text, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    if (debouncedText !== useSearchStore.getState().query) {
      search(debouncedText);
    }
  }, [debouncedText, search]);

  const runNow = (query: string) => {
    setText(query);
    search(query);
  };

  const submit = () => {
    recordRecent(text);
    search(text);
  };

  const clear = () => runNow('');

  return (
    <Screen>
      {/* Edge-to-edge means the window does not resize, so lift the list above the keyboard ourselves. */}
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <FlatList
          data={visibleMedicines(status, results)}
          keyExtractor={medicine => medicine.id}
          renderItem={({ item }) => (
            <MedicineRow
              medicine={item}
              onAdded={() => recordRecent(useSearchStore.getState().query)}
            />
          )}
          ItemSeparatorComponent={Separator}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <View style={styles.header}>
              <DeliveryLocation />
              <PermissionStatusLine />
              <SearchBar
                value={text}
                onChangeText={setText}
                onSubmit={submit}
                onClear={clear}
              />
              <PermissionPrompts />
              <SearchStatusView
                status={status}
                query={searchedQuery.trim()}
                resultCount={results.length}
                recents={recents}
                onSelectRecent={query => {
                  recordRecent(query);
                  runNow(query);
                }}
                onClearRecents={clearRecents}
                onClearSearch={clear}
                onRetry={() => search(text)}
              />
            </View>
          }
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}

/** With nothing typed the whole catalog is browsable; otherwise only the matches. */
function visibleMedicines(
  status: SearchStatus,
  results: readonly Medicine[],
): readonly Medicine[] {
  if (status === 'idle') {
    return catalog;
  }
  return status === 'success' ? results : [];
}

interface StatusViewProps {
  status: SearchStatus;
  query: string;
  resultCount: number;
  recents: readonly string[];
  onSelectRecent: (query: string) => void;
  onClearRecents: () => void;
  onClearSearch: () => void;
  onRetry: () => void;
}

/** Everything that appears between the search box and the result rows. */
function SearchStatusView({
  status,
  query,
  resultCount,
  recents,
  onSelectRecent,
  onClearRecents,
  onClearSearch,
  onRetry,
}: StatusViewProps) {
  switch (status) {
    case 'idle':
      return (
        <View style={styles.section}>
          <RecentSearches
            recents={recents}
            onSelect={onSelectRecent}
            onClear={onClearRecents}
          />
          <AppText variant="heading" accessibilityRole="header">
            All medicines
          </AppText>
        </View>
      );
    case 'loading':
      return <SearchSkeleton />;
    case 'success':
      return (
        <AppText
          tone="secondary"
          accessibilityLiveRegion="polite"
        >{`${resultCount} ${
          resultCount === 1 ? 'result' : 'results'
        } for “${query}”`}</AppText>
      );
    case 'empty':
      return (
        <EmptyState
          icon="🧐"
          title="No medicines found"
          message={`We couldn’t find anything for “${query}”. Check the spelling or try the salt name.`}
          actionLabel="Try another search"
          onAction={onClearSearch}
        />
      );
    case 'error':
      return (
        <EmptyState
          icon="⚠️"
          title="Something went wrong"
          message="We couldn’t search right now. Please try again."
          actionLabel="Try again"
          onAction={onRetry}
        />
      );
  }
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { gap: spacing.md, marginBottom: spacing.md },
  section: { gap: spacing.lg },
  separator: { height: spacing.md },
});
