import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect, Line, Defs, LinearGradient, Stop } from 'react-native-svg';

export function Cover({ width = 200, height = 270, compact = false }: { width?: number; height?: number; compact?: boolean }) {
  return <View accessibilityLabel="Duru için tasarlanan özgün deniz feneri kapağı" style={[s.cover, { width, height }]}>
    <Svg width="100%" height="100%" viewBox="0 0 240 330" preserveAspectRatio="xMidYMid slice" style={StyleSheet.absoluteFill}>
      <Defs><LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#E6D7B5"/><Stop offset="1" stopColor="#B5C4B5"/></LinearGradient></Defs>
      <Rect width="240" height="330" fill="url(#sky)"/>
      <Circle cx="178" cy="123" r="38" fill="#F9EBC6"/>
      <Path d="M0 199 Q55 186 115 198 T240 194 V330 H0Z" fill="#819E94"/>
      <Path d="M0 229 Q65 204 123 228 T240 222 V330 H0Z" fill="#547C76"/>
      <Path d="M0 270 Q75 238 144 253 T240 257 V330 H0Z" fill="#315E5A"/>
      <Path d="M65 243 L111 211 L153 227 L181 268 L37 268Z" fill="#3E5A4B"/>
      <Path d="M99 222 L105 149 L128 149 L138 229Z" fill="#F3E8CD"/>
      <Path d="M120 149 L128 149 L138 229 L126 226Z" fill="#CAB997"/>
      <Rect x="103" y="132" width="28" height="19" fill="#314D46"/>
      <Rect x="109" y="136" width="15" height="11" fill="#FBE9A4"/>
      <Path d="M98 132 L117 118 L136 132Z" fill="#314D46"/>
      <Line x1="117" y1="118" x2="117" y2="111" stroke="#314D46" strokeWidth="2"/>
      <Path d="M130 141 L216 115 L216 162Z" fill="#FFF6D5" opacity=".3"/>
      <Rect x="113" y="191" width="8" height="13" rx="3" fill="#52695D"/>
      <Path d="M7 282 Q43 270 78 281 M157 288 Q192 277 231 284 M19 310 Q70 295 109 304" stroke="#A6BBB0" strokeWidth="1" fill="none" opacity=".65"/>
      <Path d="M28 169 Q33 165 38 169 Q43 165 48 169 M164 177 Q168 174 172 177 Q176 174 180 177" fill="none" stroke="#536858" strokeWidth="1.3"/>
    </Svg>
    {!compact && width >= 100 && <><Text style={[s.overline, { fontSize: Math.max(7, width * .042) }]}>DURU ÖZGÜN HİKÂYELER</Text><Text style={[s.title, { fontSize: width * .126, lineHeight: width * .15 }]}>Kıyıdaki{ '\n' }Işık</Text><Text style={[s.bottom, { fontSize: Math.max(7, width * .037) }]}>BİR DÖNÜŞ HİKÂYESİ</Text></>}
  </View>;
}
const s = StyleSheet.create({ cover: { overflow: 'hidden', borderRadius: 7, backgroundColor: '#B5C4B5' }, overline: { position: 'absolute', top: '7%', width: '100%', textAlign: 'center', letterSpacing: 1.8, color: '#334A40', fontFamily: 'Manrope_600SemiBold' }, title: { position: 'absolute', top: '15%', width: '100%', textAlign: 'center', fontFamily: 'Lora_500Medium', color: '#273D34' }, bottom: { position: 'absolute', bottom: '5%', width: '100%', textAlign: 'center', letterSpacing: 1.8, color: '#E7E6CE', fontFamily: 'Manrope_500Medium' } });

