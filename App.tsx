import React, { useState, useMemo, useEffect } from 'react';
import { UserLifestyleInput, FootprintResult } from './types/carbon';
import { PRESETS } from './data/presets';
import { calculateCarbonFootprint } from './utils/carbonCalculator';
import { Header } from './components/Header';
import { MethodologyModal } from './components/MethodologyModal';
import { LifestyleForm } from './components/Questionnaire/LifestyleForm';
import { MetricCards } from './components/Dashboard/MetricCards';
import { EmissionCharts } from './components/Dashboard/EmissionCharts';
import { HotspotsList } from './components/Dashboard/HotspotsList';
import { GoalComparison } from './components/ReductionPlan/GoalComparison';
import { ActionTable } from './components/ReductionPlan/ActionTable';
import { TimelineCards } from './components/ReductionPlan/TimelineCards';
import { CoachAdviceCard } from './components/CoachAdviceCard';
import { ReportExport } from './components/ReportExport';
import { ArrowRight, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';

const STORAGE_KEY_INPUT = 'ecopulse_lifestyle_input_v1';
const STORAGE_KEY_ACTIONS = 'ecopulse_completed_actions_v1';
const STORAGE_KEY_THEME = 'ecopulse_theme_mode_v1';

export const App: React.FC = () => {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'light');
    }
  }, [darkMode]);

  // Lifestyle Input state
  const [input, setInput] = useState<UserLifestyleInput>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_INPUT);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return PRESETS[0].data; // Default: Indian Urban Commuter
  });

  // Completed Action IDs
  const [completedActionIds, setCompletedActionIds] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ACTIONS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return [];
  });

  // Active UI Tab
  const [activeTab, setActiveTab] = useState<'questionnaire' | 'dashboard' | 'report'>('questionnaire');
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_INPUT, JSON.stringify(input));
  }, [input]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ACTIONS, JSON.stringify(completedActionIds));
  }, [completedActionIds]);

  // Live Carbon Footprint calculation
  const footprintResult: FootprintResult = useMemo(() => {
    return calculateCarbonFootprint(input, completedActionIds);
  }, [input, completedActionIds]);

  // Handlers
  const handleInputChange = (updatedFields: Partial<UserLifestyleInput>) => {
    setInput((prev) => ({ ...prev, ...updatedFields }));
  };

  const handleToggleAction = (actionId: string) => {
    setCompletedActionIds((prev) =>
      prev.includes(actionId) ? prev.filter((id) => id !== actionId) : [...prev, actionId]
    );
  };

  const handleLoadPreset = (presetData: UserLifestyleInput) => {
    setInput(presetData);
    setCompletedActionIds([]);
    setActiveTab('dashboard');
  };

  const handleReset = () => {
    if (window.confirm('Reset all values to default profile?')) {
      setInput(PRESETS[0].data);
      setCompletedActionIds([]);
      setActiveTab('questionnaire');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Header Bar */}
      <Header
        onLoadPreset={handleLoadPreset}
        onReset={handleReset}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Methodology Modal */}
      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* TAB 1: QUESTIONNAIRE */}
        {activeTab === 'questionnaire' && (
          <div className="space-y-6">
            {/* Quick Hero Banner */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-2xl p-6 sm:p-8 shadow-lg shadow-emerald-600/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-1.5 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold backdrop-blur-md">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Interactive Carbon Audit</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Welcome to your Personal Carbon Footprint Coach
                </h1>
                <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
                  Enter your typical real-world activities below. As you adjust any slider or number, our scientific model recalculates your footprint live in the background.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('dashboard')}
                className="shrink-0 flex items-center gap-2 px-5 py-3 bg-white text-emerald-800 hover:bg-emerald-50 text-xs sm:text-sm font-extrabold rounded-xl shadow-md transition-all hover:scale-105"
              >
                <span>View Dashboard ({footprintResult.totalTonnes} t)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Modular Form */}
            <LifestyleForm
              input={input}
              onChange={handleInputChange}
              onCalculateDashboard={() => setActiveTab('dashboard')}
            />
          </div>
        )}

        {/* TAB 2: DASHBOARD & REDUCTION PLAN */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            {/* Top Metric Cards (Total Footprint, Trees, Driving Equiv) */}
            <MetricCards result={footprintResult} />

            {/* Encouraging Positive Feedback Banner */}
            <CoachAdviceCard
              result={footprintResult}
              completedCount={completedActionIds.length}
            />

            {/* Emission Breakdown & Interactive Donut Chart */}
            <EmissionCharts result={footprintResult} />

            {/* 🔥 Top 3 Hotspots */}
            <HotspotsList result={footprintResult} />

            {/* 🎯 Goal Comparison (Before vs After vs Savings) */}
            <GoalComparison
              result={footprintResult}
              completedActionCount={completedActionIds.length}
            />

            {/* 🌱 Personalized Reduction Plan Table */}
            <ActionTable
              actions={footprintResult.availableActions}
              completedActionIds={completedActionIds}
              onToggleAction={handleToggleAction}
            />

            {/* 📅 Step-by-Step Action Timeline (This Week, This Month, Next 3 Months) */}
            <TimelineCards
              actions={footprintResult.availableActions}
              completedActionIds={completedActionIds}
              onToggleAction={handleToggleAction}
            />

            {/* Bottom Actions Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 gap-4">
              <button
                onClick={() => setActiveTab('questionnaire')}
                className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Adjust Lifestyle Inputs & Recalculate</span>
              </button>

              <button
                onClick={() => setActiveTab('report')}
                className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all"
              >
                <span>Generate Official Summary Report</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: SUMMARY REPORT */}
        {activeTab === 'report' && (
          <div className="animate-fade-in">
            <ReportExport result={footprintResult} city={input.city} />
          </div>
        )}
      </main>

      {/* Floating Live Footprint Ticker (shown on Questionnaire Tab) */}
      {activeTab === 'questionnaire' && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-xl bg-slate-900/95 dark:bg-slate-800/95 text-white backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between gap-3 animate-fade-in">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
              Live Calculated Footprint
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black text-white">{footprintResult.totalTonnes} tonnes</span>
              <span className="text-xs text-slate-400">({footprintResult.totalKg.toLocaleString()} kg CO₂e/yr)</span>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all shrink-0"
          >
            <span>See Plan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Clean Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>EcoPulse — AI-Powered Personal Carbon Footprint Coach & Climate Roadmap</span>
          <button
            onClick={() => setIsMethodologyOpen(true)}
            className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
          >
            Scientific Methodology & CEA/IPCC Factors
          </button>
        </div>
      </footer>
    </div>
  );
};
