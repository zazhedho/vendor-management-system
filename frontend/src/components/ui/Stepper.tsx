import React from 'react';
import { Check } from 'lucide-react';

interface Step {
    title: string;
    description?: string;
}

interface StepperProps {
    steps: Step[];
    currentStep: number;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStep }) => {
    return (
        <div className="w-full py-4">
            <div className="flex items-center justify-between relative">
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-0.5 bg-secondary-200 -z-10" />

                {steps.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;

                    return (
                        <div key={index} className="flex flex-col items-center bg-secondary-50 px-2">
                            <div
                                className={`
                  w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-200
                  ${isCompleted
                                        ? 'bg-primary-600 border-primary-600 text-white'
                                        : isCurrent
                                            ? 'bg-white border-primary-600 text-primary-600'
                                            : 'bg-white border-secondary-300 text-secondary-400'
                                    }
                `}
                            >
                                {isCompleted ? <Check size={16} /> : <span>{index + 1}</span>}
                            </div>
                            <div className="mt-2 text-center hidden sm:block">
                                <p className={`text-sm font-medium ${isCurrent ? 'text-primary-700' : 'text-secondary-500'}`}>
                                    {step.title}
                                </p>
                                {step.description && (
                                    <p className="text-xs text-secondary-400">{step.description}</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
