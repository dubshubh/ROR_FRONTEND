"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = { name: string; label: string; defaultValue?: string; required?: boolean };

export function AdminDateField({ name, label, defaultValue = "", required }: Props) {
  const initial = parseDate(defaultValue) ?? new Date();
  const [value, setValue] = useState(defaultValue);
  const [month, setMonth] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const days = calendarDays(month);
  return <label className="admin-field"><span>{label}{required ? <i>Required</i> : null}</span><div ref={root} className="admin-date-root"><input type="hidden" name={name} value={value}/><button type="button" className="admin-date-trigger" aria-expanded={open} onClick={() => setOpen((current) => !current)}><span className={value ? "" : "is-placeholder"}>{value ? formatDisplay(value) : "Select a date"}</span><CalendarDays/></button>{open ? <div className="admin-calendar"><header><button type="button" aria-label="Previous month" onClick={() => setMonth(addMonths(month,-1))}><ChevronLeft/></button><strong>{month.toLocaleDateString("en-IN",{month:"long",year:"numeric"})}</strong><button type="button" aria-label="Next month" onClick={() => setMonth(addMonths(month,1))}><ChevronRight/></button></header><div className="admin-calendar-week">{["Mo","Tu","We","Th","Fr","Sa","Su"].map((day)=><span key={day}>{day}</span>)}</div><div className="admin-calendar-grid">{days.map((day)=>{const dateValue=toValue(day);const outside=day.getMonth()!==month.getMonth();const selected=dateValue===value;const today=dateValue===toValue(new Date());return <button type="button" key={dateValue} className={`${outside?"is-outside ":""}${selected?"is-selected ":""}${today?"is-today":""}`} onClick={()=>{setValue(dateValue);setOpen(false)}}>{day.getDate()}</button>})}</div><footer><button type="button" onClick={()=>setValue("")}>Clear</button><button type="button" onClick={()=>{const today=new Date();setValue(toValue(today));setMonth(new Date(today.getFullYear(),today.getMonth(),1));setOpen(false)}}>Today</button></footer></div>:null}</div></label>;
}

function parseDate(value:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;const [year,month,day]=value.split("-").map(Number);return new Date(year,month-1,day)}
function toValue(date:Date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`}
function formatDisplay(value:string){return parseDate(value)?.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})??value}
function addMonths(date:Date,amount:number){return new Date(date.getFullYear(),date.getMonth()+amount,1)}
function calendarDays(month:Date){const first=new Date(month.getFullYear(),month.getMonth(),1);const offset=(first.getDay()+6)%7;const start=new Date(first);start.setDate(1-offset);return Array.from({length:42},(_,index)=>{const day=new Date(start);day.setDate(start.getDate()+index);return day})}
