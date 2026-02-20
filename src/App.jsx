import './storage.js';
import { useState, useEffect, useCallback } from "react";
// font is imported via CSS (@import) in index.css, not through JavaScript
import { ChevronRight, ChevronLeft, Calendar, CheckCircle2, Circle, Star, Moon, Sun, TrendingUp } from "lucide-react";
const CATEGORIES = [
  {
    id: "prayers",
    name: "الصلوات الخمس",
    icon: "🕌",
    color: "from-emerald-500 to-teal-600",
    items: [
      { id: "fajr", name: "الفجر", pts: 20 },
      { id: "dhuhr", name: "الظهر", pts: 20 },
      { id: "asr", name: "العصر", pts: 20 },
      { id: "maghrib", name: "المغرب", pts: 20 },
      { id: "isha", name: "العشاء", pts: 20 },
    ],
  },
  {
    id: "good_deeds",
    name: "أعمال صالحة",
    icon: "💚",
    color: "from-teal-500 to-cyan-600",
    items: [
      { id: "sadaqa", name: "صدقة", pts: 15 },
      { id: "sila", name: "صلة الرحم", pts: 15 },
      { id: "suroor", name: "إدخال السرور على مسلم", pts: 15 },
      { id: "iftar", name: "إفطار صائم", pts: 15 },
    ],
  },
  {
    id: "quran",
    name: "قرآن",
    icon: "📖",
    color: "from-cyan-500 to-sky-600",
    items: [
      { id: "tilawa", name: "ورد تلاوة", pts: 20 },
      { id: "tadabbur", name: "ورد تدبر", pts: 20 },
      { id: "sama3", name: "ورد سماع", pts: 10 },
    ],
  },
  {
    id: "adhkar",
    name: "أذكار",
    icon: "☀️",
    color: "from-sky-500 to-emerald-500",
    items: [
      { id: "sabah", name: "أذكار الصباح", pts: 15 },
      { id: "masa2", name: "أذكار المساء", pts: 15 },
      { id: "amma", name: "أذكار عامة ودعاء", pts: 10 },
    ],
  },
  {
    id: "nawafil",
    name: "النوافل",
    icon: "🌙",
    color: "from-emerald-400 to-teal-500",
    items: [
      { id: "rawatib", name: "السنن الرواتب 12 ركعة", pts: 20 },
      { id: "duha", name: "الضحى", pts: 15 },
      { id: "qiyam", name: "قيام الليل تراويح تهجد", pts: 20 },
    ],
  },
];

const TOTAL_POSSIBLE = CATEGORIES.reduce(
  (sum, cat) => sum + cat.items.reduce((s, i) => s + i.pts, 0),
  0
);

const dateKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const ARABIC_MONTHS = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"
];
const ARABIC_DAYS = ["أح","إث","ثل","أر","خم","جم","سب"];

function getMood(pct) {
  if (pct === 100) return { emoji: "🌟", label: "مثالي", color: "text-yellow-400" };
  if (pct >= 80) return { emoji: "😊", label: "ممتاز", color: "text-emerald-400" };
  if (pct >= 60) return { emoji: "🙂", label: "جيد", color: "text-teal-400" };
  if (pct >= 40) return { emoji: "😐", label: "مقبول", color: "text-cyan-400" };
  if (pct >= 20) return { emoji: "😔", label: "ضعيف", color: "text-orange-400" };
  return { emoji: "😢", label: "ابدأ الآن", color: "text-red-400" };
}

