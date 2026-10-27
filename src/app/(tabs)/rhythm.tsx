import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Card, Divider, T } from '@/components/ui';
import { addDays, cadenceLabel, startOfDay } from '@/lib/dates';
import { healthAll } from '@/lib/status';
import { useStore } from '@/lib/store';
import { colors, fonts, heatShades } from '@/lib/theme';
import { CIRCLES } from '@/lib/types';

const WEEKS = 12;
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export default function RhythmScreen() {
  const { data, now } = useStore();

  const stats = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of data.touches) {
      const k = dayKey(new Date(t.at));
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    const today = startOfDay(now);
    const weekStart = addDays(today, -today.getDay());
    const firstDay = addDays(weekStart, -7 * (WEEKS - 1));

    const columns: { key: string; level: number; future: boolean }[][] = [];
    const weekTotals: number[] = [];
    for (let w = 0; w < WEEKS; w++) {
      const col = [];
      let total = 0;
      for (let d = 0; d < 7; d++) {
        const day = addDays(firstDay, w * 7 + d);
        const c = counts.get(dayKey(day)) ?? 0;
        total += c;
        col.push({ key: `${w}-${d}`, level: Math.min(3, c), future: day > today });
      }
      columns.push(col);
      weekTotals.push(total);
    }

    let streak = 0;
    let i = WEEKS - 1;
    if (weekTotals[i] === 0) i--;
    for (; i >= 0 && weekTotals[i] > 0; i--) streak++;

    const monthTouches = data.touches.filter((t) => {
      const d = new Date(t.at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const hs = healthAll(data.people, data.touches, now);
    const circles = CIRCLES.map((c) => {
      const m = hs.filter((h) => h.person.circle === c.id);
      const on = m.filter((h) => h.status === 'on').length;
      return { id: c.id, label: c.label, on, total: m.length, pct: m.length ? on / m.length : 0 };
    }).filter((c) => c.total > 0);

    const drifting = hs.filter((h) => h.status === 'untouched').sort((a, b) => b.ratio - a.ratio).slice(0, 5);
    return { columns, streak, monthTouches, circles, drifting };
  }, [data, now]);

  const monthName = now.toLocaleDateString(undefined, { month: 'long' });

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={{ gap: 4 }}>
          <T variant="title">Rhythm</T>
          <T variant="small" style={{ fontSize: 14 }}>Last {WEEKS} weeks</T>
        </View>

        <Card style={{ padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
              <Text style={{ fontFamily: 'BricolageGrotesque_700Bold', fontSize: 34, color: colors.ink }}>{stats.monthTouches}</Text>
              <T variant="small" style={{ fontSize: 14 }}>touches in {monthName}</T>
            </View>
            {stats.streak > 1 && <T variant="small" style={{ color: colors.accent, fontFamily: fonts.semibold }}>{stats.streak}-week streak</T>}
          </View>
          <View accessible accessibilityLabel={`Heatmap of daily touches over the last ${WEEKS} weeks`} style={{ flexDirection: 'row', gap: 4 }}>
            {stats.columns.map((col, ci) => (
              <View key={ci} style={{ flex: 1, gap: 4 }}>
                {col.map((c) => (
                  <View key={c.key} style={{ height: 18, borderRadius: 4, backgroundColor: c.future ? 'transparent' : heatShades[c.level] }} />
                ))}
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
            <T variant="small" style={{ fontSize: 12 }}>Less</T>
            {heatShades.map((s) => (
              <View key={s} style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: s }} />
            ))}
            <T variant="small" style={{ fontSize: 12 }}>More</T>
          </View>
        </Card>

        {stats.circles.length > 0 && (
          <Card style={{ padding: 16, gap: 12 }}>
            <T variant="label">Circles on track</T>
            {stats.circles.map((c) => (
              <View key={c.id} style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <T variant="semibold" style={{ fontSize: 14 }}>{c.label}</T>
                  <T variant="small" style={{ fontSize: 14 }}>{c.on} of {c.total}</T>
                </View>
                <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.track, overflow: 'hidden' }}>
                  <View style={{ height: 8, borderRadius: 4, width: `${Math.max(3, c.pct * 100)}%`, backgroundColor: c.pct >= 0.6 ? colors.accent : colors.fading }} />
                </View>
              </View>
            ))}
          </Card>
        )}

        {stats.drifting.length > 0 && (
          <View style={{ gap: 8 }}>
            <T variant="label">Drifting</T>
            <Card>
              {stats.drifting.map((h, i) => (
                <View key={h.person.id}>
                  {i > 0 && <Divider />}
                  <View style={styles.row}>
                    <Pressable accessibilityRole="button" onPress={() => router.push(`/person/${h.person.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                      <Avatar name={h.person.name} colorIdx={h.person.colorIdx} size={40} />
                      <View style={{ flex: 1, gap: 2 }}>
                        <T variant="semibold" style={{ fontSize: 15 }}>{h.person.name}</T>
                        <T variant="small" style={{ color: colors.warn }}>{h.daysSince} days · usually {cadenceLabel(h.person.cadenceDays)}</T>
                      </View>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Reach out to ${h.person.name}`}
                      onPress={() => router.push({ pathname: '/log', params: { personId: h.person.id } })}
                      style={styles.nudge}
                    >
                      <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: colors.accentDark }}>Nudge</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40, gap: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingLeft: 16, paddingRight: 12 },
  nudge: { height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: colors.accentSoft, justifyContent: 'center' },
});
