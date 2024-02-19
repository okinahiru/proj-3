const margin = { top: 10, right: 30, bottom: 30, left: 60 },
  width = 460 - margin.left - margin.right,
  height = 400 - margin.top - margin.bottom;

const svg = d3
  .select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

d3.csv("test2.csv", function (d) {
  return {
    decade: +d.decade,
    population: +d.population,
    country: d.country,
    type: d.type,
  };
}).then(function (data) {
  const countryData = data.filter((d) => d.type === "country");
  const sumstat = d3.group(countryData, (d) => d.country);
  const x = d3
    .scaleLinear()
    .domain(d3.extent(countryData, (d) => d.decade))
    .range([0, width]);
  svg
    .append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(countryData, (d) => d.population)])
    .range([height, 0]);
  svg.append("g").call(d3.axisLeft(y));
  const color = d3
    .scaleOrdinal()
    .domain(sumstat.keys())
    .range(d3.schemeCategory10);
  svg
    .selectAll(".line")
    .data(sumstat)
    .join("path")
    .attr("fill", "none")
    .attr("stroke", (d) => color(d[0]))
    .attr("stroke-width", 1.5)
    .attr("d", (d) =>
      d3
        .line()
        .x((d) => x(d.decade))
        .y((d) => y(d.population))(d[1])
    );
});
