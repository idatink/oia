'use client';

import { useState } from 'react';

const CONDITIONS: { key: string; label: string }[] = [
  { key: 'diabetes',        label: 'Diabetes (Type 1 or 2)' },
  { key: 'cancerTreatment', label: 'Cancer or cancer treatment in the last 5 years' },
  { key: 'organTransplant', label: 'Organ transplant history' },
  { key: 'dvt',             label: 'DVT or blood clots' },
  { key: 'pacemaker',       label: 'Pacemaker or cardiac implant' },
  { key: 'hypertension',    label: 'High blood pressure (on medication)' },
  { key: 'heartDisease',    label: 'Heart disease' },
  { key: 'thyroidDisorder', label: 'Thyroid disorder' },
  { key: 'immuneDisorder',  label: 'Immune disorder or autoimmune condition' },
  { key: 'pregnancy',       label: 'Currently pregnant or trying to conceive' },
  { key: 'allergies',       label: 'Severe allergies (e.g. anaesthesia or latex)' },
];

export type TriageAnswers = Record<string, boolean>;

interface TriageWidgetProps {
  onSubmit: (answers: TriageAnswers) => void;
}

export default function TriageWidget({ onSubmit }: TriageWidgetProps) {
  const [answers, setAnswers] = useState<TriageAnswers>(
    Object.fromEntries(CONDITIONS.map(c => [c.key, false]))
  );

  const toggle = (key: string, value: boolean) =>
    setAnswers(a => ({ ...a, [key]: value }));

  const setAll = (value: boolean) =>
    setAnswers(Object.fromEntries(CONDITIONS.map(c => [c.key, value])));

  const handleSubmit = () => onSubmit(answers);

  const anyYes = Object.values(answers).some(Boolean);

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-outline-variant/10">
        <p className="font-body text-sm font-semibold text-on-surface">Medical screening</p>
        <p className="font-body text-xs text-on-surface-variant mt-0.5">
          Please answer yes or no for each condition. This helps our surgical teams confirm your suitability.
        </p>
      </div>

      <div className="divide-y divide-outline-variant/10">
        {CONDITIONS.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between px-5 py-3 gap-4">
            <span className="font-body text-sm text-on-surface leading-snug flex-1">{label}</span>
            <div className="flex gap-1.5 shrink-0">
              <button
                onClick={() => toggle(key, true)}
                className={`px-3 py-1 rounded-lg font-body text-xs font-semibold transition-colors ${
                  answers[key]
                    ? 'bg-error/15 text-error border border-error/30'
                    : 'bg-surface-container border border-outline-variant/20 text-on-surface-variant hover:border-outline-variant/40'
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => toggle(key, false)}
                className={`px-3 py-1 rounded-lg font-body text-xs font-semibold transition-colors ${
                  !answers[key]
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-surface-container border border-outline-variant/20 text-on-surface-variant hover:border-outline-variant/40'
                }`}
              >
                No
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 py-4 flex flex-col gap-2 border-t border-outline-variant/10">
        {anyYes && (
          <button
            onClick={() => setAll(false)}
            className="w-full py-2 rounded-xl font-body text-sm text-on-surface-variant border border-outline-variant/20 hover:bg-surface-container transition-colors"
          >
            None of the above apply to me
          </button>
        )}
        <button
          onClick={handleSubmit}
          className="w-full py-2.5 bg-primary text-on-primary font-body text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
        >
          Submit answers
        </button>
      </div>
    </div>
  );
}
