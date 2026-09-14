// Section header for the dashboard: a short title with a hairline rule
// running to the edge, so each block of the page reads as a labelled
// section of one report rather than a stack of unrelated cards.
export function SectionHeading({
  title,
  id,
}: {
  title: string;
  id?: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <h2 id={id} className="flex-none text-[0.9375rem] font-semibold text-foreground">
        {title}
      </h2>
      <span aria-hidden className="h-px flex-1 bg-line" />
    </div>
  );
}
