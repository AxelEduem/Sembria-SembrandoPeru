import { AlertTriangle, ArrowLeft, BookOpen, Lightbulb } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const TONE_CLASSES = {
  emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
  sky: "border-sky-100 bg-sky-50 text-sky-700",
  amber: "border-amber-100 bg-amber-50 text-amber-700",
  violet: "border-violet-100 bg-violet-50 text-violet-700",
  rose: "border-rose-100 bg-rose-50 text-rose-700",
};

const TIP_CLASSES = {
  emerald: "border-emerald-100 bg-emerald-50/70 text-emerald-800",
  sky: "border-sky-100 bg-sky-50/70 text-sky-800",
  amber: "border-amber-100 bg-amber-50/70 text-amber-800",
  rose: "border-rose-100 bg-rose-50/70 text-rose-800",
};

function Step({ number, title, children }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2D5A3D] text-xs font-bold text-white">
        {number}
      </span>
      <div className="pt-0.5">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">{children}</p>
      </div>
    </div>
  );
}

function Tip({ children, tone = "emerald" }) {
  const Icon = tone === "amber" || tone === "rose" ? AlertTriangle : Lightbulb;
  return (
    <div className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 ${TIP_CLASSES[tone] || TIP_CLASSES.emerald}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.9} />
      <p className="text-sm leading-5">{children}</p>
    </div>
  );
}

export default function ModuleManualPage({
  title,
  description,
  estimatedTime = "3 minutos",
  returnTo,
  returnLabel,
  heroIcon: HeroIcon,
  sections,
}) {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(sections[0]?.id || "");
  const section = sections.find((item) => item.id === activeSection) || sections[0];
  const SectionIcon = section?.icon || BookOpen;

  return (
    <div className="module-page-enter mx-auto max-w-7xl pb-10">
      <button
        type="button"
        onClick={() => navigate(returnTo)}
        className="mb-4 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
        {returnLabel}
      </button>

      <header className="relative mb-5 overflow-hidden rounded-2xl border border-emerald-900/10 bg-gradient-to-br from-[#164E3B] to-[#087F5B] text-white shadow-sm">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-emerald-200/10" />
        <div className="absolute -bottom-24 -right-4 h-52 w-52 rounded-full border border-white/10" />
        <div className="relative grid gap-6 px-6 py-7 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/10">
              {HeroIcon ? <HeroIcon className="h-6 w-6" strokeWidth={1.8} /> : <BookOpen className="h-6 w-6" strokeWidth={1.8} />}
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-100">Guía de uso</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/80">{description}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs font-semibold text-emerald-100">Tiempo estimado</p>
            <p className="mt-1 text-lg font-bold">{estimatedTime}</p>
          </div>
        </div>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[245px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.03)] lg:sticky lg:top-3">
          <p className="px-3 pb-3 pt-2 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">Contenido</p>
          <nav className="space-y-1" aria-label="Contenido del manual" role="tablist">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeSection === id}
                onClick={() => setActiveSection(id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                  activeSection === id
                    ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${activeSection === id ? "text-emerald-600" : "text-slate-400"}`} strokeWidth={1.8} />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {section ? (
          <main key={section.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_18px_rgba(15,23,42,0.04)]">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
              <div className="flex items-start gap-3.5">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${TONE_CLASSES[section.tone] || TONE_CLASSES.emerald}`}>
                  <SectionIcon className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-700">{section.number}</p>
                  <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">{section.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{section.description}</p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <div className="space-y-5">
                {section.steps.map((step, index) => (
                  <Step key={step.title} number={index + 1} title={step.title}>{step.text}</Step>
                ))}
              </div>
              {section.tips?.length ? (
                <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">
                  {section.tips.map((tip) => <Tip key={tip.text} tone={tip.tone}>{tip.text}</Tip>)}
                </div>
              ) : null}
            </div>
          </main>
        ) : null}
      </div>
    </div>
  );
}
