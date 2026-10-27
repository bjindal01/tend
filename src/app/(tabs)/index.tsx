import { router } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Avatar, Card, Divider, IconButton, PrimaryButton, T } from '@/components/ui';
import { messagePerson } from '@/lib/contact';
import { cadenceLabel, daysBetween, daysUntilBirthday, longDate, shortDate, startOfDay, timeLabel } from '@/lib/dates';
import { health, type Health } from '@/lib/status';
import { useStore } from '@/lib/store';
import { colors, fonts } from '@/lib/theme';

function greeting(d: Date) {
  const h = d.getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

function reason(h: Health) {
  if (h.birthdayToday) return { text: 'Birthday today', warn: true };
  if (h.person.remember[0] && h.overdueDays <= 2) return { text: `Follow up · ${h.person.remember[0]}`, warn: false };
  if (h.overdueDays <= 0) return { text: `Due today · ${cadenceLabel(h.person.cadenceDays)}`, warn: false };
  return { text: `${cadenceLabel(h.person.cadenceDays)} · ${h.overdueDays} day${h.overdueDays === 1 ? '' : 's'} over`, warn: true };
}

export default function TodayScreen() {
  const { data, now, resetToSample, clearAll } = useStore();

  const { due, done, upcoming, starter } = useMemo(() => {
    const today = startOfDay(now).toISOString();
    const due: Health[] = [];
    const done: Health[] = [];
    for (const p of data.people) {
      const h = health(p, data.touches, now);
      if (h.touchedToday) {
        // Was this person on today's list before you reached out?
        const before = health({ ...p, nextDueAt: undefined }, data.touches.filter((t) => t.at < today), now);
        if (before.isDue || before.birthdayToday) done.push(h);
      } else if (h.isDue || h.birthdayToday) {
        due.push(h);
      }
    }
    due.sort((a, b) => Number(b.birthdayToday) - Number(a.birthdayToday) || b.overdueDays - a.overdueDays);

    const upcoming: { id: string; name: string; colorIdx: number; text: string; sort: number }[] = [];
    for (const p of data.people) {
      const bd = daysUntilBirthday(p.birthday, now);
      if (bd !== undefined && bd > 0 && bd <= 14) upcoming.push({ id: p.id, name: p.name, colorIdx: p.colorIdx, text: `Birthday ${bd === 1 ? 'tomorrow' : `in ${bd} days`}`, sort: bd });
      const h = health(p, data.touches, now);
      const until = daysBetween(now, h.dueAt);
      if (until > 0 && until <= 4) upcoming.push({ id: `${p.id}-due`, name: p.name, colorIdx: p.colorIdx, text: `Due ${shortDate(h.dueAt)} · ${cadenceLabel(p.cadenceDays)}`, sort: until });
    }
    upcoming.sort((a, b) => a.sort - b.sort);

    const starter = due.find((h) => h.person.remember.length > 0);
    return { due, done, upcoming: upcoming.slice(0, 4), starter };
  }, [data, now]);

  const total = due.length + done.length;

  const openMenu = () =>
    Alert.alert('Tend', 'Manage your data', [
      { text: 'Reset to sample data', onPress: resetToSample },
      { text: 'Delete everything', style: 'destructive', onPress: () => Alert.alert('Delete everything?', 'All people and history will be removed from this phone.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: clearAll }]) },
      { text: 'Cancel', style: 'cancel' },
    ]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={{ gap: 4, flex: 1 }}>
            <T variant="medium" style={{ fontSize: 13, color: colors.muted }}>{longDate(now)}</T>
            <T variant="title">{greeting(now)}</T>
          </View>
          <IconButton label="More options" bg="#FFFFFF" onPress={openMenu} style={{ borderWidth: 1, borderColor: colors.line }}>
            <Icon name="more" size={20} />
          </IconButton>
        </View>

        {data.people.length === 0 ? (
          <Card style={{ padding: 20, gap: 12 }}>
            <T variant="display">Start with the people who matter</T>
            <T style={{ color: colors.muted }}>Add someone, choose how often you want to be in touch, and Tend will nudge you when it’s time.</T>
            <PrimaryButton label="Add a person" onPress={() => router.push('/person-form')} />
          </Card>
        ) : (
          <>
            <View style={styles.summary}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
                <T variant="display" style={{ color: '#FFFFFF', flex: 1 }}>
                  {total === 0 ? "You're all caught up" : `${total} ${total === 1 ? 'person' : 'people'} to reach out to today`}
                </T>
                {total > 0 && <T variant="medium" style={{ color: '#FFFFFF', fontSize: 13 }}>{done.length} of {total} done</T>}
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${total ? (done.length / total) * 100 : 100}%` }]} />
              </View>
            </View>

            {total > 0 && (
              <View style={{ gap: 10 }}>
                <T variant="label">Due today</T>
                <Card>
                  {due.map((h, i) => {
                    const r = reason(h);
                    return (
                      <View key={h.person.id}>
                        {i > 0 && <Divider />}
                        <View style={styles.row}>
                          <Pressable accessibilityRole="button" onPress={() => router.push(`/person/${h.person.id}`)} style={styles.rowMain}>
                            <Avatar name={h.person.name} colorIdx={h.person.colorIdx} />
                            <View style={{ flex: 1, gap: 2 }}>
                              <T variant="semibold">{h.person.name}</T>
                              <T variant="small" numberOfLines={1} style={r.warn ? { color: colors.warn, fontFamily: fonts.medium } : null}>{r.text}</T>
                            </View>
                          </Pressable>
                          {h.person.phone ? (
                            <IconButton label={`Message ${h.person.name}`} onPress={() => messagePerson(h.person)}>
                              <Icon name="message" color={colors.accent} />
                            </IconButton>
                          ) : (
                            <IconButton label={`Log a touch with ${h.person.name}`} onPress={() => router.push({ pathname: '/log', params: { personId: h.person.id } })}>
                              <Icon name="plus" color={colors.accent} />
                            </IconButton>
                          )}
                        </View>
                      </View>
                    );
                  })}
                  {done.map((h, i) => (
                    <View key={h.person.id}>
                      {(i > 0 || due.length > 0) && <Divider />}
                      <Pressable accessibilityRole="button" onPress={() => router.push(`/person/${h.person.id}`)} style={styles.row}>
                        <Avatar name={h.person.name} colorIdx={h.person.colorIdx} muted />
                        <View style={{ flex: 1, gap: 2 }}>
                          <T variant="semibold" style={{ color: colors.muted, textDecorationLine: 'line-through' }}>{h.person.name}</T>
                          <T variant="small">Reached out at {timeLabel(new Date(h.lastTouch!.at))}</T>
                        </View>
                        <View style={{ width: 44, alignItems: 'center' }} accessibilityLabel="Done">
                          <Icon name="check" size={22} color={colors.accent} strokeWidth={2} />
                        </View>
                      </Pressable>
                    </View>
                  ))}
                </Card>
              </View>
            )}

            {starter && (
              <Card style={{ padding: 16, flexDirection: 'row', gap: 12 }}>
                <View style={styles.bulb}>
                  <Icon name="bulb" size={18} color={colors.warn} />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <T variant="semibold" style={{ fontSize: 13, color: colors.warn }}>Conversation starter for {starter.person.name.split(' ')[0]}</T>
                  <T>{starter.person.remember[0]}</T>
                </View>
              </Card>
            )}

            {upcoming.length > 0 && (
              <View style={{ gap: 10 }}>
                <T variant="label">Coming up</T>
                <Card>
                  {upcoming.map((u, i) => (
                    <View key={u.id}>
                      {i > 0 && <Divider />}
                      <Pressable accessibilityRole="button" onPress={() => router.push(`/person/${u.id.replace(/-due$/, '')}`)} style={styles.row}>
                        <Avatar name={u.name} colorIdx={u.colorIdx} size={36} />
                        <View style={{ flex: 1, gap: 2 }}>
                          <T variant="medium">{u.name}</T>
                          <T variant="small">{u.text}</T>
                        </View>
                      </Pressable>
                    </View>
                  ))}
                </Card>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Pressable accessibilityRole="button" onPress={() => router.push('/log')} style={({ pressed }) => [styles.fab, { opacity: pressed ? 0.85 : 1 }]}>
        <Icon name="plus" color="#FFFFFF" strokeWidth={2} />
        <T variant="semibold" style={{ color: '#FFFFFF', fontSize: 15 }}>Log a touch</T>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 120, gap: 20 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  summary: { backgroundColor: colors.accent, borderRadius: 22, padding: 20, gap: 14 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: '#FFFFFF' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingLeft: 16, paddingRight: 12 },
  rowMain: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  bulb: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.warnSoft, alignItems: 'center', justifyContent: 'center' },
  fab: { position: 'absolute', right: 20, bottom: 20, height: 52, paddingLeft: 16, paddingRight: 20, borderRadius: 26, backgroundColor: colors.ink, flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
});
