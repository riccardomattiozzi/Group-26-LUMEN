// The page header: the decision this screen supports and what it rests on,
// stated once before any control or number. Names and facts here (Elena/CFO,
// Jonas/CMO, the 300-respondent survey, the three candidate prices) come
// from the case brief and the data room — nothing invented.
export function DecisionFraming() {
  return (
    <section aria-labelledby="decision-heading" className="border-b border-line pb-6 pt-7 sm:pt-9">
      <h1
        id="decision-heading"
        className="max-w-3xl text-2xl font-semibold text-foreground text-balance sm:text-3xl"
      >
        Germany launch: price, channel mix and timing for Year 1
      </h1>
      <p className="mt-3 max-w-3xl text-base text-foreground-soft text-pretty">
        LUMEN has no German sales history yet. Every figure below is built
        from the case data room — a 300-respondent pricing survey, estimated
        acceptance at three candidate prices, competitor and seasonality data —
        plus one adjustable assumption about Year-1 market share. Elena (CFO)
        and Jonas (CMO) read the same numbers differently; the page builds the
        scenario, then shows both readings side by side.
      </p>
    </section>
  );
}
