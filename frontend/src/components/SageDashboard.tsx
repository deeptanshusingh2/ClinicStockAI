import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  TrendingUp,
  MoreVertical,
  Sun,
  Moon,
  ShieldCheck,
  Scan,
  UserCheck,
  Layers,
  ChevronRight,
  Activity
} from 'lucide-react';
import { OllamaStatus, InventoryRecord } from '../types';

interface SageDashboardProps {
  onNavigateToAudit: () => void;
  onNavigateToInventory: () => void;
  onNavigateToAlerts: () => void;
  onOpenManualAdd: () => void;
  verifiedCount: number;
  alertCount: number;
  ollamaStatus: OllamaStatus | null;
}

export const SageDashboard: React.FC<SageDashboardProps> = ({
  onNavigateToAudit,
  onNavigateToInventory,
  onNavigateToAlerts,
  onOpenManualAdd,
  verifiedCount,
  alertCount,
  ollamaStatus,
}) => {
  const [selectedDay, setSelectedDay] = useState<string>('F');
  const [selectedDate, setSelectedDate] = useState<number>(15);
  const [activeDoctor, setActiveDoctor] = useState<string>('Dr. Emily Carter');

  // Days for the Self-reported feeling / Vital Trend card
  const weekDays = [
    { label: 'M', active: false },
    { label: 'T', active: false },
    { label: 'W', active: false },
    { label: 'T', active: false },
    { label: 'F', active: true },
    { label: 'S', active: false },
  ];

  // Calendar dates for the March 2026 strip
  const calendarDates = [
    { day: 'M', date: 12, dot: true },
    { day: 'T', date: 13, dot: true },
    { day: 'W', date: 14, dot: false },
    { day: 'T', date: 15, dot: true, isCurrent: true },
    { day: 'F', date: 16, dot: true },
    { day: 'S', date: 17, dot: false },
    { day: 'S', date: 18, dot: true },
  ];

  // Duty doctors list matching the reference image
  const doctors = [
    {
      name: 'Dr. Emily Carter',
      role: 'Chief Pharmacist',
      avatar: '/dr_emily.jpg',
      fallbackAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=200&h=200&q=80',
      available: true,
      department: 'Clinical Pharmacy'
    },
    {
      name: 'Dr. Daniel Novak',
      role: 'Staff Physician',
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&h=200&q=80',
      fallbackAvatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&h=200&q=80',
      available: false,
      department: 'Inpatient Ward'
    },
    {
      name: 'Dr. Sofia Martinez',
      role: 'Quality Inspector',
      avatar: 'https://images.unsplash.com/photo-1594824813583-11a51139423c?auto=format&fit=crop&w=200&h=200&q=80',
      fallbackAvatar: 'https://images.unsplash.com/photo-1594824813583-11a51139423c?auto=format&fit=crop&w=200&h=200&q=80',
      available: true,
      department: 'Safety & Dispensing'
    },
  ];

  // Medications matching the reference image
  const medications = [
    {
      name: 'Virelixa',
      generic: 'Amoxicillin Trihydrate',
      schedule: 'With food',
      icons: ['sun', 'moon'],
      progress: 60,
      stock: 120,
      status: 'Optimal'
    },
    {
      name: 'Cardionex',
      generic: 'Paracetamol & Metformin',
      schedule: 'After food',
      icons: ['moon'],
      progress: 97,
      stock: 84,
      status: 'High'
    },
    {
      name: 'Neurixa',
      generic: 'Neuro-calm Complex',
      schedule: 'With food',
      icons: ['sun', 'moon'],
      progress: 0,
      stock: 15,
      status: 'Restock'
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Top Banner Alert Bar if Expiry Risks exist */}
      {alertCount > 0 && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-900">
                {alertCount} Medicine Package{alertCount > 1 ? 's' : ''} Approaching Expiry Horizon
              </p>
              <p className="text-[11px] text-amber-700">
                Action required under clinic protocol. Verify remaining lots before dispensing.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToAlerts}
            className="px-3.5 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-xl transition"
          >
            Review Risks &rarr;
          </button>
        </div>
      )}

      {/* Grid of the 6 signature cards matching the reference UI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* =========================================================================
            CARD 1: Self-reported feeling / Shelf Auditing Activity (Dark Sage Card)
           ========================================================================= */}
        <div className="relative rounded-3xl bg-gradient-to-br from-[#4e6f40] via-[#456338] to-[#344d29] text-white p-6 shadow-sm overflow-hidden flex flex-col justify-between min-h-[340px]">
          {/* Subtle background curved glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />

          {/* Top Row: Title + Menu */}
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h3 className="font-semibold text-lg tracking-tight text-white/95">
                Self-reported feeling
              </h3>
              <p className="text-xs text-emerald-100/70">
                Shelf audit vital tracking
              </p>
            </div>
            <button className="text-white/70 hover:text-white p-1 rounded-lg transition">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Strip */}
          <div className="flex items-center justify-between py-2 relative z-10 px-1">
            {weekDays.map((d, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedDay(d.label)}
                className={`w-7 h-7 text-xs font-semibold rounded-full flex items-center justify-center transition ${
                  selectedDay === d.label
                    ? 'bg-white text-[#3e5b32] shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Smooth Chart Area with glowing curve and 3D Bio Orb */}
          <div className="relative h-44 w-full flex flex-col justify-end z-10 pt-4">
            {/* Dashed vertical grid lines */}
            <div className="absolute inset-x-0 top-0 bottom-6 grid grid-cols-5 pointer-events-none">
              <div className="border-r border-dashed border-white/15 h-full" />
              <div className="border-r border-dashed border-white/15 h-full" />
              <div className="border-r border-dashed border-white/15 h-full bg-white/10 rounded-sm" />
              <div className="border-r border-dashed border-white/15 h-full" />
              <div className="border-r border-dashed border-white/15 h-full" />
            </div>

            {/* SVG Trend Wave */}
            <svg
              className="w-full h-28 overflow-visible"
              viewBox="0 0 300 100"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d5f553" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Gradient fill under curve */}
              <path
                d="M 0,65 C 50,75 70,30 140,55 C 190,75 220,40 300,60 L 300,100 L 0,100 Z"
                fill="url(#waveGrad)"
              />

              {/* Curve Line */}
              <path
                d="M 0,65 C 50,75 70,30 140,55 C 190,75 220,40 300,60"
                fill="none"
                stroke="#1e3417"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Dot nodes on key time points */}
              <circle cx="65" cy="52" r="3.5" fill="#ffffff" />
              <circle cx="140" cy="55" r="4" fill="#d5f553" />
              <circle cx="215" cy="46" r="3.5" fill="#ffffff" />
            </svg>

            {/* Floating Tooltip Pill Badge */}
            <div className="absolute top-2 left-[48%] -translate-x-1/2 bg-[#1b2f16] text-[#e8f5dd] px-3 py-1 rounded-full text-[11px] font-medium shadow-lg border border-white/10 flex items-center gap-1.5 whitespace-nowrap z-20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d5f553] animate-pulse" />
              <span>Slight fatigue</span>
            </div>

            {/* 3D Glassy Bio Orb resting right on the peak of the curve */}
            <div className="absolute top-10 left-[48%] -translate-x-1/2 pointer-events-none z-10 w-16 h-16 drop-shadow-xl">
              <img
                src="/bio_orb.jpg"
                alt="Bio Capsule Orb"
                className="w-full h-full object-cover rounded-full mix-blend-screen scale-110"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            {/* Time labels matching the reference */}
            <div className="flex justify-between text-[11px] font-medium text-white/60 pt-2 border-t border-white/10 mt-2">
              <span>08:00</span>
              <span>09:00</span>
              <span>10:00</span>
              <span>11:00</span>
              <span>12:00</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            CARD 2: Taking pills / Active Medication Progress (Crisp White Card)
           ========================================================================= */}
        <div className="rounded-3xl bg-white p-6 shadow-[0_4px_24px_rgba(30,50,20,0.04)] border border-stone-200/60 flex flex-col justify-between min-h-[340px]">
          <div>
            {/* Header with Title + Add Pills Button */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <h3 className="font-bold text-lg text-stone-900 tracking-tight">
                Taking pills
              </h3>
              <button
                id="btn-add-pills"
                onClick={onOpenManualAdd}
                className="flex items-center gap-1 text-xs font-semibold text-stone-700 hover:text-emerald-800 transition px-2.5 py-1 rounded-lg hover:bg-stone-50 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-stone-500" />
                <span>Add pills</span>
              </button>
            </div>

            {/* Table Header Labels */}
            <div className="grid grid-cols-12 text-[11px] font-semibold text-stone-400 py-3">
              <span className="col-span-5">Medications</span>
              <span className="col-span-4">Schedule</span>
              <span className="col-span-3 text-right">Progress</span>
            </div>

            {/* Table Rows */}
            <div className="space-y-4">
              {medications.map((med, idx) => (
                <div
                  key={idx}
                  onClick={onNavigateToInventory}
                  className="grid grid-cols-12 items-center text-xs group cursor-pointer hover:bg-stone-50/80 p-1.5 -mx-1.5 rounded-xl transition"
                >
                  {/* Medicine Name */}
                  <div className="col-span-5">
                    <p className="font-semibold text-stone-900 group-hover:text-emerald-900 transition">
                      {med.name}
                    </p>
                    <p className="text-[10px] text-stone-400 truncate">
                      {med.generic}
                    </p>
                  </div>

                  {/* Schedule with Sun / Moon Icons */}
                  <div className="col-span-4 flex items-center gap-1.5 text-stone-600 font-medium text-[11px]">
                    <span>{med.schedule}</span>
                    <div className="flex items-center gap-0.5 text-stone-400">
                      {med.icons.includes('sun') && (
                        <Sun className="w-3 h-3 text-amber-500" />
                      )}
                      {med.icons.includes('moon') && (
                        <Moon className="w-3 h-3 text-indigo-400" />
                      )}
                    </div>
                  </div>

                  {/* Circular Radial SVG Progress */}
                  <div className="col-span-3 flex items-center justify-end gap-2">
                    {/* Radial Ring */}
                    <div className="relative w-5 h-5 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <circle
                          cx="18"
                          cy="18"
                          r="14"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="4"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="14"
                          fill="none"
                          stroke="#4f7341"
                          strokeWidth="4"
                          strokeDasharray="88"
                          strokeDashoffset={88 - (88 * med.progress) / 100}
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <span className="font-semibold text-stone-800 text-[11px]">
                      {med.progress}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Card Footer */}
          <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>
              Confirmed stock: <strong className="text-stone-800 font-semibold">{verifiedCount}</strong>
            </span>
            <button
              onClick={onNavigateToInventory}
              className="text-[#4b6d3d] hover:text-[#38532d] font-semibold flex items-center gap-1"
            >
              <span>Manage all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            CARD 3: Calendar & Doctor Availability Roster
           ========================================================================= */}
        <div className="rounded-3xl bg-white shadow-[0_4px_24px_rgba(30,50,20,0.04)] border border-stone-200/60 overflow-hidden flex flex-col justify-between min-h-[340px]">
          {/* Top Green Calendar Header */}
          <div className="bg-gradient-to-br from-[#4e6f40] to-[#3a542e] text-white p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-sm tracking-wide text-white/95">
                March, 2026
              </span>
              <Calendar className="w-3.5 h-3.5 text-white/70" />
            </div>

            {/* Horizontal Date Strip */}
            <div className="flex items-center justify-between text-center pt-1">
              {calendarDates.map((item, idx) => {
                const isSelected = selectedDate === item.date;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(item.date)}
                    className={`flex flex-col items-center py-1.5 px-2 rounded-2xl transition cursor-pointer ${
                      isSelected
                        ? 'bg-white text-[#38532d] shadow-md scale-105'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="text-[10px] font-medium">{item.day}</span>
                    <span className="text-xs font-bold mt-0.5">{item.date}</span>
                    {item.dot && (
                      <span
                        className={`w-1 h-1 rounded-full mt-1 ${
                          isSelected ? 'bg-[#38532d]' : 'bg-white/60'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Doctors List */}
          <div className="p-4 space-y-3">
            {doctors.map((doc, idx) => (
              <div
                key={idx}
                onClick={() => setActiveDoctor(doc.name)}
                className={`flex items-center justify-between p-2 rounded-2xl transition cursor-pointer ${
                  activeDoctor === doc.name
                    ? 'bg-[#f2f7ef] border border-[#d6e7ce]'
                    : 'hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={doc.avatar}
                    alt={doc.name}
                    className="w-9 h-9 rounded-full object-cover border border-stone-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = doc.fallbackAvatar;
                    }}
                  />
                  <div>
                    <h4 className="text-xs font-bold text-stone-900">
                      {doc.name}
                    </h4>
                    <p className="text-[10px] text-stone-400">
                      {doc.role} &bull; {doc.department}
                    </p>
                  </div>
                </div>

                {/* Status Pill Badge */}
                <span
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                    doc.available
                      ? 'bg-[#ebf8ee] text-[#2c7739]'
                      : 'bg-[#f1f3f0] text-[#718070]'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      doc.available ? 'bg-[#2c7739]' : 'bg-[#94a392]'
                    }`}
                  />
                  <span>{doc.available ? 'Available' : 'Not available'}</span>
                </span>
              </div>
            ))}
          </div>

          {/* Bottom Card Footer */}
          <div className="px-5 pb-3 text-[11px] text-stone-400 flex items-center justify-between border-t border-stone-100 pt-2">
            <span>Verified sign-off roster</span>
            <span className="text-[#3e5e32] font-semibold">Active: {activeDoctor.split(' ')[1]}</span>
          </div>
        </div>

        {/* =========================================================================
            CARD 4: 18% Recovery progress trend / Stock Verification Metric
           ========================================================================= */}
        <div className="rounded-3xl bg-white p-6 shadow-[0_4px_24px_rgba(30,50,20,0.04)] border border-stone-200/60 flex flex-col justify-between min-h-[220px]">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold text-stone-900 tracking-tight">
                    18
                  </span>
                  <span className="text-2xl font-bold text-stone-500">%</span>
                </div>
                <h3 className="font-bold text-sm text-stone-800 mt-2">
                  Recovery progress trend
                </h3>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Stock verification compliance
                </p>
              </div>

              {/* Legend matching the reference */}
              <div className="flex items-center gap-3 text-[11px] text-stone-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-stone-300" />
                  <span>Recovery</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-stone-400" />
                  <span>Baseline</span>
                </span>
              </div>
            </div>
          </div>

          {/* Trend Chart Graphic with Badge Indicator */}
          <div className="relative pt-6 flex items-end justify-between">
            {/* SVG Mountain / Area fill */}
            <div className="w-full relative h-16 flex items-end">
              <svg
                className="w-full h-full overflow-visible"
                viewBox="0 0 200 60"
                preserveAspectRatio="none"
              >
                {/* Light blue/sage polygonal shapes */}
                <polygon
                  points="30,50 60,35 90,45 120,20 150,40 180,30 200,50 0,50"
                  fill="#cbe3f2"
                  opacity="0.8"
                />
                <polygon
                  points="30,50 60,55 90,52 120,58 150,53 180,56 200,50 0,50"
                  fill="#e2effa"
                  opacity="0.9"
                />
              </svg>

              {/* Floating Pin & Indicator Badge matching the reference */}
              <div className="absolute left-[58%] -top-1 -translate-x-1/2 flex flex-col items-center">
                <div className="bg-[#1b3419] text-[#e0fa66] p-1.5 rounded-full shadow-md">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <div className="w-0.5 h-8 bg-stone-800" />
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            CARD 5: Medical Center / Choose your doctor & Scan Shelf (Hero Banner)
           ========================================================================= */}
        <div className="rounded-3xl bg-[#dce9d5] p-6 shadow-sm border border-[#cbe0c3] relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          {/* Subtle floral/medical emblem in top-left */}
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-[#1b3419] text-[#e3fb6f] flex items-center justify-center font-bold text-xs">
                ✱
              </div>
              <div className="leading-none">
                <span className="text-[11px] font-bold text-[#1b3419] tracking-tight block">
                  Medical
                </span>
                <span className="text-[10px] font-semibold text-[#3b5e34] block">
                  Center
                </span>
              </div>
            </div>

            <h3 className="text-2xl font-black text-[#193217] leading-tight tracking-tight max-w-[180px]">
              Choose your doctor
            </h3>
            <p className="text-[11px] text-[#426639] font-medium mt-1 max-w-[170px]">
              AI shelf audit & verified medicine dispensing
            </p>
          </div>

          {/* Lime Yellow Pill CTA Button matching the reference */}
          <div className="relative z-10 pt-4">
            <button
              id="btn-hero-audit-shelf"
              onClick={onNavigateToAudit}
              className="bg-[#e2fa6c] hover:bg-[#d6f254] text-[#1b3419] font-bold px-6 py-2.5 rounded-full text-xs shadow-sm hover:shadow transition transform active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span>Book Now</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Doctor Hero Image in bottom right */}
          <div className="absolute -bottom-4 -right-4 w-44 h-48 z-0 pointer-events-none">
            <img
              src="/doctor_hero.jpg"
              alt="Medical Center Doctor"
              className="w-full h-full object-cover object-top rounded-3xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80';
              }}
            />
          </div>
        </div>

        {/* =========================================================================
            CARD 6: Oxygen level remains stable / Medicine Inventory Integrity
           ========================================================================= */}
        <div className="rounded-3xl bg-gradient-to-br from-[#c9dfc1] to-[#b7d2ad] p-6 shadow-sm border border-[#b2cfaa] relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div>
            {/* Status Indicator Badges */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1f3d1c] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#35612f] animate-pulse" />
                <span>Normal</span>
              </span>

              <span className="bg-[#1b3419] text-[#e0fa66] text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                Stable
              </span>
            </div>

            {/* 98 SpO2 pill badge with callout stem */}
            <div className="flex justify-end pt-2 pr-6">
              <div className="flex flex-col items-center">
                <div className="bg-[#1b3419] text-white px-2.5 py-1 rounded-full text-[11px] font-bold shadow-md">
                  98 SpO₂
                </div>
                <div className="w-0.5 h-4 bg-[#1b3419]" />
              </div>
            </div>

            {/* Headline matching the reference */}
            <h3 className="text-xl font-black text-[#1b3618] leading-tight tracking-tight mt-1 max-w-[190px]">
              Oxygen level remains stable
            </h3>
            <p className="text-[11px] text-[#3e6036] font-medium mt-1 max-w-[170px]">
              Stock integrity & clinic vitals are optimal
            </p>
          </div>

          {/* 3D Glass Orbs Graphic nestled in bottom right */}
          <div className="absolute -bottom-2 -right-2 w-32 h-32 pointer-events-none drop-shadow-lg">
            <img
              src="/bio_orb.jpg"
              alt="Bio Orbs"
              className="w-full h-full object-cover rounded-full mix-blend-multiply opacity-90 scale-110"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        </div>

      </div>

      {/* Quick Action Navigation Bar directly underneath the Bento Grid */}
      <div className="bg-white rounded-3xl p-5 shadow-[0_4px_24px_rgba(30,50,20,0.04)] border border-stone-200/60 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#edf4ea] flex items-center justify-center text-[#3e5e32]">
            <Scan className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-stone-900">
              Ready to perform a medicine shelf audit?
            </h4>
            <p className="text-xs text-stone-500">
              Upload photograph or choose from our sample dispensary shelves for AI candidate drafting.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={onNavigateToInventory}
            className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition"
          >
            Confirmed Stock ({verifiedCount})
          </button>
          <button
            onClick={onNavigateToAudit}
            className="flex-1 sm:flex-none px-5 py-2 text-xs font-bold text-[#1b3419] bg-[#e2fa6c] hover:bg-[#d6f254] rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
          >
            <Scan className="w-3.5 h-3.5" />
            <span>Launch Shelf Vision</span>
          </button>
        </div>
      </div>
    </div>
  );
};
