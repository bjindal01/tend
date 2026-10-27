import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { Avatar, Card, IconButton, T } from '@/components/ui';
import { callPerson, messagePerson } from '@/lib/contact';
import { cadenceLabel, daysUntilBirthday, shortDate } from '@/lib/dates';
import { health, STATUS_META } from '@/lib/status';
import { useStore } from '@/lib/store';
import { colors, fonts } from '@/lib/theme';
import { circleLabel, touchLabel } from '@/lib/types';

function Action({ icon, label, onPress, primary }: { icon: IconName; label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.action, primary ? { backgroundColor: colors.accent } : null, { opacity: pressed ? 0.8 : 1 }]}
    >
      <Icon name={icon} color={primary ? '#FFFFFF' : colors.ink} />
      <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: primary ? '#FFFFFF' : colors.ink }}>{label}</Text>
    </Pressable>
  );
}

export default function PersonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, now, removeRemember } = useStore();
  const person = data.people.find((p) => p.id === id);

  const { h, history, yearCount } = useMemo(() => {
    if (!person) return { h: undefined, history: [], yearCount: 0 };
    const mine = data.touches.filter((t) => t.personId === person.id).sort((a, b) => (a.at < b.at ? 1 : -1));
    const yearCount = mine.filter((t) => new Date(t.at).getFullYear() === now.getFullYear()).length;
    return { h: health(person, data.touches, now), history: mine.slice(0, 25), yearCount };
  }, [person, data.touches, now]);

  if (!person || !h) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <T>This person no longer exists.</T>
        <Pressable onPress={() => router.back()}><T style={{ color: colors.accent }}>Go back</T></Pressable>
      </SafeAreaView>
    );
  }

  const bd = daysUntilBirthday(person.birthday, now);
  const meta = STATUS_META[h.status];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.topBar}>
          <IconButton label="Back" bg="#FFFFFF" onPress={() => router.back()} style={{ borderWidth: 1, borderColor: colors.line }}>
            <Icon name="back" />
          </IconButton>
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/person-form', params: { id: person.id } })} style={styles.edit}>
            <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: colors.ink }}>Edit</Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Avatar name={person.name} colorIdx={person.colorIdx} size={72} />
          <View style={{ flex: 1, gap: 6 }}>
            <T variant="title" style={{ fontSize: 28, lineHeight: 32 }}>{person.name}</T>
            {!!person.about && <T variant="small" style={{ fontSize: 14 }}>{person.about}</T>}
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              <Text style={[styles.pill, { backgroundColor: colors.accentSoft, color: colors.accentDark }]}>{circleLabel(person.circle)}</Text>
              {bd !== undefined && bd <= 30 && (
                <Text style={[styles.pill, { backgroundColor: colors.warnSoft, color: '#7A3E0E' }]}>
                  {bd === 0 ? 'Birthday today' : `Birthday in ${bd} day${bd === 1 ? '' : 's'}`}
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Action icon="message" label="Message" primary onPress={() => messagePerson(person)} />
          <Action icon="call" label="Call" onPress={() => callPerson(person)} />
          <Action icon="plus" label="Log touch" onPress={() => router.push({ pathname: '/log', params: { personId: person.id } })} />
        </View>

        <Card style={{ padding: 16, flexDirection: 'row' }}>
          <View style={styles.stat}><T variant="small" style={{ fontSize: 12 }}>Rhythm</T><T variant="semibold">{cadenceLabel(person.cadenceDays)}</T></View>
          <View style={styles.stat}>
            <T variant="small" style={{ fontSize: 12 }}>Last touch</T>
            <T variant="semibold" style={{ color: h.status === 'on' ? colors.ink : meta.text }}>
              {h.lastTouch ? (h.daysSince === 0 ? 'Today' : `${h.daysSince} days`) : '—'}
            </T>
          </View>
          <View style={styles.stat}><T variant="small" style={{ fontSize: 12 }}>This year</T><T variant="semibold">{yearCount} touch{yearCount === 1 ? '' : 'es'}</T></View>
        </Card>

        <View style={{ gap: 8 }}>
          <T variant="label">Remember</T>
          <Card style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
            {person.remember.length === 0 && <T variant="small" style={{ paddingVertical: 12 }}>Notes you add when logging a touch show up here.</T>}
            {person.remember.map((r, i) => (
              <View key={`${i}-${r}`} style={[styles.remember, i > 0 ? { borderTopWidth: 1, borderTopColor: colors.hairline } : null]}>
                <View style={[styles.dot, { backgroundColor: i === 0 ? colors.fading : colors.muted }]} />
                <T style={{ flex: 1 }}>{r}</T>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove note: ${r}`}
                  hitSlop={10}
                  onPress={() => Alert.alert('Remove this note?', r, [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: () => removeRemember(person.id, i) }])}
                >
                  <Icon name="close" size={16} color={colors.muted} />
                </Pressable>
              </View>
            ))}
          </Card>
        </View>

        <View style={{ gap: 8 }}>
          <T variant="label">History</T>
          {history.length === 0 && <T variant="small">No touches logged yet.</T>}
          {history.map((t, i) => (
            <View key={t.id} style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ width: 12, alignItems: 'center' }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, marginTop: 5, backgroundColor: i === 0 ? colors.accent : '#9AA39C' }} />
                {i < history.length - 1 && <View style={{ flex: 1, width: 2, backgroundColor: colors.line }} />}
              </View>
              <View style={{ flex: 1, paddingBottom: 14, gap: 2 }}>
                <T variant="small">{shortDate(new Date(t.at))} · {touchLabel(t.type)}</T>
                {!!t.note && <T>{t.note}</T>}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40, gap: 18 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  edit: { height: 44, paddingHorizontal: 16, borderRadius: 22, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.line, justifyContent: 'center' },
  pill: { fontFamily: fonts.semibold, fontSize: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, overflow: 'hidden' },
  action: { flex: 1, height: 64, borderRadius: 16, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', gap: 4 },
  stat: { flex: 1, gap: 2 },
  remember: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
});
