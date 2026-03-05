const state = {
  data: [],
  filtered: [],
  controls: {
    dateStart: null,
    dateEnd: null,
    region: "All",
    category: "All",
    segment: "All",
    metric: "sales",
    topN: 4,
  },
};

const parseDate = d3.timeParse("%Y-%m-%d");
const parseMonth = d3.timeParse("%Y-%m");
const formatMonth = d3.timeFormat("%Y-%m");

const tooltip = d3.select("#tooltip");

const palette = {
  sales: "#1f7a60",
  profit: "#c44900",
  bar: "#156082",
  neutral: "#6a7f74",
  segment: d3.scaleOrdinal(d3.schemeSet2),
  category: d3.scaleOrdinal(d3.schemeTableau10),
};

const dims = {
  line: { width: 1120, height: 440, margin: { top: 20, right: 140, bottom: 52, left: 72 } },
  bar: { width: 560, height: 360, margin: { top: 20, right: 20, bottom: 54, left: 72 } },
  donut: { width: 560, height: 360, margin: { top: 12, right: 12, bottom: 12, left: 12 } },
  scatter: { width: 1120, height: 440, margin: { top: 16, right: 20, bottom: 52, left: 72 } },
};

function parseRow(row) {
  const orderDate = parseDate(row.order_date);
  return {
    ...row,
    orderDate,
    sales: +row.sales,
    quantity: +row.quantity,
    discount: +row.discount,
    profit: +row.profit,
    profitMargin: +row.profit_margin,
    isProfitable: +row.is_profitable,
  };
}

function uniqSorted(values) {
  return Array.from(new Set(values)).sort((a, b) => d3.ascending(a, b));
}

function currency(v) {
  return `$${d3.format(",.0f")(v)}`;
}

function pct(v) {
  return d3.format(".1%")(v);
}

function setOptions(selectId, values) {
  const select = d3.select(selectId);
  select.selectAll("option").remove();
  select.append("option").attr("value", "All").text("All");
  values.forEach((value) => select.append("option").attr("value", value).text(value));
}

function initControls() {
  const months = uniqSorted(state.data.map((d) => formatMonth(d.orderDate)));
  const minMonth = months[0];
  const maxMonth = months[months.length - 1];

  state.controls.dateStart = minMonth;
  state.controls.dateEnd = maxMonth;

  d3.select("#dateStart").attr("min", minMonth).attr("max", maxMonth).property("value", minMonth);
  d3.select("#dateEnd").attr("min", minMonth).attr("max", maxMonth).property("value", maxMonth);

  setOptions("#regionSelect", uniqSorted(state.data.map((d) => d.region)));
  setOptions("#categorySelect", uniqSorted(state.data.map((d) => d.category)));
  setOptions("#segmentSelect", uniqSorted(state.data.map((d) => d.segment)));

  d3.select("#dateStart").on("change", () => {
    state.controls.dateStart = d3.select("#dateStart").property("value");
    clampDateRange();
    refresh();
  });

  d3.select("#dateEnd").on("change", () => {
    state.controls.dateEnd = d3.select("#dateEnd").property("value");
    clampDateRange();
    refresh();
  });

  d3.select("#regionSelect").on("change", () => {
    state.controls.region = d3.select("#regionSelect").property("value");
    refresh();
  });

  d3.select("#categorySelect").on("change", () => {
    state.controls.category = d3.select("#categorySelect").property("value");
    refresh();
  });

  d3.select("#segmentSelect").on("change", () => {
    state.controls.segment = d3.select("#segmentSelect").property("value");
    refresh();
  });

  d3.select("#metricSelect").on("change", () => {
    state.controls.metric = d3.select("#metricSelect").property("value");
    refresh();
  });

  d3.select("#topN").on("input", () => {
    state.controls.topN = +d3.select("#topN").property("value");
    d3.select("#topNValue").text(state.controls.topN);
    drawBarChart();
  });
}

