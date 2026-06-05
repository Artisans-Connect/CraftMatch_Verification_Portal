import React from 'react';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="w-full">
      {/* Desktop */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                    ${isCompleted ? 'bg-success text-white shadow-md' :
                      isCurrent ? 'bg-primary text-white shadow-primary-glow' :
                      'bg-neutral-100 text-text-muted'}`}
                >
                  {isCompleted ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                  ) : stepNum}
                </div>
                <span className={`text-xs font-medium text-center max-w-[80px] leading-tight
                  ${isCurrent ? 'text-primary font-semibold' :
                    isCompleted ? 'text-success-dark' : 'text-text-muted'}`}>
                  {step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mb-5 rounded-full transition-all duration-300
                  ${stepNum < currentStep ? 'bg-success' : 'bg-neutral-200'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-text-primary">
            Step {currentStep} of {steps.length}
          </span>
          <span className="text-sm text-primary font-semibold">{steps[currentStep - 1]}</span>
        </div>
        <div className="w-full bg-neutral-100 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
