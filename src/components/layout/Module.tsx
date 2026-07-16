import type { ReactNode } from 'react';

type ModuleProps = {
  title: string;
  children: ReactNode;
  announce?: boolean;
  bodyStyle?: React.CSSProperties;
};

export function Module({ title, children, announce, bodyStyle }: ModuleProps) {
  return (
    <section className={`module${announce ? ' announce' : ''}`}>
      <div className="module-head">{title}</div>
      <div className="module-body" style={bodyStyle}>
        {children}
      </div>
    </section>
  );
}

type StatRowProps = {
  label: string;
  value: ReactNode;
  tone?: 'up' | 'down';
};

export function StatRow({ label, value, tone }: StatRowProps) {
  return (
    <div className="stat-row">
      <span className="stat-label">{label}</span>
      <span className={`stat-val num${tone ? ` ${tone}` : ''}`}>{value}</span>
    </div>
  );
}

type NumProps = {
  children: ReactNode;
  tone?: 'up' | 'down';
  className?: string;
};

export function Num({ children, tone, className = '' }: NumProps) {
  return <span className={`num${tone ? ` ${tone}` : ''} ${className}`.trim()}>{children}</span>;
}