export default function IslamicTracker() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyData, setDailyData] = useState({});
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("dailyData");
        if (res) setDailyData(JSON.parse(res.value));
      } catch (_) {}
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.storage.set("dailyData", JSON.stringify(dailyData)).catch(() => {});
  }, [dailyData, loaded]);

  const key = dateKey(selectedDate);
  const dayChecks = dailyData[key] || {};

  const toggle = useCallback((itemId) => {
    setDailyData((prev) => {
      const k = dateKey(selectedDate);
      const day = { ...(prev[k] || {}) };
      day[itemId] = !day[itemId];
      return { ...prev, [k]: day };
    });
  }, [selectedDate]);

  const earnedPts = CATEGORIES.reduce(
    (sum, cat) =>
      sum + cat.items.reduce((s, i) => s + (dayChecks[i.id] ? i.pts : 0), 0),
    0
  );
  const pct = Math.round((earnedPts / TOTAL_POSSIBLE) * 100);
  const mood = getMood(pct);

  // Calendar helpers
  const firstDayOfMonth = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1);
  const daysInMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate();
  const startDow = firstDayOfMonth.getDay(); // 0=Sun
  const calCells = [];
  for (let i = 0; i < startDow; i++) calCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calCells.push(d);

  const selectCalDay = (d) => {
    setSelectedDate(new Date(calMonth.getFullYear(), calMonth.getMonth(), d));
    setCalendarOpen(false);
  };

  const isToday = (d) => {
    const now = new Date();
    return d === now.getDate() && calMonth.getMonth() === now.getMonth() && calMonth.getFullYear() === now.getFullYear();
  };

  const isSelected = (d) => {
    return d === selectedDate.getDate() && calMonth.getMonth() === selectedDate.getMonth() && calMonth.getFullYear() === selectedDate.getFullYear();
  };

  const dayHasData = (d) => {
    const k = dateKey(new Date(calMonth.getFullYear(), calMonth.getMonth(), d));
    return dailyData[k] && Object.values(dailyData[k]).some(Boolean);
  };

  const goDay = (delta) => {
    const nd = new Date(selectedDate);
    nd.setDate(nd.getDate() + delta);
    setSelectedDate(nd);
  };

const formattedDate = selectedDate.toLocaleDateString("ar-EG", {
  weekday: "long", 
  year: "numeric", 
  month: "long", 
  day: "numeric",
  timeZone: "Asia/Riyadh" // This ensures correct timezone
});