function clampDateRange() {
  if (state.controls.dateStart > state.controls.dateEnd) {
    const temp = state.controls.dateStart;
    state.controls.dateStart = state.controls.dateEnd;
    state.controls.dateEnd = temp;
    d3.select("#dateStart").property("value", state.controls.dateStart);
    d3.select("#dateEnd").property("value", state.controls.dateEnd);
  }
}

function filterData() {
  const start = parseMonth(state.controls.dateStart);
  const end = parseMonth(state.controls.dateEnd);

  state.filtered = state.data.filter((d) => {
    const month = parseMonth(formatMonth(d.orderDate));
    const inDate = month >= start && month <= end;
    const inRegion = state.controls.region === "All" || d.region === state.controls.region;
    const inCategory = state.controls.category === "All" || d.category === state.controls.category;
    const inSegment = state.controls.segment === "All" || d.segment === state.controls.segment;
    return inDate && inRegion && inCategory && inSegment;
  });
}

function drawKpis() {
  const target = d3.select("#kpiCards");
  target.selectAll("*").remove();

  const totalSales = d3.sum(state.filtered, (d) => d.sales);
  const totalProfit = d3.sum(state.filtered, (d) => d.profit);
  const margin = totalSales ? totalProfit / totalSales : 0;
  const orders = new Set(state.filtered.map((d) => d.order_id)).size;

  const cards = [
    { label: "Total Sales", value: currency(totalSales) },
    { label: "Total Profit", value: currency(totalProfit) },
    { label: "Profit Margin", value: pct(margin) },
    { label: "Orders", value: d3.format(",")(orders) },
  ];

  cards.forEach((card) => {
    const node = target.append("article").attr("class", "kpi-card");
    node.append("p").attr("class", "kpi-label").text(card.label);
    node.append("p").attr("class", "kpi-value").text(card.value);
  });
}

