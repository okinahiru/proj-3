let svg;
const margin = { top: 10, right: 30, bottom: 50, left: 120 },
  width = 1200 - margin.left - margin.right,
  height = 900 - margin.top - margin.bottom;

function iniSvg() {
  d3.select("#chart svg").remove();
  return d3
    .select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
}

function update(data) {
  svg = iniSvg();
  const sumstat = d3.group(data, (d) => d.country);
  const x = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.decade))
    .range([0, width]);
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.population)])
    .range([height, 0]);

  axes(x, y);
  gridlines(x, y);

  const color = d3
    .scaleOrdinal()
    .domain(sumstat.keys())
    .range(d3.schemeCategory10);

  const tooltip = d3.select("#tooltip");

  drawGraph(sumstat, x, y, color, tooltip);
  svg
    .append("text")
    .attr("text-anchor", "end")
    .attr("x", width / 2 + margin.left - 70)
    .attr("y", height + margin.top + 30)
    .text("Decade");

  svg
    .append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 15)
    .attr("x", -margin.top - height / 2 + 20)
    .text("Population");
}

function axes(x, y) {
  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));
  svg.append("g").call(d3.axisLeft(y));
}

function gridlines(x, y) {
  svg
    .append("g")
    .attr("class", "grid")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickSize(-height).tickFormat(""));
  svg
    .append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(y).tickSize(-width).tickFormat(""));
}

function drawGraph(sumstat, x, y, color, tooltip) {
  sumstat.forEach((value, key) => {
    const lineFunction = d3
      .line()
      .x((d) => x(d.decade))
      .y((d) => y(d.population));
    svg
      .append("path")
      .datum(value)
      .attr("fill", "none")
      .attr("stroke", color(key))
      .attr("stroke-width", 3)
      .attr("d", lineFunction);

    svg
      .selectAll(".dot")
      .data(value)
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
            `Name: ${key}<br>Decade: ${
              d.decade
            }<br>Population: ${d.population.toLocaleString()}`
          )
          .style("left", event.pageX + 15 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => tooltip.style("opacity", 0));
  });
}

d3.csv("test2.csv", (d) => ({
  decade: +d.decade,
  population: +d.population,
  country: d.country,
  type: d.type,
})).then((data) => {
  setupCheckboxes(data);
  update(data);
  setupSearch(data);
});

function setupCheckboxes(data) {
  const checkboxes = d3
    .select(".checkboxes")
    .selectAll("input")
    .data(["country", "continent"])
    .enter()
    .append("label")
    .text((d) => d.charAt(0).toUpperCase() + d.slice(1))
    .append("input")
    .attr("type", "checkbox")
    .attr("checked", true)
    .attr("name", (d) => d)
    .on("change", function () {
      updateCheckboxes(data);
    });
}

function updateCheckboxes(data) {
  const selectedTypes = d3
    .selectAll(".checkboxes input[type=checkbox]:checked")
    .nodes()
    .map((el) => el.name);
  const filteredData = data.filter((d) => selectedTypes.includes(d.type));
  update(filteredData);
}

function setupSearch(data) {
  const searchInput = document.getElementById("searchInput");
  const dropdownContent = document.createElement("div");
  dropdownContent.className = "dropdown-content";
  document.querySelector(".search-container").appendChild(dropdownContent);

  function suggestions(filteredData) {
    dropdownContent.innerHTML = "";
    dropdownContent.style.display = "block";

    filteredData.forEach((country) => {
      const suggestionDiv = document.createElement("div");
      suggestionDiv.textContent = country;
      suggestionDiv.onclick = function () {
        searchInput.value = country;
        const countryData = data.filter((d) => d.country === country);
        update(countryData);
        dropdownContent.style.display = "none";
      };
      dropdownContent.appendChild(suggestionDiv);
    });
  }

  searchInput.addEventListener("input", function () {
    const searchText = this.value.trim().toLowerCase();
    if (!searchText) {
      dropdownContent.style.display = "none";
      update(data);
      return;
    }

    const filteredCountries = data
      .map((d) => d.country)
      .filter(
        (country, index, self) =>
          self.indexOf(country) === index &&
          country.toLowerCase().includes(searchText)
      );

    if (filteredCountries.length) {
      suggestions(filteredCountries);
    } else {
      dropdownContent.style.display = "none";
    }
  });

  document.addEventListener("click", function (event) {
    if (!searchInput.contains(event.target)) {
      dropdownContent.style.display = "none";
    }
  });
}