return (
  <div
    dir="rtl"
    className="min-h-screen bg-gray-950 text-gray-100"
    style={{ fontFamily: "'Cairo', 'Segoe UI', Tahoma, sans-serif" }}
  >
      {/* Decorative bg */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-emerald-900 opacity-20 blur-3xl" />
        <div className="absolute top-1/2 -left-32 w-80 h-80 rounded-full bg-teal-900 opacity-15 blur-3xl" />
        <div className="absolute -bottom-20 right-1/3 w-72 h-72 rounded-full bg-cyan-900 opacity-10 blur-3xl" />
      </div>

      <div className="relative max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-gradient-to-l from-emerald-900/60 to-teal-900/60 border border-emerald-700/40 rounded-2xl px-5 py-2 mb-3">
            <Moon size={16} className="text-emerald-400" />
            <span className="text-emerald-300 text-sm font-medium tracking-wide">متابعة العبادات اليومية</span>
            <Star size={16} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-l from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
            دفتر الحسنات
          </h1>
        </div>

        {/* Date Navigator */}
        <div className="bg-gray-900/80 backdrop-blur border border-emerald-900/40 rounded-2xl p-4 mb-4 flex items-center justify-between">
          <button
            onClick={() => goDay(-1)}
            className="w-9 h-9 rounded-xl bg-emerald-900/40 hover:bg-emerald-800/60 flex items-center justify-center transition-colors text-emerald-300"
          >
            <ChevronRight size={18} />
          </button>
          <button
            onClick={() => { setCalMonth(new Date(selectedDate)); setCalendarOpen(true); }}
            className="flex flex-col items-center gap-0.5 group"
          >
            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-teal-400" />
              <span className="text-teal-300 text-sm font-medium group-hover:text-teal-200 transition-colors">{formattedDate}</span>
            </div>
            <div className="h-0.5 w-16 bg-gradient-to-l from-emerald-500 to-teal-500 rounded-full opacity-60 group-hover:opacity-100 transition-opacity" />
          </button>
          <button
            onClick={() => goDay(1)}
            className="w-9 h-9 rounded-xl bg-emerald-900/40 hover:bg-emerald-800/60 flex items-center justify-center transition-colors text-emerald-300"
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="bg-gradient-to-l from-emerald-900/50 to-teal-900/50 border border-emerald-700/30 rounded-2xl p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{mood.emoji}</span>
              <div>
                <div className={`text-sm font-bold ${mood.color}`}>{mood.label}</div>
                <div className="text-gray-400 text-xs">حالة اليوم</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{pct}<span className="text-lg text-emerald-400">%</span></div>
              <div className="text-gray-400 text-xs flex items-center gap-1 justify-end">
                <TrendingUp size={11} className="text-emerald-500" />
                <span>{earnedPts} / {TOTAL_POSSIBLE} نقطة</span>
              </div>
            </div>
          </div>
          <div className="relative h-3 bg-gray-800/80 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 right-0 bg-gradient-to-l from-emerald-500 via-teal-500 to-cyan-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-full" />
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-3">
          {CATEGORIES.map((cat) => {
            const catDone = cat.items.filter((i) => dayChecks[i.id]).length;
            const catTotal = cat.items.length;
            const catPts = cat.items.reduce((s, i) => s + (dayChecks[i.id] ? i.pts : 0), 0);
            const catMaxPts = cat.items.reduce((s, i) => s + i.pts, 0);
            return (
              <div
                key={cat.id}
                className="bg-gray-900/70 backdrop-blur border border-gray-800/60 rounded-2xl overflow-hidden"
              >
                {/* Category Header */}
                <div className={`bg-gradient-to-l ${cat.color} p-3 flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{cat.icon}</span>
                    <span className="font-bold text-white text-sm">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-white/20 rounded-lg px-2 py-0.5 text-white text-xs font-medium">
                      {catPts}/{catMaxPts} نقطة
                    </span>
                    <span className="bg-white/20 rounded-lg px-2 py-0.5 text-white text-xs">
                      {catDone}/{catTotal}
                    </span>
                  </div>
                </div>
                {/* Items */}
                <div className="divide-y divide-gray-800/40">
                  {cat.items.map((item) => {
                    const checked = !!dayChecks[item.id];
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggle(item.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 transition-all duration-200 text-right group ${
                          checked
                            ? "bg-emerald-950/40 hover:bg-emerald-950/60"
                            : "hover:bg-gray-800/40"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {checked ? (
                            <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0" />
                          ) : (
                            <Circle size={20} className="text-gray-600 group-hover:text-gray-400 flex-shrink-0 transition-colors" />
                          )}
                          <span className={`text-sm transition-colors ${checked ? "text-emerald-300 line-through opacity-75" : "text-gray-200"}`}>
                            {item.name}
                          </span>
                        </div>
                        <span className={`text-xs font-bold rounded-lg px-2 py-1 transition-colors ${
                          checked
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-gray-800 text-gray-500"
                        }`}>
                          {item.pts} نقطة
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-gray-600 text-xs">
          <Sun size={12} className="inline ml-1 text-teal-700" />
          كل يوم فرصة جديدة للتقرب إلى الله
          <Moon size={12} className="inline mr-1 text-teal-700" />
        </div>
      </div>

      {/* Calendar Modal */}
      {calendarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setCalendarOpen(false)}
        >
          <div
            className="bg-gray-900 border border-emerald-800/50 rounded-3xl p-5 w-full max-w-sm shadow-2xl shadow-emerald-950/50"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Cal Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))}
                className="w-8 h-8 rounded-xl bg-emerald-900/40 hover:bg-emerald-800/60 flex items-center justify-center text-emerald-300 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
              <span className="text-white font-bold text-sm">
                {ARABIC_MONTHS[calMonth.getMonth()]} {calMonth.getFullYear()}
              </span>
              <button
                onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))}
                className="w-8 h-8 rounded-xl bg-emerald-900/40 hover:bg-emerald-800/60 flex items-center justify-center text-emerald-300 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
            </div>
            {/* Day names */}
            <div className="grid grid-cols-7 mb-2">
              {ARABIC_DAYS.map((d) => (
                <div key={d} className="text-center text-gray-500 text-xs py-1">{d}</div>
              ))}
            </div>
            {/* Day cells */}
            <div className="grid grid-cols-7 gap-0.5">
              {calCells.map((d, idx) => (
                <div key={idx} className="aspect-square flex items-center justify-center">
                  {d ? (
                    <button
                      onClick={() => selectCalDay(d)}
                      className={`w-full h-full rounded-xl flex flex-col items-center justify-center text-xs font-medium transition-all relative ${
                        isSelected(d)
                          ? "bg-gradient-to-b from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-900/50"
                          : isToday(d)
                          ? "bg-emerald-900/60 text-emerald-300 border border-emerald-600/50"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      }`}
                    >
                      {d}
                      {dayHasData(d) && !isSelected(d) && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500" />
                      )}
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
            <button
              onClick={() => { setSelectedDate(new Date()); setCalendarOpen(false); }}
              className="mt-4 w-full py-2 rounded-xl bg-gradient-to-l from-emerald-600 to-teal-600 text-white text-sm font-bold hover:from-emerald-500 hover:to-teal-500 transition-all"
            >
              اليوم
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