function drawLineChart() {
  const { width, height, margin } = dims.line;
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  d3.select("#lineChart").selectAll("*").remove();

  // Etape 1-2 (cours): dimensions/marges + ajout SVG
  const svg = d3
    .select("#lineChart")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // Etape 3-4 (cours): collecte + regroupement temporel
  const series = d3
    .rollups(
      state.filtered,
      (rows) => ({ sales: d3.sum(rows, (d) => d.sales), profit: d3.sum(rows, (d) => d.profit) }),
      (d) => formatMonth(d.orderDate)
    )
    .map(([ym, agg]) => ({ month: parseMonth(ym), ym, sales: agg.sales, profit: agg.profit }))
    .sort((a, b) => a.month - b.month);

  if (!series.length) {
    g.append("text")
      .attr("x", innerW / 2)
      .attr("y", innerH / 2)
      .attr("text-anchor", "middle")
      .attr("fill", palette.neutral)
      .text("Aucune donnee pour ce filtre");
    d3.select("#lineSummary").text("0 points");
    return;
  }

  // Etape 5-6 (cours): echelles + couleurs
  const x = d3.scaleTime().domain(d3.extent(series, (d) => d.month)).range([0, innerW]);
  const yMin = d3.min(series, (d) => Math.min(d.sales, d.profit));
  const yMax = d3.max(series, (d) => Math.max(d.sales, d.profit));
  const y = d3.scaleLinear().domain([Math.min(0, yMin) * 1.1, yMax * 1.1]).nice().range([innerH, 0]);

  // Etape 9 (cours): axes
  g.append("g").attr("class", "grid-line").call(d3.axisLeft(y).tickSize(-innerW).tickFormat("").ticks(6));
  g.append("g").attr("class", "axis").attr("transform", `translate(0,${innerH})`).call(d3.axisBottom(x).ticks(8));
  g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(6));

  g.append("text").attr("x", innerW / 2).attr("y", innerH + 40).attr("text-anchor", "middle").text("Periode (mois)");
  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerH / 2)
    .attr("y", -50)
    .attr("text-anchor", "middle")
    .text("Montant ($)");

  const line = d3
    .line()
    .x((d) => x(d.month))
    .y((d) => y(d.value))
    .curve(d3.curveMonotoneX);

  const chartSeries = [
    { key: "sales", label: "Sales", color: palette.sales },
    { key: "profit", label: "Profit", color: palette.profit },
  ];

  chartSeries.forEach((serie) => {
    const points = series.map((d) => ({ month: d.month, ym: d.ym, value: d[serie.key] }));

    // Etape 7-8 (cours): tracage des lignes multiseries
    const path = g
      .append("path")
      .datum(points)
      .attr("fill", "none")
      .attr("stroke", serie.color)
      .attr("stroke-width", state.controls.metric === serie.key ? 3 : 2)
      .attr("opacity", state.controls.metric === serie.key ? 1 : 0.65)
      .attr("d", line)
      .on("mouseover", function () {
        d3.select(this).transition().duration(50).attr("stroke-width", 7).attr("opacity", 0.55);
      })
      .on("mouseout", function () {
        d3.select(this)
          .transition()
          .duration(50)
          .attr("stroke-width", state.controls.metric === serie.key ? 3 : 2)
          .attr("opacity", state.controls.metric === serie.key ? 1 : 0.65);
      });

    const length = path.node().getTotalLength();
    path
      .attr("stroke-dasharray", `${length} ${length}`)
      .attr("stroke-dashoffset", length)
      .transition()
      .duration(900)
      .attr("stroke-dashoffset", 0);

    g.selectAll(`.dot-${serie.key}`)
      .data(points)
      .join("circle")
      .attr("class", `dot-${serie.key}`)
      .attr("cx", (d) => x(d.month))
      .attr("cy", (d) => y(d.value))
      .attr("r", 0)
      .attr("fill", serie.color)
      .on("mousemove", (event, d) => {
        showTooltip(event, `${serie.label}<br>${d.ym}<br><b>${currency(d.value)}</b>`);
      })
      .on("mouseout", hideTooltip)
      .transition()
      .delay((_, i) => i * 12)
      .duration(200)
      .attr("r", 3);
  });

  const legend = g.append("g").attr("transform", `translate(${innerW + 10}, 20)`);
  chartSeries.forEach((s, i) => {
    const row = legend.append("g").attr("transform", `translate(0, ${i * 24})`);
    row.append("rect").attr("width", 14).attr("height", 14).attr("fill", s.color);
    row.append("text").attr("x", 20).attr("y", 11).attr("fill", "#314b40").style("font-size", "12px").text(s.label);
  });

  d3.select("#lineSummary").text(
    `${series.length} mois | Sales: ${currency(d3.sum(series, (d) => d.sales))} | Profit: ${currency(
      d3.sum(series, (d) => d.profit)
    )}`
  );
}

function drawBarChart() {
  const { width, height, margin } = dims.bar;
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  d3.select("#barChart").selectAll("*").remove();

  const svg = d3
    .select("#barChart")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const metric = state.controls.metric;
  const grouped = d3
    .rollups(
      state.filtered,
      (rows) => ({
        sales: d3.sum(rows, (d) => d.sales),
        profit: d3.sum(rows, (d) => d.profit),
        margin: d3.sum(rows, (d) => d.sales) ? d3.sum(rows, (d) => d.profit) / d3.sum(rows, (d) => d.sales) : 0,
      }),
      (d) => d.region
    )
    .map(([region, agg]) => ({ region, ...agg, value: agg[metric] }))
    .sort((a, b) => d3.descending(a.value, b.value))
    .slice(0, state.controls.topN);

  if (!grouped.length) {
    g.append("text").attr("x", innerW / 2).attr("y", innerH / 2).attr("text-anchor", "middle").text("Aucune donnee");
    return;
  }

  const x = d3
    .scaleBand()
    .domain(grouped.map((d) => d.region))
    .range([0, innerW])
    .padding(0.3);

  const y = d3
    .scaleLinear()
    .domain([Math.min(0, d3.min(grouped, (d) => d.value)), d3.max(grouped, (d) => d.value) * 1.1])
    .nice()
    .range([innerH, 0]);

  g.append("g").attr("class", "axis").attr("transform", `translate(0,${innerH})`).call(d3.axisBottom(x));
  g.append("g").attr("class", "axis").call(d3.axisLeft(y));

  g.append("line").attr("x1", 0).attr("x2", innerW).attr("y1", y(0)).attr("y2", y(0)).attr("stroke", "#95aca1");

  g.selectAll(".bar")
    .data(grouped)
    .join("rect")
    .attr("class", "bar")
    .attr("x", (d) => x(d.region))
    .attr("width", x.bandwidth())
    .attr("y", y(0))
    .attr("height", 0)
    .attr("fill", (d) => (d.value >= 0 ? palette.pos : palette.neg))
    .on("mousemove", (event, d) => {
      showTooltip(
        event,
        `${d.region}<br>${metric}: <b>${currency(d.value)}</b><br>Margin: ${pct(d.margin)}<br>Sales: ${currency(
          d.sales
        )}`
      );
    })
    .on("mouseout", hideTooltip)
    .transition()
    .duration(650)
    .attr("y", (d) => (d.value >= 0 ? y(d.value) : y(0)))
    .attr("height", (d) => Math.abs(y(d.value) - y(0)));
}

