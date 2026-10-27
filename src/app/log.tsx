import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { Avatar, Chip, PrimaryButton, T } from '@/components/ui';
import { addDays, weekdayDate } from '@/lib/dates';
import { healthAll } from '@/lib/status';
import { useStore } from '@/lib/store';
import { colors, fonts } from '@/lib/theme';
import { TOUCH_TYPES, type TouchType } from '@/lib/types';

const TYPE_ICON: Record<TouchType, IconName> = { call: 'call', text: 'message', meet: 'meet', video: 'video', email: 'email' };
const NUDGES = [
  { days: 7, label: '1 week' },
  { days: 14, label: '2 weeks' },
  { days: 30, label: '1 month' },
  { days: 90, label: '3 months' },
];

export default function LogScreen() {
  const params = useLocalSearchParams<{ personId?: string }>();
  const { data, now, logTouch } = useStore();

  const sorted = useMemo(() => healthAll(data.people, data.touches, now).sort((a, b) => b.ratio - a.ratio), [data, now]);
  const [personId, setPersonId] = useState<string | undefined>(params.personId ?? sorted[0]?.person.id);
  const [picking, setPicking] = useState(!params.personId);
  const person = data.people.find((p) => p.id === personId);

  const [type, setType] = useState<TouchType>('call');
  const [when, setWhen] = useState<0 | 1>(0);
  const [note, setNote] = useState('');
  const [remember, setRemember] = useState('');
  const defaultNudge = useMemo(() => {
    const c = person?.cadenceDays ?? 14;
    return NUDGES.reduce((best, n) => (Math.abs(n.days - c) < Math.abs(best - c) ? n.days : best), NUDGES[0].days);
  }, [person]);
  const [nudge, setNudge] = useState<number | null>(null);
  const nudgeDays = nudge ?? defaultNudge;

  const save = () => {
    if (!person) return;
    const at = when === 0 ? new Date() : addDays(new Date(), -1);
    logTouch(
      { personId: person.id, type, at: at.toISOString(), note: note.trim() || undefined },
      { nextDueAt: addDays(at, nudgeDays).toISOString(), remember },
    );
    router.back();
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <T variant="title" style={{ fontSize: 26 }}>Log a touch</T>
            <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={10} style={{ height: 44, justifyContent: 'center' }}>
              <Text style={{ fontFamily: fonts.medium, fontSize: 15, color: colors.muted }}>Cancel</Text>
            </Pressable>
          </View>

          {data.people.length === 0 ? (
            <T style={{ color: colors.muted }}>Add someone first, then log your touches with them.</T>
          ) : picking || !person ? (
            <View style={{ gap: 8 }}>
              <T variant="label">Who did you connect with?</T>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {sorted.map((h) => (
                  <Pressable
                    key={h.person.id}
                    accessibilityRole="button"
                    onPress={() => { setPersonId(h.person.id); setPicking(false); setNudge(null); }}
                    style={[styles.pick, h.person.id === personId ? { borderColor: colors.accent, backgroundColor: colors.accentSoft } : null]}
                  >
                    <Avatar name={h.person.name} colorIdx={h.person.colorIdx} size={28} />
                    <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: colors.ink }}>{h.person.name.split(' ')[0]}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.who}>
              <Avatar name={person.name} colorIdx={person.colorIdx} size={36} />
              <T variant="semibold" style={{ flex: 1 }}>{person.name}</T>
              <Chip label="Change" on={false} onPress={() => setPicking(true)} />
            </View>
          )}

          {person && (
            <>
              <View style={{ gap: 8 }}>
                <T variant="label">How did you connect?</T>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {TOUCH_TYPES.map((t) => {
                    const on = t.id === type;
                    return (
                      <Pressable
                        key={t.id}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                        onPress={() => setType(t.id)}
                        style={[styles.type, on ? { borderColor: colors.accent, backgroundColor: colors.accentSoft } : null]}
                      >
                        <Icon name={TYPE_ICON[t.id]} color={on ? colors.accentDark : colors.ink} strokeWidth={1.8} />
                        <Text style={{ fontFamily: fonts.semibold, fontSize: 12, color: on ? colors.accentDark : colors.ink }}>{t.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={{ gap: 8 }}>
                <T variant="label">When</T>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Chip label="Today" on={when === 0} onPress={() => setWhen(0)} />
                  <Chip label="Yesterday" on={when === 1} onPress={() => setWhen(1)} />
                </View>
              </View>

              <View style={{ gap: 8 }}>
                <T variant="label" accessibilityRole="text">What did you talk about?</T>
                <TextInput
                  accessibilityLabel="What did you talk about?"
                  value={note}
                  onChangeText={setNote}
                  multiline
                  placeholder="A few words so future-you remembers"
                  placeholderTextColor={colors.faint}
                  style={[styles.input, { minHeight: 88, textAlignVertical: 'top', paddingTop: 12 }]}
                />
              </View>

              <View style={{ gap: 8 }}>
                <T variant="label">Remember for next time</T>
                <TextInput
                  accessibilityLabel="Remember for next time"
                  value={remember}
                  onChangeText={setRemember}
                  placeholder="e.g. Ask how the race went"
                  placeholderTextColor={colors.faint}
                  style={[styles.input, { height: 48 }]}
                />
              </View>

              <View style={{ gap: 8 }}>
                <T variant="label">Next nudge</T>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  {NUDGES.map((n) => (
                    <Chip key={n.days} label={n.label} on={nudgeDays === n.days} onPress={() => setNudge(n.days)} />
                  ))}
                </View>
                <T variant="small">Tend will bring {person.name.split(' ')[0]} back on {weekdayDate(addDays(when === 0 ? now : addDays(now, -1), nudgeDays))}</T>
              </View>
            </>
          )}
        </ScrollView>
        <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
          <PrimaryButton label="Save touch" onPress={save} disabled={!person} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, gap: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  who: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 14 },
  pick: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 6, paddingRight: 12, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.line, backgroundColor: '#FFFFFF' },
  type: { flex: 1, height: 64, borderRadius: 14, borderWidth: 1.5, borderColor: colors.line, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', gap: 4 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 14, backgroundColor: '#FFFFFF', paddingHorizontal: 14, fontFamily: fonts.body, fontSize: 15, color: colors.ink },
});
