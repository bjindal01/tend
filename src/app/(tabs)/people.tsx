import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Avatar, Card, Chip, Divider, IconButton, T } from '@/components/ui';
import { cadenceLabel, daysAgoLabel } from '@/lib/dates';
import { healthAll, STATUS_META } from '@/lib/status';
import { useStore } from '@/lib/store';
import { colors, fonts } from '@/lib/theme';
import { CIRCLES, touchLabel, type CircleId } from '@/lib/types';

export default function PeopleScreen() {
  const { data, now } = useStore();
  const [query, setQuery] = useState('');
  const [circle, setCircle] = useState<CircleId | 'all'>('all');

  const all = useMemo(() => healthAll(data.people, data.touches, now), [data, now]);

  const q = query.trim().toLowerCase();
  const visible = all.filter((h) => {
    if (circle !== 'all' && h.person.circle !== circle) return false;
    if (!q) return true;
    const p = h.person;
    return [p.name, p.about ?? '', ...p.remember].some((s) => s.toLowerCase().includes(q));
  });

  const groups = CIRCLES.map((c) => {
    const members = visible.filter((h) => h.person.circle === c.id).sort((a, b) => b.ratio - a.ratio);
    const inCircle = all.filter((h) => h.person.circle === c.id);
    const dueCount = inCircle.filter((h) => h.isDue).length;
    const onTrack = inCircle.filter((h) => h.status === 'on').length;
    const cadences = [...new Set(inCircle.map((h) => h.person.cadenceDays))];
    return { ...c, members, dueCount, onTrack, total: inCircle.length, cadence: cadences.length === 1 ? cadenceLabel(cadences[0]) : undefined };
  }).filter((g) => g.members.length > 0);

  const usedCircles = CIRCLES.filter((c) => all.some((h) => h.person.circle === c.id));

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <T variant="title">People</T>
          <IconButton label="Add person" bg={colors.accent} onPress={() => router.push('/person-form')}>
            <Icon name="plus" color="#FFFFFF" strokeWidth={2} />
          </IconButton>
        </View>

        <View style={styles.search}>
          <Icon name="search" size={18} color={colors.muted} />
          <TextInput
            accessibilityLabel="Search people"
            value={query}
            onChangeText={setQuery}
            placeholder={`Search ${data.people.length} people, notes`}
            placeholderTextColor={colors.faint}
            style={styles.searchInput}
            returnKeyType="search"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ flexGrow: 0 }}>
          <Chip label={`All ${data.people.length}`} on={circle === 'all'} onPress={() => setCircle('all')} />
          {usedCircles.map((c) => (
            <Chip key={c.id} label={c.label} on={circle === c.id} onPress={() => setCircle(c.id)} />
          ))}
        </ScrollView>

        {groups.length === 0 && (
          <T style={{ color: colors.muted, textAlign: 'center', marginTop: 24 }}>
            {data.people.length === 0 ? 'No one here yet. Tap + to add someone.' : 'No matches.'}
          </T>
        )}

        {groups.map((g) => (
          <View key={g.id} style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <T variant="label">{g.label}{g.cadence ? ` · ${g.cadence}` : ''}</T>
              {g.dueCount > 0 ? (
                <T variant="small" style={{ color: colors.warn, fontFamily: fonts.medium }}>{g.dueCount} due</T>
              ) : (
                <T variant="small" style={{ color: colors.accent, fontFamily: fonts.medium }}>{g.onTrack} of {g.total} on track</T>
              )}
            </View>
            <Card>
              {g.members.map((h, i) => {
                const meta = STATUS_META[h.status];
                const lastText = h.lastTouch ? `${touchLabel(h.lastTouch.type)} · ${daysAgoLabel(h.daysSince)}` : 'No touches yet';
                return (
                  <View key={h.person.id}>
                    {i > 0 && <Divider />}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${h.person.name}, ${meta.label}, ${lastText}`}
                      onPress={() => router.push(`/person/${h.person.id}`)}
                      style={styles.row}
                    >
                      <Avatar name={h.person.name} colorIdx={h.person.colorIdx} size={40} />
                      <View style={{ flex: 1, gap: 2 }}>
                        <T variant="semibold" style={{ fontSize: 15 }}>{h.person.name}</T>
                        <T variant="small" style={h.isDue ? { color: colors.warn, fontFamily: fonts.medium } : null}>{lastText}</T>
                      </View>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${Math.max(4, Math.min(1, h.ratio) * 100)}%`, backgroundColor: h.status === 'on' ? colors.accent : meta.stroke }]} />
                      </View>
                    </Pressable>
                  </View>
                );
              })}
            </Card>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40, gap: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, paddingHorizontal: 16, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.line },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.ink, paddingVertical: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16 },
  barTrack: { width: 56, height: 6, borderRadius: 3, backgroundColor: colors.track, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
});
