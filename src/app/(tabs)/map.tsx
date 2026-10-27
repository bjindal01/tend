import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Ellipse, Line } from 'react-native-svg';

import { Avatar, Card, Chip, T } from '@/components/ui';
import { cadenceLabel, daysAgoLabel } from '@/lib/dates';
import { healthAll, STATUS_META, type Health, type Status } from '@/lib/status';
import { useStore } from '@/lib/store';
import { colors, fonts } from '@/lib/theme';
import { CIRCLES } from '@/lib/types';

const ringOf = (h: Health) => CIRCLES.find((c) => c.id === h.person.circle)?.ring ?? 3;
const ORDER = CIRCLES.map((c) => c.id);

function LegendLine({ status, label }: { status: Status | 'tie'; label: string }) {
  const stroke = status === 'tie' ? colors.tie : STATUS_META[status].stroke;
  const dash = status === 'tie' ? undefined : STATUS_META[status].dash;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Svg width={22} height={6}>
        <Line x1={2} y1={3} x2={20} y2={3} stroke={stroke} strokeWidth={status === 'tie' ? 1.2 : 2.5} strokeDasharray={dash} strokeLinecap="round" />
      </Svg>
      <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: '#3F4540' }}>{label}</Text>
    </View>
  );
}

export default function MapScreen() {
  const { data, now } = useStore();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [focus, setFocus] = useState(false);
  const [showTies, setShowTies] = useState(true);
  const [selId, setSelId] = useState<string | null>(null);

  const all = useMemo(() => healthAll(data.people, data.touches, now), [data, now]);
  const attention = all.filter((h) => h.status !== 'on');
  const untouched = all.filter((h) => h.status === 'untouched').length;

  const layout = useMemo(() => {
    const { w, h } = size;
    if (!w || !h) return { pos: {} as Record<string, { x: number; y: number }>, rings: [] as { rx: number; ry: number }[], cx: 0, cy: 0 };
    const cx = w / 2;
    const cy = h / 2;
    const m = Math.min(w, h);
    const rings = [
      { rx: m * 0.21, ry: m * 0.21 },
      { rx: w * 0.36, ry: h * 0.33 },
      { rx: w * 0.42, ry: h * 0.45 },
    ];
    const pos: Record<string, { x: number; y: number }> = {};
    ([1, 2, 3] as const).forEach((ring, ri) => {
      const members = all
        .filter((x) => ringOf(x) === ring)
        .sort((a, b) => ORDER.indexOf(a.person.circle) - ORDER.indexOf(b.person.circle) || a.person.name.localeCompare(b.person.name));
      const offset = [-90, -60, -105][ri];
      members.forEach((x, i) => {
        const a = ((offset + (360 / members.length) * i) * Math.PI) / 180;
        pos[x.person.id] = { x: cx + rings[ri].rx * Math.cos(a), y: cy + rings[ri].ry * Math.sin(a) };
      });
    });
    return { pos, rings, cx, cy };
  }, [size, all]);

  const ties = useMemo(() => {
    const seen = new Set<string>();
    const out: [string, string][] = [];
    for (const p of data.people) {
      for (const k of p.knows) {
        const key = [p.id, k].sort().join('|');
        if (!seen.has(key) && data.people.some((x) => x.id === k)) {
          seen.add(key);
          out.push([p.id, k]);
        }
      }
    }
    return out;
  }, [data.people]);

  const dim = (h?: Health) => focus && h?.status === 'on';
  const byId = Object.fromEntries(all.map((h) => [h.person.id, h]));
  const sel = (selId && byId[selId]) || [...attention].sort((a, b) => b.ratio - a.ratio)[0] || all[0];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <View style={styles.top}>
        <View style={{ gap: 4 }}>
          <T variant="title">Map</T>
          <T variant="small" style={{ fontSize: 14 }}>
            {all.length} people
            {untouched > 0 && <Text style={{ color: colors.untouched, fontFamily: fonts.semibold }}> · {untouched} untouched</Text>}
          </T>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Chip label="Everyone" on={!focus} onPress={() => setFocus(false)} />
          <Chip label={`Needs attention · ${attention.length}`} on={focus} onPress={() => setFocus(true)} />
          <Chip label="Mutual ties" on={showTies} onPress={() => setShowTies((v) => !v)} />
        </View>
        <View style={{ flexDirection: 'row', gap: 14, flexWrap: 'wrap' }}>
          <LegendLine status="on" label="On track" />
          <LegendLine status="fading" label="Fading" />
          <LegendLine status="untouched" label="Untouched" />
          <LegendLine status="tie" label="Know each other" />
        </View>
      </View>

      <View style={styles.mapArea} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {size.w > 0 && (
          <>
            <Svg width={size.w} height={size.h} style={StyleSheet.absoluteFill}>
              {layout.rings.map((r, i) => (
                <Ellipse key={i} cx={layout.cx} cy={layout.cy} rx={r.rx} ry={r.ry} fill="none" stroke="#E2E5DF" strokeWidth={1} />
              ))}
              {showTies &&
                ties.map(([a, b]) => {
                  const pa = layout.pos[a];
                  const pb = layout.pos[b];
                  if (!pa || !pb) return null;
                  return <Line key={`${a}-${b}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke={colors.tie} strokeWidth={1.2} opacity={dim(byId[a]) && dim(byId[b]) ? 0.2 : 0.9} />;
                })}
              {all.map((h) => {
                const p = layout.pos[h.person.id];
                if (!p) return null;
                const meta = STATUS_META[h.status];
                return (
                  <Line
                    key={h.person.id}
                    x1={layout.cx}
                    y1={layout.cy}
                    x2={p.x}
                    y2={p.y}
                    stroke={meta.stroke}
                    strokeWidth={sel?.person.id === h.person.id ? 3.5 : 2.5}
                    strokeDasharray={meta.dash}
                    strokeLinecap="round"
                    opacity={dim(h) ? 0.15 : 1}
                  />
                );
              })}
            </Svg>

            <View style={[styles.you, { left: layout.cx - 28, top: layout.cy - 28 }]}>
              <Text style={{ color: '#FFFFFF', fontFamily: fonts.semibold, fontSize: 14 }}>You</Text>
            </View>

            {all.map((h) => {
              const p = layout.pos[h.person.id];
              if (!p) return null;
              const selected = sel?.person.id === h.person.id;
              return (
                <Pressable
                  key={h.person.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${h.person.name}, ${STATUS_META[h.status].label}, last touch ${daysAgoLabel(h.daysSince)}`}
                  onPress={() => setSelId(h.person.id)}
                  style={[styles.node, { left: p.x - 32, top: p.y - (selected ? 24 : 20), opacity: dim(h) ? 0.35 : 1 }]}
                >
                  <Avatar name={h.person.name} colorIdx={h.person.colorIdx} size={40} status={h.status} selected={selected} />
                  <Text numberOfLines={1} style={styles.nodeLabel}>{h.person.name.split(' ')[0]}</Text>
                </Pressable>
              );
            })}
          </>
        )}
        {all.length === 0 && <T style={{ color: colors.muted, textAlign: 'center', marginTop: 40 }}>Add people to see your map.</T>}
      </View>

      {sel && (
        <Card style={styles.detail}>
          <Pressable accessibilityRole="button" onPress={() => router.push(`/person/${sel.person.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <Avatar name={sel.person.name} colorIdx={sel.person.colorIdx} />
            <View style={{ flex: 1, gap: 2 }}>
              <T variant="semibold">{sel.person.name}</T>
              <T variant="small" numberOfLines={2} style={{ color: STATUS_META[sel.status].text, fontFamily: fonts.medium }}>
                {STATUS_META[sel.status].label} · {daysAgoLabel(sel.daysSince)} · usually {cadenceLabel(sel.person.cadenceDays)}
              </T>
            </View>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/log', params: { personId: sel.person.id } })}
            style={({ pressed }) => [styles.reach, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={{ color: '#FFFFFF', fontFamily: fonts.semibold, fontSize: 14 }}>Reach out</Text>
          </Pressable>
        </Card>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: 20, paddingTop: 20, gap: 12 },
  mapArea: { flex: 1, marginHorizontal: 12, marginTop: 8, marginBottom: 96 },
  you: { position: 'absolute', width: 56, height: 56, borderRadius: 28, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', borderWidth: 6, borderColor: colors.ground },
  node: { position: 'absolute', width: 64, alignItems: 'center', gap: 3 },
  nodeLabel: { fontFamily: fonts.semibold, fontSize: 11, color: colors.ink, backgroundColor: 'rgba(244,245,241,0.9)', paddingHorizontal: 4, borderRadius: 4, overflow: 'hidden' },
  detail: { position: 'absolute', left: 12, right: 12, bottom: 12, padding: 12, paddingLeft: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  reach: { height: 44, paddingHorizontal: 16, borderRadius: 22, backgroundColor: colors.accent, justifyContent: 'center' },
});