function drawDonutChart() {
  const { width, height } = dims.donut;
  const radius = Math.min(width, height) * 0.31;

  d3.select("#donutChart").selectAll("*").remove();

  const svg = d3
    .select("#donutChart")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`);

  const grouped = d3
    .rollups(
      state.filtered,
      (rows) => d3.sum(rows, (d) => d.sales),
      (d) => d.segment
    )
    .map(([segment, sales]) => ({ segment, sales }))
    .sort((a, b) => d3.descending(a.sales, b.sales));

  if (!grouped.length) {
    svg.append("text").attr("text-anchor", "middle").attr("fill", palette.neutral).text("Aucune donnee");
    return;
  }

  const pie = d3.pie().sort(null).value((d) => d.sales);
  const arc = d3.arc().innerRadius(radius * 0.5).outerRadius(radius);

  svg.selectAll(".arc")
    .data(pie(grouped))
    .join("path")
    .attr("fill", (d) => palette.segment(d.data.segment))
    .attr("stroke", "#fff")
    .attr("stroke-width", 1)
    .on("mousemove", (event, d) => {
      const total = d3.sum(grouped, (e) => e.sales);
      showTooltip(event, `${d.data.segment}<br>${currency(d.data.sales)} (${pct(d.data.sales / total)})`);
    })
    .on("mouseout", hideTooltip)
    .transition()
    .duration(620)
    .attrTween("d", function (d) {
      const interp = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
      return (t) => arc(interp(t));
    });

  const legend = svg.append("g").attr("transform", `translate(${-radius * 1.15}, ${radius + 24})`);
  grouped.forEach((item, i) => {
    const row = legend.append("g").attr("transform", `translate(${i * 150},0)`);
    row.append("rect").attr("width", 12).attr("height", 12).attr("fill", palette.segment(item.segment));
    row.append("text").attr("x", 16).attr("y", 10).style("font-size", "12px").text(item.segment);
  });
}

function drawScatterChart() {
  const { width, height, margin } = dims.scatter;
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  d3.select("#scatterChart").selectAll("*").remove();

  const svg = d3
    .select("#scatterChart")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const sample = state.filtered.slice(0, 1400);
  if (!sample.length) {
    g.append("text").attr("x", innerW / 2).attr("y", innerH / 2).attr("text-anchor", "middle").text("Aucune donnee");
    return;
  }

  const x = d3.scaleLinear().domain([0, d3.max(sample, (d) => d.discount) * 1.05]).range([0, innerW]);
  const yExtent = d3.extent(sample, (d) => d.profit);
  const y = d3.scaleLinear().domain([yExtent[0] * 1.1, yExtent[1] * 1.1]).nice().range([innerH, 0]);
  const r = d3.scaleSqrt().domain([0, d3.max(sample, (d) => d.sales)]).range([2, 10]);

  g.append("g").attr("class", "grid-line").call(d3.axisLeft(y).tickSize(-innerW).tickFormat("").ticks(6));
  g.append("g").attr("class", "axis").attr("transform", `translate(0,${innerH})`).call(d3.axisBottom(x).ticks(8));
  g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(6));

  g.append("line").attr("x1", 0).attr("x2", innerW).attr("y1", y(0)).attr("y2", y(0)).attr("stroke", "#8ea69a");

  g.append("text").attr("x", innerW / 2).attr("y", innerH + 40).attr("text-anchor", "middle").text("Discount");
  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerH / 2)
    .attr("y", -50)
    .attr("text-anchor", "middle")
    .text("Profit ($)");

  g.selectAll(".point")
    .data(sample)
    .join("circle")
    .attr("class", "point")
    .attr("cx", (d) => x(d.discount))
    .attr("cy", (d) => y(d.profit))
    .attr("r", 0)
    .attr("fill", (d) => palette.category(d.category))
    .attr("opacity", 0.66)
    .on("mousemove", (event, d) => {
      showTooltip(
        event,
        `${d.category} / ${d.sub_category}<br>Sales: <b>${currency(d.sales)}</b><br>Profit: <b>${currency(
          d.profit
        )}</b><br>Discount: ${pct(d.discount)}`
      );
    })
    .on("mouseout", hideTooltip)
    .transition()
    .duration(450)
    .attr("r", (d) => r(d.sales));
}

function drawInsights() {
  const target = d3.select("#insightsList");
  target.selectAll("*").remove();

  if (!state.filtered.length) {
    target.append("li").text("Aucune observation pour les filtres selectionnes.");
    return;
  }

  const totalSales = d3.sum(state.filtered, (d) => d.sales);
  const totalProfit = d3.sum(state.filtered, (d) => d.profit);

  const regionPerf = d3
    .rollups(
      state.filtered,
      (rows) => ({ sales: d3.sum(rows, (d) => d.sales), profit: d3.sum(rows, (d) => d.profit) }),
      (d) => d.region
    )
    .map(([region, v]) => ({ region, ...v, margin: v.sales ? v.profit / v.sales : 0 }))
    .sort((a, b) => d3.descending(a[state.controls.metric], b[state.controls.metric]));

  const bestRegion = regionPerf[0];
  const worstRegion = regionPerf[regionPerf.length - 1];

  const highDiscount = state.filtered.filter((d) => d.discount >= 0.3);
  const highDiscountLossRate = highDiscount.length
    ? highDiscount.filter((d) => d.profit < 0).length / highDiscount.length
    : 0;

  [
    `Perimetre filtre: ${state.filtered.length} lignes, Sales ${currency(totalSales)}, Profit ${currency(totalProfit)} (margin ${pct(
      totalSales ? totalProfit / totalSales : 0
    )}).`,
    `Region la plus performante (${state.controls.metric}): ${bestRegion.region} (${currency(
      bestRegion[state.controls.metric]
    )}).`,
    `Region la plus faible (${state.controls.metric}): ${worstRegion.region} (${currency(
      worstRegion[state.controls.metric]
    )}).`,
    `Risque remises: ${highDiscount.length} lignes avec discount >= 30%, dont ${pct(
      highDiscountLossRate
    )} en perte.`,
  ].forEach((line) => target.append("li").text(line));
}

function showTooltip(event, html) {
  tooltip
    .html(html)
    .style("left", `${event.clientX + 14}px`)
    .style("top", `${event.clientY - 14}px`)
    .classed("visible", true);
}

function hideTooltip() {
  tooltip.classed("visible", false);
}

function refresh() {
  filterData();
  drawKpis();
  drawLineChart();
  drawBarChart();
  drawDonutChart();
  drawScatterChart();
  drawInsights();
}

async function init() {
  state.data = await d3.csv("data/superstore_clean.csv", parseRow);
  initControls();
  refresh();
}

init();
