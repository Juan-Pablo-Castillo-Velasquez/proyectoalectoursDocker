interface Props {
  title: string;
  subtitle?: string;
  icon: any;
}

export default function SectionHeader({ title, subtitle, icon: Icon }: Props) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <h2 className="text-base font-bold text-foreground tracking-tight leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}