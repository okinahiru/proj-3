let svg; // This will hold the SVG element reference

function createSvg() {
  // Remove existing svg if it exists
  d3.select("#chart svg").remove();

  // Append the new svg object to the body of the page
  svg = d3
    .select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  return svg;
}

// Define the margin, width, and height for the graph
const margin = { top: 10, right: 30, bottom: 30, left: 100 },
  width = 1200 - margin.left - margin.right,
  height = 900 - margin.top - margin.bottom;

d3.csv("test2.csv", function (d) {
  return {
    decade: +d.decade,
    population: +d.population,
    country: d.country,
    type: d.type,
  };
}).then(function (data) {
  // Function to update the chart based on the selected types
  function updateChart(selectedTypes) {
    svg = createSvg(); // Recreate the SVG container

    // Filter data based on the selected types
    const filteredData = data.filter((d) => selectedTypes.includes(d.type));
    const sumstat = d3.group(filteredData, (d) => d.country);

    // Define scales and axes
    const x = d3
      .scaleLinear()
      .domain(d3.extent(filteredData, (d) => d.decade))
      .range([0, width]);
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(filteredData, (d) => d.population)])
      .range([height, 0]);

    // Add gridlines
    svg
      .append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSize(-height).tickFormat(""));

    svg
      .append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y).tickSize(-width).tickFormat(""));

    // Draw axes
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    svg.append("g").call(d3.axisLeft(y));

    // Define the color scale
    const color = d3
      .scaleOrdinal()
      .domain(sumstat.keys())
      .range(d3.schemeCategory10);

    // Tooltip
    const tooltip = d3.select("#tooltip");

    // Draw lines and points
    sumstat.forEach((value, key) => {
      const lineData = value;
      const lineFunction = d3
        .line()
        .x((d) => x(d.decade))
        .y((d) => y(d.population));

      // Draw line
      svg
        .append("path")
        .datum(lineData)
        .attr("fill", "none")
        .attr("stroke", color(key))
        .attr("stroke-width", 3)
        .attr("d", lineFunction);

      // Draw points
      svg
        .selectAll("dot")
        .data(lineData)
        .enter()
        .append("circle")
        .attr("r", 5)
        .attr("cx", (d) => x(d.decade))
        .attr("cy", (d) => y(d.population))
        .attr("fill", color(key))
        .on("mouseover", (event, d) => {
          tooltip
            .style("opacity", 1)
            .html(
              `Name: ${key}<br>Decade: ${d.decade}<br>Population: ${d.population}`
            )
            .style("left", event.pageX + 15 + "px")
            .style("top", event.pageY - 28 + "px");
        })
        .on("mouseout", () => {
          tooltip.style("opacity", 0);
        });
    });
  }

  // Initial call to draw the chart
  updateChart(["country"]);

  // Setup checkboxes
  const checkboxes = d3
    .select(".checkboxes")
    .selectAll("input")
    .data(["country", "continent"])
    .enter()
    .append("label")
    .text((d) => d.charAt(0).toUpperCase() + d.slice(1))
    .append("input")
    .attr("type", "checkbox")
    .attr("checked", (d, i) => i === 0)
    .attr("name", (d) => d)
    .on("change", function () {
      const selectedTypes = d3
        .selectAll(".checkboxes input[type=checkbox]:checked")
        .nodes()
        .map((el) => el.name);
      updateChart(selectedTypes);
    });

  const searchInput = document.getElementById("searchInput");

  function filterGraph(inputText) {
    const searchText = inputText.trim().toLowerCase();

    svg.selectAll("circle").attr("opacity", 0.07);
    svg.selectAll("path").attr("opacity", 0.07);

    if (searchText) {
      // Highlight matching circles
      svg
        .selectAll("circle")
        .filter((d) => d.country.toLowerCase().includes(searchText))
        .attr("opacity", 1);
    } else {
      svg.selectAll("circle, path").attr("opacity", 1);
    }
  }

  searchInput.addEventListener("input", function () {
    filterGraph(this.value);
  });
});
