import { useMemo } from 'react';

export interface PasswordStrength {
  level: 'empty' | 'weak' | 'fair' | 'good' | 'strong';
  score: number;
  label: string;
  hint: string;
  colorClass: string;
  barColorClass: string;
  isAcceptable: boolean;
}

const COMMON_PASSWORDS = new Set([
  'password',
  'password1',
  'password123',
  '12345678',
  '123456789',
  'qwerty123',
  'admin123',
  'letmein123',
  'craftmatch',
]);

export function evaluatePassword(password: string): PasswordStrength {
  if (!password) {
    return {
      level: 'empty',
      score: 0,
      label: 'Password strength',
      hint: 'Use at least 8 characters with letters, numbers, and a symbol.',
      colorClass: 'text-text-light',
      barColorClass: 'bg-neutral-200',
      isAcceptable: false,
    };
  }

  // Count categories
  let categories = 0;
  if (/[a-z]/.test(password)) categories++;
  if (/[A-Z]/.test(password)) categories++;
  if (/[0-9]/.test(password)) categories++;
  if (/[^A-Za-z0-9\s]/.test(password)) categories++;

  const hasMinLength = password.length >= 8;
  const hasNoWhitespace = !/\s/.test(password);
  const isCommon = COMMON_PASSWORDS.has(password.toLowerCase());

  if (!hasMinLength || categories < 2 || !hasNoWhitespace || isCommon) {
    let hint = 'Choose a stronger password.';
    if (password.length < 8) {
      hint = 'Use at least 8 characters.';
    } else if (!hasNoWhitespace) {
      hint = 'Remove spaces from your password.';
    } else if (isCommon) {
      hint = 'Avoid common passwords.';
    } else if (categories < 2) {
      hint = 'Mix letters with numbers or symbols.';
    }

    return {
      level: 'weak',
      score: 1,
      label: 'Weak',
      hint,
      colorClass: 'text-red-500',
      barColorClass: 'bg-red-500',
      isAcceptable: false,
    };
  }

  if (password.length >= 12 && categories >= 4) {
    return {
      level: 'strong',
      score: 4,
      label: 'Strong',
      hint: 'Looks strong.',
      colorClass: 'text-success',
      barColorClass: 'bg-success',
      isAcceptable: true,
    };
  }

  if (password.length >= 10 && categories >= 3) {
    return {
      level: 'good',
      score: 3,
      label: 'Good',
      hint: 'Add more length or another symbol to make it stronger.',
      colorClass: 'text-gold',
      barColorClass: 'bg-gold',
      isAcceptable: true,
    };
  }

  return {
    level: 'fair',
    score: 2,
    label: 'Fair',
    hint: 'Add uppercase letters, numbers, or symbols.',
    colorClass: 'text-gold',
    barColorClass: 'bg-gold',
    isAcceptable: true,
  };
}

interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const strength = useMemo(() => evaluatePassword(password), [password]);

  return (
    <div className="space-y-2">
      {/* Dynamic 4-bar strength indicator */}
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((index) => {
          const isActive = index < strength.score;
          return (
            <div
              key={index}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                isActive ? strength.barColorClass : 'bg-neutral-100'
              }`}
            />
          );
        })}
      </div>

      {/* Label and Hint feedback */}
      <div className="flex items-start gap-2 text-xs leading-normal">
        <span className={`font-bold ${strength.colorClass} whitespace-nowrap`}>
          {strength.label}
        </span>
        <span className="text-text-muted">{strength.hint}</span>
      </div>
    </div>
  );
}
