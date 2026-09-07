"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toGregorian, toJalaali } from "jalaali-js";

type Item = {
  id: string;
  title: string;
  date: string;
  status: string;
  type?: string;
  topic?: string;
  url: string;
};

const MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];
const WEEKDAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

function fa(value: number | string) {
  return String(value).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function daysInJalaliMonth(year: number, month: number) {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  const g = toGregorian(year + 1, 1, 1);
  const prev = new Date(g.gy, g.gm - 1, g.gd);
  prev.setDate(prev.getDate() - 1);
  return prev.getDate();
}

function jalaliToday() {
  const d = new Date();
  // Convert through Intl so the browser timezone does not create a Persian-date off-by-one.
  const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    year: "numeric", month: "numeric", day: "numeric"
  }).formatToParts(d);
  const get = (type: string) => Number(parts.find(p => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

function dateKey(date: string) {
  return date.slice(0, 10);
}

export default function Home() {
  const today = useMemo(jalaliToday, []);
  const [year, setYear] = useState(today.year);
  const [month, setMonth] = useState(today.month);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const res = await fetch("/api/content", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در دریافت اطلاعات از Notion");
      setItems(data.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای نامشخص");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const ms = Number(process.env.NEXT_PUBLIC_POLL_INTERVAL || 30000);
    const timer = setInterval(load, ms);
    return () => clearInterval(timer);
  }, [load]);

  const cells = useMemo(() => {
    const firstGregorian = toGregorian(year, month, 1);
    const first = new Date(firstGregorian.gy, firstGregorian.gm - 1, firstGregorian.gd);
    // JS: Sunday=0. Persian calendar starts Saturday, so Saturday=0.
    const leading = (first.getDay() + 1) % 7;
    const total = daysInJalaliMonth(year, month);
    const result: Array<number | null> = [];
    for (let i = 0; i < leading; i++) result.push(null);
    for (let d = 1; d <= total; d++) result.push(d);
    while (result.length % 7) result.push(null);
    return result;
  }, [year, month]);

  const itemsByDay = useMemo(() => {
    const map = new Map<number, Item[]>();
    for (const item of items) {
      const parts = item.date.slice(0, 10).split("-").map(Number);
      if (parts.length !== 3) continue;
      // Notion returns Gregorian ISO dates. Convert to Jalali.
      const j = toJalaali(parts[0], parts[1], parts[2]);
      if (j.jy !== year || j.jm !== month) continue;
      const arr = map.get(j.jd) || [];
      arr.push(item);
      map.set(j.jd, arr);
    }
    return map;
  }, [items, year, month]);

  function changeMonth(delta: number) {
    let m = month + delta, y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setMonth(m); setYear(y);
  }

  const goToday = () => {
    setYear(today.year); setMonth(today.month);
  };

  return (
    <main className="page">
      <section className="calendar-shell">
        <header className="topbar">
          <div>
            <div className="eyebrow">NOTION CONTENT CALENDAR</div>
            <h1>تقویم محتوایی شمسی</h1>
            <p>محتواهای با وضعیت «{process.env.NEXT_PUBLIC_VISIBLE_STATUS || "ارسال شده"}» نمایش داده می‌شوند.</p>
          </div>
          <div className="actions">
            <button onClick={goToday}>امروز</button>
            <button onClick={() => changeMonth(-1)} aria-label="ماه قبل">‹</button>
            <button onClick={() => changeMonth(1)} aria-label="ماه بعد">›</button>
          </div>
        </header>

        <div className="month-title">{MONTHS[month - 1]} {fa(year)}</div>

        {error && <div className="error">⚠️ {error}</div>}
        {loading && <div className="loading">در حال دریافت اطلاعات...</div>}

        <div className="weekdays">
          {WEEKDAYS.map(d => <div key={d}>{d}</div>)}
        </div>

        <div className="grid">
          {cells.map((day, i) => (
            <div className={`cell ${day === today.day && month === today.month && year === today.year ? "today" : ""}`} key={i}>
              {day && (
                <>
                  <div className="day-number">{fa(day)}</div>
                  <div className="events">
                    {(itemsByDay.get(day) || []).map(item => (
                      <a className="event" href={item.url} target="_blank" rel="noreferrer" key={item.id} title={item.title}>
                        <strong>{item.title}</strong>
                        <span>{item.type || item.topic || "محتوا"} · {item.status}</span>
                      </a>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <footer className="footer">
          <span>● اتصال زنده به Notion</span>
          <button className="refresh" onClick={load}>↻ بروزرسانی</button>
        </footer>
      </section>
    </main>
  );
}