import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";

import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  Check,
  ChevronRight,
  ChevronUp,
  Compass,
  Headphones,
  Leaf,
  Library,
  ListMusic,
  Moon,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Search,
  Volume2,
  X,
  type LucideIcon,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Cover } from "./src/Cover";
import {
  decodeSaved,
  initialSaved,
  manifest,
  matches,
  profiles,
  hasAiNarrators,
  profileExplanation,
  narratorReviewNotice,
  rates,
  story,
  time,
  type Saved,
} from "./src/model";
import { STORAGE_KEY, useListening, type Listening } from "./src/useListening";

const C = {
  bg: "#F6F4EE",
  paper: "#FFFDF8",
  ink: "#293E35",
  muted: "#626B63",
  green: "#355D48",
  pale: "#E9EDE3",
  line: "#E2E4D9",
  sand: "#EEE8DB",
};
const sans = "Manrope_400Regular";
const serif = "Lora_400Regular";
type Page = "discover" | "library" | "about" | "detail";
type Sheet = "player" | "speed" | "sleep" | "chapters" | null;

function Label({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<any>;
}) {
  return <Text style={[s.text, style]}>{children}</Text>;
}
function Eyebrow({ children }: { children: React.ReactNode }) {
  return <Text style={s.eyebrow}>{children}</Text>;
}
function IconButton({
  icon: Icon,
  label,
  onPress,
  active,
  size = 21,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  active?: boolean;
  size?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        s.iconButton,
        active && { backgroundColor: C.pale },
        pressed && { opacity: 0.6 },
      ]}
    >
      <Icon size={size} color={C.ink} strokeWidth={1.6} />
    </Pressable>
  );
}
function Button({
  children,
  onPress,
  secondary,
  icon: Icon = Play,
  style,
}: {
  children: string;
  onPress: () => void;
  secondary?: boolean;
  icon?: LucideIcon;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={children}
      onPress={onPress}
      style={({
        pressed,
        hovered,
      }: {
        pressed: boolean;
        hovered?: boolean;
      }) => [
        s.button,
        secondary && s.secondaryButton,
        (pressed || hovered) && { opacity: 0.82 },
        style,
      ]}
    >
      <Icon
        size={17}
        color={secondary ? C.green : "#FFFDF8"}
        strokeWidth={1.7}
      />
      <Label style={[s.buttonText, secondary && { color: C.green }]}>
        {children}
      </Label>
    </Pressable>
  );
}
function Progress({
  listen,
  large = false,
}: {
  listen: Listening;
  large?: boolean;
}) {
  const [width, setWidth] = useState(1);
  const keyboardProps =
    Platform.OS === "web"
      ? {
          onKeyDown: (event: { key: string; preventDefault: () => void }) => {
            const target =
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? listen.duration
                  : ["ArrowRight", "ArrowUp"].includes(event.key)
                    ? listen.seconds + 15
                    : ["ArrowLeft", "ArrowDown"].includes(event.key)
                      ? listen.seconds - 15
                      : null;
            if (target !== null) {
              event.preventDefault();
              void listen.seek(target);
            }
          },
        }
      : {};
  return (
    <View style={{ gap: 8, width: "100%" }}>
      <Pressable
        {...(keyboardProps as any)}
        accessibilityRole="adjustable"
        aria-valuemin={0}
        aria-valuemax={Math.round(listen.duration)}
        aria-valuenow={Math.round(listen.seconds)}
        aria-valuetext={`${time(listen.seconds)} / ${time(listen.duration)}`}
        accessibilityLabel="Dinleme konumu"
        accessibilityValue={{
          min: 0,
          max: Math.round(listen.duration),
          now: Math.round(listen.seconds),
          text: `${time(listen.seconds)} / ${time(listen.duration)}`,
        }}
        accessibilityActions={[
          { name: "increment", label: "15 saniye ileri" },
          { name: "decrement", label: "15 saniye geri" },
        ]}
        onAccessibilityAction={(e) =>
          void listen.seek(
            listen.seconds +
              (e.nativeEvent.actionName === "increment" ? 15 : -15),
          )
        }
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        onPress={(e) =>
          void listen.seek((e.nativeEvent.locationX / width) * listen.duration)
        }
        style={{ paddingVertical: large ? 12 : 8 }}
      >
        <View style={s.progressTrack}>
          <View
            style={[
              s.progressFill,
              {
                width: `${Math.min(100, (listen.seconds / listen.duration) * 100)}%`,
              },
            ]}
          />
          <View
            style={[
              s.progressDot,
              {
                left: `${Math.min(99, (listen.seconds / listen.duration) * 100)}%`,
              },
            ]}
          />
        </View>
      </Pressable>
      {large && (
        <View style={s.between}>
          <Label style={s.small}>{time(listen.seconds)}</Label>
          <Label style={s.small}>{time(listen.duration)}</Label>
        </View>
      )}
    </View>
  );
}
function Transport({
  listen,
  big = false,
}: {
  listen: Listening;
  big?: boolean;
}) {
  return (
    <View style={[s.row, { justifyContent: "center", gap: big ? 25 : 14 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="15 saniye geri"
        style={s.skip}
        onPress={() => void listen.seek(listen.seconds - 15)}
      >
        <RotateCcw size={big ? 25 : 21} color={C.ink} strokeWidth={1.6} />
        <Label style={s.skipNumber}>15</Label>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={listen.playing ? "Duraklat" : "Oynat"}
        onPress={listen.toggle}
        style={({ pressed }) => [
          s.play,
          {
            width: big ? 68 : 44,
            height: big ? 68 : 44,
            borderRadius: big ? 34 : 22,
          },
          pressed && { opacity: 0.7 },
        ]}
      >
        {listen.loading ? (
          <ActivityIndicator color="white" />
        ) : listen.playing ? (
          <Pause size={big ? 28 : 20} fill="#FFFDF8" color="#FFFDF8" />
        ) : (
          <Play
            size={big ? 28 : 20}
            fill="#FFFDF8"
            color="#FFFDF8"
            style={{ marginLeft: 2 }}
          />
        )}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="15 saniye ileri"
        style={s.skip}
        onPress={() => void listen.seek(listen.seconds + 15)}
      >
        <RotateCw size={big ? 25 : 21} color={C.ink} strokeWidth={1.6} />
        <Label style={s.skipNumber}>15</Label>
      </Pressable>
    </View>
  );
}
function NarratorInfo() {
  const narrator = profiles[0];
  return (
    <View style={s.narratorCard}>
      <Volume2 size={23} color={C.green} strokeWidth={1.5} />
      <View style={{ flex: 1, gap: 4 }}>
        <Label style={s.medium}>{narrator.label} · {narrator.badge}</Label>
        <Label style={[s.small, { lineHeight: 20 }]}>{profileExplanation}</Label>
      </View>
    </View>
  );
}
function Paragraphs({ listen }: { listen: Listening }) {
  return (
    <View style={{ gap: 4 }}>
      {story.paragraphs.map((p, index) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${p.chapter}, paragraf ${index + 1}, ${p.title}`}
          onPress={() => void listen.selectParagraph(p.id)}
          key={p.id}
          style={({ hovered }: { pressed: boolean; hovered?: boolean }) => [
            s.paragraph,
            listen.paragraph.id === p.id && { backgroundColor: C.pale },
            hovered && { backgroundColor: C.pale },
          ]}
        >
          <View style={s.paragraphNumber}>
            {listen.paragraph.id === p.id && listen.playing ? (
              <Volume2 size={16} color={C.green} />
            ) : (
              <Label style={s.small}>
                {String(index + 1).padStart(2, "0")}
              </Label>
            )}
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Label style={s.medium}>{p.title}</Label>
            <Label style={s.small}>
              {p.chapter} · Paragraf {index + 1}
            </Label>
          </View>
          <Label style={s.small}>
            {time(manifest.profiles[listen.profile].paragraphs[index].duration)}
          </Label>
          <Play size={15} color={C.green} />
        </Pressable>
      ))}
    </View>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Lora_400Regular: require("@expo-google-fonts/lora/400Regular/Lora_400Regular.ttf"),
    Lora_500Medium: require("@expo-google-fonts/lora/500Medium/Lora_500Medium.ttf"),
    Manrope_400Regular: require("@expo-google-fonts/manrope/400Regular/Manrope_400Regular.ttf"),
    Manrope_500Medium: require("@expo-google-fonts/manrope/500Medium/Manrope_500Medium.ttf"),
    Manrope_600SemiBold: require("@expo-google-fonts/manrope/600SemiBold/Manrope_600SemiBold.ttf"),
    Manrope_700Bold: require("@expo-google-fonts/manrope/700Bold/Manrope_700Bold.ttf"),
  });
  const [saved, setSaved] = useState<Saved | null>(null);
  const [readFailed, setReadFailed] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => setSaved(decodeSaved(raw)))
      .catch(() => {
        setReadFailed(true);
        setSaved(initialSaved);
      });
  }, []);
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {saved && (fontsLoaded || fontError) ? (
        <Main saved={saved} readFailed={readFailed} />
      ) : (
        <View style={s.loading}>
          <BookOpen size={35} color={C.green} />
          <Text style={{ fontSize: 30, color: C.ink }}>Duru</Text>
          <ActivityIndicator color={C.green} />
          <Text style={{ color: C.muted }}>Hikâyene hazırlanıyoruz…</Text>
        </View>
      )}
    </SafeAreaProvider>
  );
}

function Main({ saved, readFailed }: { saved: Saved; readFailed: boolean }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const desktop = width >= 1000;
  const roomy = width >= 750;
  const listen = useListening(saved);
  const [page, setPage] = useState<Page>("discover");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Tümü");
  const [sheet, setSheet] = useState<Sheet>(null);
  const [returnToPlayer, setReturnToPlayer] = useState(false);
  const profile = profiles.find((p) => p.id === listen.profile)!;
  const openBook = () => {
    setPage("detail");
    setQuery("");
  };
  const openSheet = (next: Sheet, fromPlayer = false) => {
    setReturnToPlayer(fromPlayer);
    setSheet(next);
  };
  const closeSheet = () => {
    if (returnToPlayer) {
      setReturnToPlayer(false);
      setSheet("player");
    } else setSheet(null);
  };
  const found =
    matches(query) && (filter !== "Kaydedilenler" || listen.favorite);
  const progress = Math.round((listen.seconds / listen.duration) * 100);
  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      <View style={s.body}>
        {desktop && (
          <View style={s.sidebar}>
            <View style={[s.row, { gap: 11, marginBottom: 6 }]}>
              <View style={s.logoMark}>
                <BookOpen size={22} color={C.green} strokeWidth={1.5} />
              </View>
              <Text style={s.logo}>duru</Text>
            </View>
            <Label style={[s.small, { marginLeft: 3, marginBottom: 54 }]}>
              Hikâyenin içinde, kendine yakın.
            </Label>
            <Eyebrow>KEŞFET & DİNLE</Eyebrow>
            {(
              [
                { id: "discover", icon: Compass, label: "Keşfet" },
                { id: "library", icon: Library, label: "Kitaplığım" },
                { id: "about", icon: Leaf, label: "Duru hakkında" },
              ] as const
            ).map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() => {
                  setPage(item.id);
                  setQuery("");
                }}
                style={({
                  hovered,
                }: {
                  pressed: boolean;
                  hovered?: boolean;
                }) => [
                  s.navItem,
                  page === item.id && s.navActive,
                  hovered && { backgroundColor: C.pale },
                ]}
              >
                <item.icon size={20} color={C.green} strokeWidth={1.6} />
                <Label
                  style={[
                    s.navText,
                    page === item.id && { fontFamily: "Manrope_700Bold" },
                  ]}
                >
                  {item.label}
                </Label>
                {page === item.id && <View style={s.navDot} />}
              </Pressable>
            ))}
            <View style={{ flex: 1 }} />
            <View style={s.sidebarNote}>
              <Leaf size={23} color={C.green} strokeWidth={1.3} />
              <Text style={s.noteTitle}>Biraz yavaşla.</Text>
              <Label style={[s.small, { lineHeight: 21 }]}>
                Güzel bir hikâye için{"\n"}küçük bir mola yeter.
              </Label>
            </View>
            <View style={[s.row, { gap: 8, marginTop: 28 }]}>
              <View style={s.liveDot} />
              <Label style={s.small}>Duru · Demo sürümü</Label>
            </View>
          </View>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={[s.header, { paddingHorizontal: desktop ? 40 : 20 }]}>
            <View style={s.row}>
              {!desktop ? (
                <>
                  <BookOpen size={22} color={C.green} />
                  <Text style={[s.logo, { fontSize: 29, marginLeft: 10 }]}>
                    duru
                  </Text>
                </>
              ) : (
                <Label style={s.headerTitle}>
                  {page === "library"
                    ? "Kitaplığım"
                    : page === "about"
                      ? "Duru hakkında"
                      : page === "detail"
                        ? "Hikâye ayrıntıları"
                        : "Keşfet"}
                </Label>
              )}
            </View>
            <View
              style={[
                s.search,
                { width: desktop ? 290 : Math.min(width * 0.48, 270) },
              ]}
            >
              <Search size={17} color={C.muted} strokeWidth={1.6} />
              <TextInput
                accessibilityLabel="Kitap ara"
                placeholder={roomy ? "Bir hikâye ara…" : "Hikâye ara…"}
                placeholderTextColor={C.muted}
                value={query}
                onChangeText={(value) => {
                  setQuery(value);
                  setPage("discover");
                }}
                style={s.searchInput}
              />
              {!!query && (
                <IconButton
                  icon={X}
                  label="Aramayı temizle"
                  onPress={() => setQuery("")}
                  size={15}
                />
              )}
            </View>
            {desktop && (
              <View style={s.headerBadge}>
                <Headphones size={16} color={C.green} />
                <Label style={s.small}>Sana ait bir dinleme alanı</Label>
              </View>
            )}
          </View>
          {!desktop && (
            <View style={s.mobileNav}>
              {(
                [
                  { id: "discover", label: "Keşfet" },
                  { id: "library", label: "Kitaplığım" },
                  { id: "about", label: "Hakkında" },
                ] as const
              ).map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    setPage(item.id);
                    setQuery("");
                  }}
                  style={[
                    s.mobileNavItem,
                    page === item.id && { borderBottomColor: C.green },
                  ]}
                >
                  <Label style={page === item.id ? s.medium : s.small}>
                    {item.label}
                  </Label>
                </Pressable>
              ))}
            </View>
          )}
          <ScrollView
            contentContainerStyle={[
              s.content,
              { paddingHorizontal: desktop ? 40 : 20 },
            ]}
          >
            {(readFailed || listen.storageError) && (
              <View accessibilityRole="alert" style={s.warning}>
                <Label>
                  {listen.storageError ??
                    "Önceki ilerleme okunamadı. Yeni bir dinleme başlatabilirsin."}
                </Label>
              </View>
            )}
            {listen.error && (
              <View accessibilityRole="alert" style={s.warning}>
                <Label style={{ flex: 1 }}>{listen.error}</Label>
                <Button secondary icon={RotateCw} onPress={listen.retryAudio}>
                  Yeniden dene
                </Button>
              </View>
            )}
            {listen.notice && (
              <View accessibilityLiveRegion="polite" style={s.notice}>
                <Check size={17} color={C.green} />
                <Label style={{ flex: 1 }}>{listen.notice}</Label>
                <IconButton
                  icon={X}
                  label="Bilgiyi kapat"
                  onPress={() => listen.setNotice(null)}
                />
              </View>
            )}
            {page === "discover" && (
              <>
                <View style={s.intro}>
                  <Eyebrow>KENDİNE BİR HİKÂYE AYIR</Eyebrow>
                  <Text style={[s.heading, { fontSize: roomy ? 40 : 31 }]}>
                    Dünya biraz bekleyebilir.
                  </Text>
                  <Label style={s.subtitle}>
                    Kulaklığını tak. Rahat bir yer bul. Hikâyeye bırak kendini.
                  </Label>
                </View>
                {!query && (
                  <View
                    style={[
                      s.row,
                      {
                        alignItems: "stretch",
                        flexWrap: roomy ? "nowrap" : "wrap",
                        gap: 22,
                      },
                    ]}
                  >
                    <View
                      style={[
                        s.hero,
                        {
                          flexDirection: roomy ? "row" : "column",
                          flex: roomy ? 1 : undefined,
                          width: roomy ? undefined : "100%",
                          padding: roomy ? 28 : 22,
                        },
                      ]}
                    >
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Kıyıdaki Işık kitap ayrıntısını aç"
                        onPress={openBook}
                        style={[s.heroCover, !roomy && { alignSelf: "center" }]}
                      >
                        <Cover
                          width={roomy ? 171 : 180}
                          height={roomy ? 238 : 246}
                        />
                      </Pressable>
                      <View
                        style={{ flex: 1, gap: 13, justifyContent: "center" }}
                      >
                        <View style={s.row}>
                          <View style={s.tag}>
                            <Label style={s.tagText}>İLK HİKÂYEN</Label>
                          </View>
                          <Label style={[s.small, { marginLeft: 10 }]}>
                            Özgün içerik
                          </Label>
                        </View>
                        <Text style={s.heroTitle}>Kıyıdaki Işık</Text>
                        <Label style={s.author}>Duru için özgün hikâye</Label>
                        <Label style={[s.heroDescription, { maxWidth: 340 }]}>
                          Bazen eve dönmek,{"\n"}kendine giden yolu bulmaktır.
                        </Label>
                        <View style={[s.row, { gap: 8 }]}>
                          <Headphones size={14} color={C.muted} />
                          <Label style={s.small}>
                            {time(listen.duration)} dk
                          </Label>
                          <View style={s.dot} />
                          <Label style={s.small}>Kısa hikâye</Label>
                        </View>
                        <Button
                          style={{ alignSelf: "flex-start", marginTop: 4 }}
                          onPress={() => {
                            openBook();
                            if (!listen.playing) listen.toggle();
                          }}
                        >
                          {listen.started
                            ? "Dinlemeye devam et"
                            : "Hikâyeyi dinle"}
                        </Button>
                      </View>
                    </View>
                    {desktop && (
                      <View style={s.ritual}>
                        <View style={s.ritualIcon}>
                          <Moon size={23} color={C.green} strokeWidth={1.3} />
                        </View>
                        <Eyebrow>GÜNÜN KÜÇÜK MOLASI</Eyebrow>
                        <Text style={s.ritualTitle}>
                          Bir fincan çay.{"\n"}Biraz sessizlik.{"\n"}Bir güzel
                          hikâye.
                        </Text>
                        <View style={s.ritualLine} />
                        <Label style={[s.small, { lineHeight: 22 }]}>
                          Kendine ayırdığın zaman,{"\n"}en iyi kaldığın yerdir.
                        </Label>
                        <View style={[s.row, { gap: 7, marginTop: 18 }]}>
                          <Leaf size={14} color={C.green} />
                          <Label style={s.small}>Aceleye gerek yok.</Label>
                        </View>
                      </View>
                    )}
                  </View>
                )}
                <View
                  style={[
                    s.between,
                    { marginTop: query ? 5 : 32, marginBottom: 17 },
                  ]}
                >
                  <View>
                    <Text style={s.sectionTitle}>
                      {query
                        ? "Arama sonuçları"
                        : "Küçük hikâyeler, büyük hisler"}
                    </Text>
                    <Label style={[s.small, { marginTop: 6 }]}>
                      {query
                        ? `“${query}” için ${found ? "1" : "0"} hikâye`
                        : "Kataloğumuzun ilk sayfası. Yeni hikâyelere yer açıyoruz."}
                    </Label>
                  </View>
                  {roomy && (
                    <View style={s.countBadge}>
                      <Label style={s.small}>1 özgün hikâye</Label>
                    </View>
                  )}
                </View>
                <View
                  style={[
                    s.row,
                    { gap: 9, marginBottom: 18, flexWrap: "wrap" },
                  ]}
                >
                  {["Tümü", "Kısa hikâyeler", "Kaydedilenler"].map((item) => (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: filter === item }}
                      key={item}
                      onPress={() => setFilter(item)}
                      style={[s.chip, filter === item && s.chipActive]}
                    >
                      <Label
                        style={[
                          s.small,
                          filter === item && {
                            color: C.paper,
                            fontFamily: "Manrope_600SemiBold",
                          },
                        ]}
                      >
                        {item}
                      </Label>
                    </Pressable>
                  ))}
                </View>
                {found ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Kıyıdaki Işık ayrıntısını aç"
                    onPress={openBook}
                    style={({
                      hovered,
                    }: {
                      pressed: boolean;
                      hovered?: boolean;
                    }) => [s.catalogRow, hovered && { borderColor: "#A7B5A1" }]}
                  >
                    <Cover width={70} height={92} />
                    <View style={{ flex: 1, gap: 7 }}>
                      <Label style={[s.medium, { fontSize: 18 }]}>
                        Kıyıdaki Işık
                      </Label>
                      <Label style={s.small}>Duru için özgün hikâye</Label>
                      <View style={[s.row, { gap: 8 }]}>
                        <Label style={s.small}>Kısa hikâye</Label>
                        <View style={s.dot} />
                        <Label style={s.small}>4 bölüm · 8 paragraf</Label>
                        <View style={s.demoBadge}>
                          <Label style={s.demoText}>{profile.badge.toLocaleUpperCase('tr-TR')}</Label>
                        </View>
                      </View>
                    </View>
                    {roomy && (
                      <Label style={s.small}>{time(listen.duration)} dk</Label>
                    )}
                    <ChevronRight size={21} color={C.green} />
                  </Pressable>
                ) : (
                  <View style={s.empty}>
                    <Search size={29} color={C.muted} />
                    <Text style={s.sectionTitle}>
                      {query
                        ? "Burada henüz bir hikâye yok."
                        : "Henüz kaydedilmiş hikâyen yok."}
                    </Text>
                    <Label style={s.small}>
                      {query
                        ? "Başka bir kelimeyle aramayı dene."
                        : "Hikâyeyi kitap ayrıntısındaki yer imiyle kaydedebilirsin."}
                    </Label>
                    <Button
                      secondary
                      icon={ArrowLeft}
                      onPress={() => {
                        setQuery("");
                        setFilter("Tümü");
                      }}
                    >
                      Tüm hikâyelere dön
                    </Button>
                  </View>
                )}
                {!query && (
                  <View style={{ marginTop: 30 }}>
                    <View style={[s.between, { marginBottom: 15 }]}>
                      <Text style={s.sectionTitle}>Hikâyenin sesi</Text>
                      <View style={s.demoBadge}>
                        <Label style={s.demoText}>{hasAiNarrators ? 'AI DENEME' : 'DEMO'}</Label>
                      </View>
                    </View>
                    <NarratorInfo />
                  </View>
                )}
              </>
            )}
            {page === "detail" && (
              <>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setPage("discover")}
                  style={[
                    s.row,
                    { gap: 8, alignSelf: "flex-start", marginBottom: 28 },
                  ]}
                >
                  <ArrowLeft size={17} color={C.green} />
                  <Label style={s.medium}>Keşfet'e dön</Label>
                </Pressable>
                <View
                  style={[
                    s.row,
                    {
                      alignItems: "flex-start",
                      gap: roomy ? 37 : 22,
                      flexDirection: roomy ? "row" : "column",
                    },
                  ]}
                >
                  <View
                    style={[s.detailCover, !roomy && { alignSelf: "center" }]}
                  >
                    <Cover
                      width={roomy ? 223 : 200}
                      height={roomy ? 306 : 274}
                    />
                  </View>
                  <View style={{ flex: 1, gap: 17, width: "100%" }}>
                    <View style={s.between}>
                      <Eyebrow>ÖZGÜN KISA HİKÂYE</Eyebrow>
                      <IconButton
                        icon={Bookmark}
                        label={
                          listen.favorite
                            ? "Kitaplıktan kaldır"
                            : "Kitaplığa kaydet"
                        }
                        active={listen.favorite}
                        onPress={listen.toggleFavorite}
                      />
                    </View>
                    <Text style={[s.heading, { fontSize: 38 }]}>
                      Kıyıdaki Işık
                    </Text>
                    <Label style={s.author}>Duru için özgün hikâye</Label>
                    <Label style={[s.subtitle, { lineHeight: 26 }]}>
                      {story.description}
                    </Label>
                    <View style={[s.row, { gap: 10, flexWrap: "wrap" }]}>
                      <Headphones size={16} color={C.muted} />
                      <Label style={s.small}>
                        {time(listen.duration)} dk · 4 bölüm · 8 paragraf
                      </Label>
                      <View style={s.demoBadge}>
                        <Label style={s.demoText}>{profile.badge.toLocaleUpperCase('tr-TR')}</Label>
                      </View>
                    </View>
                    <View style={[s.row, { gap: 10, flexWrap: "wrap" }]}>
                      <Button
                        icon={listen.playing ? Pause : Play}
                        onPress={listen.toggle}
                      >
                        {listen.playing
                          ? "Duraklat"
                          : listen.completed
                            ? "Yeniden dinle"
                            : listen.started
                              ? "Kaldığım yerden dinle"
                              : "Dinlemeye başla"}
                      </Button>
                      <Button
                        secondary
                        icon={Headphones}
                        onPress={() => openSheet("player")}
                      >
                        Oynatıcıyı aç
                      </Button>
                    </View>
                    {listen.started && (
                      <View style={{ gap: 5 }}>
                        <Label style={s.small}>
                          {listen.completed
                            ? "Hikâyeyi tamamladın."
                            : `%${progress} dinlendi · ${listen.paragraph.id.slice(1)}. paragraftasın`}
                        </Label>
                        <Progress listen={listen} />
                      </View>
                    )}
                  </View>
                </View>
                <View style={{ marginTop: 32, gap: 15 }}>
                  <Text style={s.sectionTitle}>Anlatıcı</Text>
                  <NarratorInfo />
                </View>
                <View style={{ marginTop: 29, gap: 14 }}>
                  <View style={s.between}>
                    <Text style={s.sectionTitle}>Bölümler & paragraflar</Text>
                    <Label style={s.small}>Bir paragraftan başla</Label>
                  </View>
                  <Paragraphs listen={listen} />
                </View>
                <View style={s.reading}>
                  <Eyebrow>ŞİMDİKİ PARAGRAF</Eyebrow>
                  <Text style={s.readingText}>
                    {
                      story.paragraphs.find((p) => p.id === listen.paragraph.id)
                        ?.text
                    }
                  </Text>
                </View>
              </>
            )}
            {page === "library" && (
              <>
                <View style={s.intro}>
                  <Eyebrow>SANA AİT HİKÂYELER</Eyebrow>
                  <Text style={s.heading}>Kaldığın yer, burada.</Text>
                  <Label style={s.subtitle}>
                    Dinleme ilerlemen bu cihazda saklanır.
                  </Label>
                </View>
                {listen.started || listen.favorite ? (
                  <View style={s.libraryCard}>
                    <Cover width={118} height={162} />
                    <View style={{ flex: 1, gap: 12 }}>
                      <Text style={s.sectionTitle}>Kıyıdaki Işık</Text>
                      <Label style={s.small}>
                        {listen.completed
                          ? "Tamamlandı"
                          : listen.started
                            ? `%${progress} dinlendi · ${listen.paragraph.id.slice(1)}. paragraf`
                            : "Kitaplığına kaydedildi"}
                      </Label>
                      <Progress listen={listen} />
                      <Button
                        style={{ alignSelf: "flex-start" }}
                        onPress={() => {
                          openBook();
                          if (!listen.playing) listen.toggle();
                        }}
                      >
                        {listen.completed
                          ? "Yeniden dinle"
                          : listen.started
                            ? "Devam et"
                            : "Dinlemeye başla"}
                      </Button>
                    </View>
                  </View>
                ) : (
                  <View style={s.empty}>
                    <Library size={35} color={C.green} />
                    <Text style={s.sectionTitle}>İlk hikâyeni bekliyor.</Text>
                    <Label style={s.small}>
                      Dinlediğin ve kaydettiğin hikâyeler burada görünür.
                    </Label>
                    <Button icon={Compass} onPress={() => setPage("discover")}>
                      Hikâyeleri keşfet
                    </Button>
                  </View>
                )}
              </>
            )}
            {page === "about" && (
              <View style={{ maxWidth: 720, gap: 24 }}>
                <View style={s.intro}>
                  <Eyebrow>DAHA SAKİN BİR DİNLEME</Eyebrow>
                  <Text style={s.heading}>Hikâyelere yer açıyoruz.</Text>
                  <Label style={s.subtitle}>
                    Duru, Türkçe sesli kitaplar için küçük bir başlangıç.
                  </Label>
                </View>
                <View style={s.aboutCard}>
                  <Leaf size={26} color={C.green} />
                  <Text style={s.sectionTitle}>
                    Bir hikâye. Tek ses.
                  </Text>
                  <Label style={s.aboutText}>
                    Bu prototipteki “Kıyıdaki Işık” Duru için yazılmış özgün bir
                    hikâyedir. Kapak uygulama içinde özgün olarak çizilmiştir.
                    {hasAiNarrators
                      ? " Hikâyenin tamamı Anlatıcı 1'in önceden hazırlanmış ElevenLabs AI deneme kaydıyla oynatılır."
                      : " Hikâyenin tamamı Microsoft Tolga Türkçe sistem sesiyle hazırlanmış tek demo kaydıyla oynatılır."}
                    {" "}{narratorReviewNotice}
                  </Label>
                </View>
                <View style={s.aboutCard}>
                  <Bookmark size={25} color={C.green} />
                  <Text style={s.sectionTitle}>Kaldığın yeri hatırlar.</Text>
                  <Label style={s.aboutText}>
                    İlerlemen, okuma hızın ve yer imin yalnızca
                    bu cihazda saklanır. Hesap, ödeme, mikrofon kaydı ve ses
                    klonlama yoktur. Prototipin içinde servis anahtarı bulunmaz.
                  </Label>
                </View>
                <View style={s.aboutCard}>
                  <Headphones size={25} color={C.green} />
                  <Text style={s.sectionTitle}>
                    Hikâyeyi rahatça dinle.
                  </Text>
                  <Label style={s.aboutText}>
                    Ses kalitesi dinleyerek değerlendirilir. Deneme kaydı ticari
                    yayın için onaylanmış değildir.
                    Telefonlarda arka plan ve kilit ekranı kontrolleri
                    geliştirme derlemesinde ayrıca test edilmelidir. Uyku
                    zamanlayıcısı uygulama açıkken çalışır; işletim sistemi arka
                    planda zamanlayıcıyı geciktirebilir.
                  </Label>
                </View>
              </View>
            )}
            <View style={s.footer}>
              <BookOpen size={15} color={C.muted} />
              <Label style={s.small}>Duru · Az gürültü, çok hikâye.</Label>
              <View style={{ flex: 1 }} />
              {roomy && (
                <Label style={s.small}>Özgün içerik · Anahtarsız demo</Label>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
      <View
        style={[
          s.miniPlayer,
          {
            paddingHorizontal: desktop ? 28 : 15,
            paddingBottom: Math.max(18, insets.bottom + 10),
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tam oynatıcıyı aç"
          onPress={() => openSheet("player")}
          style={[
            s.row,
            {
              gap: 12,
              width: desktop ? 300 : undefined,
              flex: desktop ? undefined : 1,
            },
          ]}
        >
          <Cover width={45} height={58} compact />
          <View style={{ gap: 5 }}>
            <Label style={s.medium}>Kıyıdaki Işık</Label>
            <Label style={[s.small, { fontSize: 11 }]}>
              {listen.completed
                ? "Tamamlandı"
                : listen.started
                  ? profile.label + " · " + profile.badge
                  : "Dinlemeye hazır · " + profile.badge}
            </Label>
          </View>
        </Pressable>
        <View
          style={{
            flex: desktop ? 1 : undefined,
            maxWidth: 540,
            alignItems: "center",
            gap: 1,
          }}
        >
          <Transport listen={listen} />
          {desktop && (
            <View style={[s.row, { gap: 12, width: "100%" }]}>
              <Label style={s.time}>{time(listen.seconds)}</Label>
              <View style={{ flex: 1 }}>
                <Progress listen={listen} />
              </View>
              <Label style={s.time}>{time(listen.duration)}</Label>
            </View>
          )}
        </View>
        {desktop && (
          <View
            style={[s.row, { flex: 1, justifyContent: "flex-end", gap: 7 }]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Oynatma hızı"
              onPress={() => openSheet("speed")}
              style={s.iconButton}
            >
              <Label style={s.medium}>{listen.rate}×</Label>
            </Pressable>
            <IconButton
              icon={Moon}
              label="Uyku zamanlayıcısı"
              active={!!listen.sleepUntil}
              onPress={() => openSheet("sleep")}
            />
            <View style={s.divider} />
            <IconButton
              icon={ChevronUp}
              label="Tam oynatıcıyı aç"
              onPress={() => openSheet("player")}
            />
          </View>
        )}
      </View>
      <Modal
        transparent
        visible={sheet !== null}
        animationType="fade"
        onRequestClose={closeSheet}
      >
        <View style={s.modalOverlay}>
          <Pressable
            accessibilityLabel="Pencereyi kapat"
            onPress={closeSheet}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              s.modalCard,
              { width: Math.min(width - 28, sheet === "player" ? 570 : 640) },
            ]}
          >
            <View
              style={[s.between, { paddingHorizontal: 23, paddingTop: 14 }]}
            >
              {sheet === "player" ? (
                <Eyebrow>ŞİMDİ DİNLİYORSUN</Eyebrow>
              ) : (
                <Text style={s.sectionTitle}>
                  {sheet === "speed"
                      ? "Kendi hızında dinle"
                      : sheet === "sleep"
                        ? "Uyku zamanlayıcısı"
                        : "Bölümler & paragraflar"}
                </Text>
              )}
              <IconButton
                icon={X}
                label="Pencereyi kapat"
                onPress={closeSheet}
              />
            </View>
            <ScrollView
              contentContainerStyle={{ padding: 25, paddingTop: 14, gap: 20 }}
            >
              {sheet === "player" && (
                <>
                  <View style={{ alignItems: "center", gap: 17 }}>
                    <Cover width={184} height={250} />
                    <Text style={s.playerTitle}>Kıyıdaki Işık</Text>
                    <Label style={s.small}>
                      {profile.label} · {profile.kind === 'demo' ? 'Demo sistem sesi' : profile.stage === 'preview' ? 'ElevenLabs AI deneme kaydı' : 'ElevenLabs AI anlatıcı'}
                    </Label>
                  </View>
                  <View style={{ gap: 8 }}>
                    <Label style={[s.small, { textAlign: "center" }]}>
                      {listen.completed
                        ? "Hikâye tamamlandı"
                        : `${story.paragraphs.find((p) => p.id === listen.paragraph.id)?.title} · ${Number(listen.paragraph.id.slice(1))}/8 paragraf`}
                    </Label>
                    <Progress listen={listen} large />
                    <Transport listen={listen} big />
                  </View>
                  <View style={[s.row, { justifyContent: "space-around" }]}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => openSheet("speed", true)}
                      style={s.playerOption}
                    >
                      <Label style={s.medium}>{listen.rate}×</Label>
                      <Label style={s.small}>Hız</Label>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => openSheet("sleep", true)}
                      style={s.playerOption}
                    >
                      <Moon size={21} color={C.green} />
                      <Label style={s.small}>
                        {listen.sleepUntil
                          ? time(listen.sleepRemaining)
                          : "Uyku"}
                      </Label>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => openSheet("chapters", true)}
                      style={s.playerOption}
                    >
                      <ListMusic size={21} color={C.green} />
                      <Label style={s.small}>Bölümler</Label>
                    </Pressable>
                  </View>
                  {listen.error && (
                    <View accessibilityRole="alert" style={s.warning}>
                      <Label>{listen.error}</Label>
                      <Button
                        secondary
                        icon={RotateCw}
                        onPress={listen.retryAudio}
                      >
                        Yeniden dene
                      </Button>
                    </View>
                  )}
                </>
              )}
              {sheet === "speed" && (
                <>
                  <Label style={s.subtitle}>
                    Hikâye, sana iyi gelen ritimde aksın.
                  </Label>
                  <View style={[s.row, { flexWrap: "wrap", gap: 12 }]}>
                    {rates.map((rate) => (
                      <Pressable
                        accessibilityRole="radio"
                        accessibilityState={{ checked: listen.rate === rate }}
                        aria-checked={listen.rate === rate}
                        accessibilityLabel={`${rate} kat hız`}
                        key={rate}
                        onPress={() => {
                          listen.changeRate(rate);
                          closeSheet();
                        }}
                        style={[
                          s.rateChip,
                          listen.rate === rate && s.chipActive,
                        ]}
                      >
                        <Label
                          style={[
                            s.medium,
                            listen.rate === rate && { color: C.paper },
                          ]}
                        >
                          {rate}×
                        </Label>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}
              {sheet === "sleep" && (
                <>
                  <Label style={[s.subtitle, { lineHeight: 24 }]}>
                    Süre dolunca hikâye duraklar, kaldığın yer saklanır.
                  </Label>
                  {!!listen.sleepUntil && (
                    <Label style={s.medium}>
                      Kalan süre: {time(listen.sleepRemaining)}
                    </Label>
                  )}
                  <View style={[s.row, { flexWrap: "wrap", gap: 10 }]}>
                    {[1, 5, 15, 30, 45, 60].map((minutes) => (
                      <Button
                        secondary
                        icon={Moon}
                        key={minutes}
                        onPress={() => {
                          listen.setSleep(minutes);
                          closeSheet();
                        }}
                      >{`${minutes} dakika`}</Button>
                    ))}
                  </View>
                  <Button
                    secondary
                    icon={X}
                    onPress={() => {
                      listen.setSleep(0);
                      closeSheet();
                    }}
                  >
                    Zamanlayıcıyı kapat
                  </Button>
                  <Label style={[s.small, { lineHeight: 21 }]}>
                    Demo zamanlayıcısı uygulama açıkken çalışır. Telefon arka
                    planda uygulamayı askıya alırsa duraklatma gecikebilir;
                    cihaz testi bekleniyor.
                  </Label>
                </>
              )}
              {sheet === "chapters" && (
                <>
                  <Label style={s.small}>
                    Bir paragraf seçerek o paragrafın başına git.
                  </Label>
                  <Paragraphs listen={listen} />
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  body: { flex: 1, flexDirection: "row" },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.bg,
    gap: 20,
  },
  text: { fontFamily: sans, fontSize: 14, color: C.ink },
  row: { flexDirection: "row", alignItems: "center" },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  small: { fontFamily: sans, fontSize: 12, color: C.muted },
  medium: { fontFamily: "Manrope_600SemiBold", fontSize: 14, color: C.ink },
  eyebrow: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 10,
    letterSpacing: 2,
    color: C.green,
  },
  sidebar: {
    width: 238,
    padding: 25,
    paddingTop: 32,
    borderRightWidth: 1,
    borderColor: C.line,
    backgroundColor: "#F1F2E9",
  },
  logo: {
    fontFamily: "Lora_500Medium",
    fontSize: 37,
    color: C.ink,
    letterSpacing: -1.5,
  },
  logoMark: {
    width: 38,
    height: 38,
    borderWidth: 1,
    borderColor: "#B6C5AE",
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  navItem: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 13,
    borderRadius: 9,
  },
  navActive: { backgroundColor: "#E0E7D8" },
  navText: { fontSize: 13, color: C.green },
  navDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.green,
    marginLeft: "auto",
  },
  sidebarNote: {
    gap: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#DCE1D3",
    borderRadius: 11,
  },
  noteTitle: { fontFamily: serif, color: C.ink, fontSize: 22 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#7E9370" },
  header: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    borderBottomWidth: 1,
    borderColor: C.line,
  },
  headerTitle: { fontFamily: "Manrope_600SemiBold", fontSize: 15 },
  headerBadge: { flexDirection: "row", alignItems: "center", gap: 9 },
  search: {
    height: 40,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 8,
    paddingLeft: 12,
    paddingRight: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "#FDFBF6",
  },
  searchInput: {
    fontFamily: sans,
    fontSize: 12,
    color: C.ink,
    flex: 1,
    height: "100%",
    outlineStyle: "none",
  } as any,
  mobileNav: {
    flexDirection: "row",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: C.line,
    gap: 25,
  },
  mobileNavItem: {
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  content: {
    paddingTop: 32,
    paddingBottom: 8,
    maxWidth: 1420,
    width: "100%",
    alignSelf: "center",
  },
  intro: { gap: 12, marginBottom: 28 },
  heading: {
    fontFamily: serif,
    color: C.ink,
    fontSize: 37,
    letterSpacing: -1.2,
  },
  subtitle: { fontFamily: sans, color: C.muted, fontSize: 14 },
  hero: {
    minHeight: 294,
    backgroundColor: "#EBEDE2",
    borderRadius: 14,
    gap: 27,
    borderWidth: 1,
    borderColor: "#E0E4D6",
  },
  heroCover: {
    alignSelf: "center",
    transform: [{ rotate: "-3deg" }],
    boxShadow: "8px 11px 22px rgba(42,62,45,0.14)",
    borderRadius: 7,
  },
  heroTitle: {
    fontFamily: "Lora_500Medium",
    color: C.ink,
    fontSize: 30,
    letterSpacing: -0.6,
  },
  author: { fontFamily: sans, color: C.muted, fontSize: 12 },
  heroDescription: {
    fontFamily: serif,
    fontSize: 17,
    color: "#596652",
    lineHeight: 25,
  },
  tag: {
    backgroundColor: "#DDE4D2",
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  tagText: {
    fontSize: 9,
    fontFamily: "Manrope_700Bold",
    letterSpacing: 1.2,
    color: C.green,
  },
  dot: { width: 3, height: 3, backgroundColor: "#8F998C", borderRadius: 2 },
  button: {
    borderRadius: 7,
    backgroundColor: C.green,
    minHeight: 44,
    paddingHorizontal: 17,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  buttonText: {
    color: C.paper,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#C7D1BD",
  },
  ritual: {
    width: 244,
    padding: 24,
    backgroundColor: "#F0EBDF",
    borderRadius: 14,
    gap: 17,
    borderWidth: 1,
    borderColor: "#E7E0D2",
  },
  ritualIcon: {
    width: 45,
    height: 45,
    backgroundColor: "#E6E2D2",
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  ritualTitle: {
    fontFamily: serif,
    fontSize: 22,
    lineHeight: 33,
    color: "#46543F",
  },
  ritualLine: { height: 1, width: 36, backgroundColor: "#BFC6AD" },
  sectionTitle: {
    fontFamily: serif,
    color: C.ink,
    fontSize: 22,
    letterSpacing: -0.4,
  },
  countBadge: {
    borderWidth: 1,
    borderColor: C.line,
    padding: 8,
    borderRadius: 6,
  },
  chip: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 20,
  },
  chipActive: { backgroundColor: C.green, borderColor: C.green },
  catalogRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    padding: 18,
    backgroundColor: C.paper,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.line,
  },
  demoBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: "#EBE9DE",
  },
  demoText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 8,
    letterSpacing: 0.8,
    color: "#6F705B",
  },
  narratorCard: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 9,
    backgroundColor: C.paper,
  },
  footer: {
    marginTop: 35,
    paddingVertical: 21,
    borderTopWidth: 1,
    borderColor: C.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  miniPlayer: {
    minHeight: 101,
    paddingVertical: 13,
    paddingBottom: 18,
    backgroundColor: "#FFFDF8",
    borderTopWidth: 1,
    borderColor: "#DADFD2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    boxShadow: "0 -3px 18px rgba(50,65,43,0.03)",
  },
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
  },
  play: {
    backgroundColor: C.green,
    alignItems: "center",
    justifyContent: "center",
  },
  skip: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  skipNumber: {
    fontSize: 8,
    position: "absolute",
    top: 18,
    fontFamily: "Manrope_700Bold",
  },
  time: { color: C.muted, fontFamily: sans, fontSize: 10, width: 30 },
  progressTrack: { height: 3, backgroundColor: "#DDE2D6", borderRadius: 3 },
  progressFill: { height: 3, backgroundColor: C.green, borderRadius: 3 },
  progressDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.green,
    position: "absolute",
    top: -2,
  },
  divider: {
    height: 24,
    width: 1,
    backgroundColor: C.line,
    marginHorizontal: 5,
  },
  empty: {
    alignItems: "center",
    gap: 17,
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#CBD2C1",
    borderRadius: 12,
  },
  detailCover: {
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#E8EADF",
    boxShadow: "0 9px 25px rgba(50,65,43,0.09)",
  },
  paragraph: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    padding: 16,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E8DF",
  },
  paragraphNumber: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  reading: {
    marginTop: 25,
    backgroundColor: "#EEEBDF",
    borderRadius: 10,
    padding: 23,
    gap: 14,
  },
  readingText: {
    fontFamily: serif,
    fontSize: 16,
    lineHeight: 29,
    color: "#4B5546",
  },
  libraryCard: {
    padding: 25,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 12,
    flexDirection: "row",
    gap: 25,
    backgroundColor: C.paper,
  },
  aboutCard: {
    gap: 17,
    borderWidth: 1,
    borderColor: C.line,
    padding: 25,
    borderRadius: 12,
    backgroundColor: C.paper,
  },
  aboutText: { fontFamily: sans, fontSize: 14, lineHeight: 26, color: C.muted },
  warning: {
    backgroundColor: "#F4E7D6",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    gap: 10,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#E5ECDC",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(30,45,35,.42)",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  modalCard: {
    maxHeight: "95%",
    backgroundColor: C.bg,
    borderRadius: 18,
    boxShadow: "0 20px 70px rgba(25,40,30,.2)",
  },
  playerTitle: { fontFamily: serif, color: C.ink, fontSize: 29 },
  playerOption: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    minWidth: 65,
  },
  rateChip: {
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 9,
  },
});
