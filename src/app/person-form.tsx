import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip, PrimaryButton, T } from '@/components/ui';
import { newId, useStore } from '@/lib/store';
import { avatarPalette, colors, fonts } from '@/lib/theme';
import { CIRCLES, type CircleId, type Person } from '@/lib/types';

const CADENCES = [
  { days: 7, label: 'Weekly' },
  { days: 14, label: 'Every 2 wks' },
  { days: 30, label: 'Monthly' },
  { days: 90, label: 'Quarterly' },
  { days: 180, label: 'Twice a year' },
];

const DEFAULT_CADENCE: Record<CircleId, number> = { inner: 7, friends: 14, family: 14, work: 30, network: 90 };

function validBirthday(s: string) {
  if (!s) return true;
  const m = /^(\d{1,2})[-/](\d{1,2})$/.exec(s.trim());
  if (!m) return false;
  const mo = Number(m[1]);
  const d = Number(m[2]);
  return mo >= 1 && mo <= 12 && d >= 1 && d <= 31;
}
const normBirthday = (s: string) => {
  const m = /^(\d{1,2})[-/](\d{1,2})$/.exec(s.trim());
  return m ? `${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` : undefined;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <T variant="label">{label}</T>
      {children}
    </View>
  );
}

export default function PersonForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data, upsertPerson, deletePerson } = useStore();
  const existing = data.people.find((p) => p.id === id);

  const [name, setName] = useState(existing?.name ?? '');
  const [about, setAbout] = useState(existing?.about ?? '');
  const [circle, setCircle] = useState<CircleId>(existing?.circle ?? 'friends');
  const [cadence, setCadence] = useState(existing?.cadenceDays ?? DEFAULT_CADENCE.friends);
  const [cadenceTouched, setCadenceTouched] = useState(!!existing);
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [email, setEmail] = useState(existing?.email ?? '');
  const [birthday, setBirthday] = useState(existing?.birthday ?? '');
  const [knows, setKnows] = useState<string[]>(existing?.knows ?? []);

  const others = data.people.filter((p) => p.id !== existing?.id);

  const save = () => {
    if (!name.trim()) return;
    if (!validBirthday(birthday)) {
      Alert.alert('Check the birthday', 'Use month-day, like 10-20.');
      return;
    }
    const p: Person = {
      id: existing?.id ?? newId(),
      name: name.trim(),
      about: about.trim() || undefined,
      circle,
      cadenceDays: cadence,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      birthday: normBirthday(birthday),
      remember: existing?.remember ?? [],
      knows,
      colorIdx: existing?.colorIdx ?? data.people.length % avatarPalette.length,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      nextDueAt: existing?.nextDueAt,
    };
    upsertPerson(p);
    // Keep ties symmetric so the map draws them either way.
    for (const o of data.people) {
      if (o.id === p.id) continue;
      const should = knows.includes(o.id);
      const has = o.knows.includes(p.id);
      if (should !== has) upsertPerson({ ...o, knows: should ? [...o.knows, p.id] : o.knows.filter((k) => k !== p.id) });
    }
    router.back();
  };

  const remove = () => {
    if (!existing) return;
    Alert.alert(`Delete ${existing.name}?`, 'Their history and notes will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deletePerson(existing.id);
          router.dismissAll();
        },
      },
    ]);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <T variant="title" style={{ fontSize: 26 }}>{existing ? 'Edit person' : 'Add a person'}</T>
            <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={10} style={{ height: 44, justifyContent: 'center' }}>
              <Text style={{ fontFamily: fonts.medium, fontSize: 15, color: colors.muted }}>Cancel</Text>
            </Pressable>
          </View>

          <Field label="Name">
            <TextInput accessibilityLabel="Name" value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor={colors.faint} style={styles.input} autoFocus={!existing} />
          </Field>
          <Field label="How you know them">
            <TextInput accessibilityLabel="How you know them" value={about} onChangeText={setAbout} placeholder="e.g. College roommate · Oakland" placeholderTextColor={colors.faint} style={styles.input} />
          </Field>
          <Field label="Circle">
            <View style={styles.wrap}>
              {CIRCLES.map((c) => (
                <Chip
                  key={c.id}
                  label={c.label}
                  on={circle === c.id}
                  onPress={() => {
                    setCircle(c.id);
                    if (!cadenceTouched) setCadence(DEFAULT_CADENCE[c.id]);
                  }}
                />
              ))}
            </View>
          </Field>
          <Field label="Stay in touch">
            <View style={styles.wrap}>
              {CADENCES.map((c) => (
                <Chip key={c.days} label={c.label} on={cadence === c.days} onPress={() => { setCadence(c.days); setCadenceTouched(true); }} />
              ))}
            </View>
          </Field>
          <Field label="Phone">
            <TextInput accessibilityLabel="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="For one-tap message and call" placeholderTextColor={colors.faint} style={styles.input} />
          </Field>
          <Field label="Email">
            <TextInput accessibilityLabel="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="Optional" placeholderTextColor={colors.faint} style={styles.input} />
          </Field>
          <Field label="Birthday (month-day)">
            <TextInput accessibilityLabel="Birthday, month and day" value={birthday} onChangeText={setBirthday} keyboardType="numbers-and-punctuation" placeholder="e.g. 10-20" placeholderTextColor={colors.faint} style={styles.input} />
          </Field>
          {others.length > 0 && (
            <Field label="Knows (mutual ties on the map)">
              <View style={styles.wrap}>
                {others.map((o) => (
                  <Chip
                    key={o.id}
                    label={o.name.split(' ')[0]}
                    on={knows.includes(o.id)}
                    onPress={() => setKnows((k) => (k.includes(o.id) ? k.filter((x) => x !== o.id) : [...k, o.id]))}
                  />
                ))}
              </View>
            </Field>
          )}
          {existing && (
            <Pressable accessibilityRole="button" onPress={remove} style={{ height: 44, justifyContent: 'center', alignSelf: 'flex-start' }}>
              <Text style={{ fontFamily: fonts.semibold, fontSize: 15, color: colors.untouched }}>Delete {existing.name.split(' ')[0]}</Text>
            </Pressable>
          )}
        </ScrollView>
        <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
          <PrimaryButton label={existing ? 'Save changes' : 'Add person'} onPress={save} disabled={!name.trim()} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, gap: 18, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  input: { height: 48, borderWidth: 1, borderColor: colors.line, borderRadius: 14, backgroundColor: '#FFFFFF', paddingHorizontal: 14, fontFamily: fonts.body, fontSize: 15, color: colors.ink },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
