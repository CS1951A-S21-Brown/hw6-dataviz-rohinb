const MAX_WIDTH = Math.max(1080, window.innerWidth);
const MAX_HEIGHT = 720;
const margin = {top: 40, right: 100, bottom: 40, left: 135};

let graph_1_width = (MAX_WIDTH / 2) - 10, graph_1_height = 250;
let graph_2_width = (MAX_WIDTH / 2) - 10, graph_2_height = 275;
let graph_3_width = MAX_WIDTH / 2, graph_3_height = 575;


let svg1 = d3.select("#graph1")
    .append("svg")
    .attr("width", graph_1_width)
    .attr("height", graph_1_height)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

let svg3 = d3.select("#graph3")
    .append("svg")
    .attr("width", graph_3_width)
    .attr("height", graph_3_height)
    .append('g')
    .attr('class', 'map');

var tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function(d) {
              return "<strong>Country: </strong><span class='details'>" + d.properties.name + "<br></span>" + "<strong>Number of wins: </strong><span class='details'>" + d.numWins +"</span>";
            });


svg3.call(tip);
var projection = d3.geoNaturalEarth()
    .scale(graph_3_width / 1.3 / Math.PI)
    .translate([graph_3_width / 2, graph_3_height / 2]);

var path = d3.geoPath().projection(projection);

let x1 = d3.scaleLinear()
    .range([0, graph_1_width - margin.left - margin.right]);

let y1 = d3.scaleBand()
    .range([0, graph_1_height - margin.top - margin.bottom])
    .padding(0.2);  // Improves readability

let countRef = svg1.append("g");
let y1_axis_label = svg1.append("g");

// Add x1-axis label
svg1.append("text")
    .attr("transform", `translate(${margin.left},${graph_1_height - margin.top})`)
    .style("text-anchor", "middle")
    .text("Count");

// Add y1-axis label
let y_axis_text = svg1.append("text")
    .attr("transform", `translate(${-80},${margin.top})`)
    .style("text-anchor", "middle");

// Add chart title
let title = svg1.append("text")
    .attr("transform", `translate(${(graph_1_width - margin.left - margin.right) / 2}, ${-10})`)
    .style("text-anchor", "middle")
    .style("font-size", 15);


// Load data from billboard.csv file
let slider = new Slider('#year', {});
// Update cur_start_year and cur_end_year on slideStop of range slider
slider.on("slideStop", function (range) {
    cur_start_year = range[0];
    cur_end_year = range[1];
    updateDashboard();
});

/**
 * Set the data source for bar and scatter plots between artist and song
 */
function setData(attr) {
    cur_attr = attr;
    attr_input.placeholder = sentenceCase(attr);
    updateDashboard();
}

/**
 * Updates cur attribute with new artist or song from user input
 */
function setAttr() {
    if (cur_attr === "artist") {
        cur_artist = attr_input.value;
    } else {
        cur_song = attr_input.value;
    }
    updateDashboard();
}

/**
 * Updates dashboard scatterplot and barplot after change in date or cur_attr
 */



function updateDashboard() {

    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then(function (data) {
        d3.csv("./data/winners.csv").then(function (winnersData) {
            winnersForName = {};
            winnersData.forEach(function(d) { winnersForName[d.country_name] = d.wins; });
            data.features.forEach(function (d) {
                console.log(d);
                let name = d.properties.name === "USA" ? "United States" : d.properties.name;
                let numWins = winnersForName[name];
                d.numWins = numWins == null ? 0 : numWins;
            });
            svg3.append("g")
                .attr("class", "countries")
                .selectAll("path")
                .data(data.features)
                .enter().append("path")
                .attr("d", path)
                .style("fill", function (d) {
                    return '#e3d47e'
                })
                .style('stroke', 'white')
                .style('stroke-width', 1.5)
                .style("opacity", 0.8)
                // tooltips
                .style("stroke", "white")
                .style('stroke-width', 0.3)
                .on('mouseover', function (d) {
                    tip.show(d);

                    d3.select(this)
                        .style("opacity", 1)
                        .style("stroke", "white")
                        .style("stroke-width", 3);
                })
                .on('mouseout', function (d) {
                    tip.hide(d);

                    d3.select(this)
                        .style("opacity", 0.8)
                        .style("stroke", "white")
                        .style("stroke-width", 0.3);
                });
        });
    });

    d3.csv("./data/years.csv").then(function (data) {
        // TODO: Update the x1 axis domain with the max count of the provided data
        console.log(data);
        console.log(d3.max(data, function (d) {
            return parseInt(d.count);
        }));

        // Update the x1 axis domain with the max count of the provided data
        x1.domain([0, d3.max(data, function (d) {
            return parseInt(d.count);
        })]);
        // Update the y1 axis domains with the desired attribute
        y1.domain(data.map(function (d) {
            return d.year
        }));
        //color.domain(data.map(function(d) { return d.attr }));

        // Render y1-axis label
        y1_axis_label.call(d3.axisLeft(y1).tickSize(0).tickPadding(10));
        let bars = svg1.selectAll("rect").data(data);

        // Render the bar elements on the DOM
        bars.enter()
            .append("rect")
            // Set up mouse interactivity functions
            // .on("mouseover", mouseover_barplot)
            // .on("mouseout", mouseout_barplot)
            // .on("click", click_barplot)
            .merge(bars)
            .transition()
            .duration(1000)
            // .attr("fill", function(d) { return color(d.attr) })
            .attr("x", x1(0))
            .attr("y", function (d) {
                return y1(d.year);
            })
            .attr("width", function (d) {
                return x1(parseInt(d.count));
            })
            .attr("height", y1.bandwidth())
            .attr("id", function (d) {
                return `rect-${d.id}`
            });
        /*
            In lieu of x1-axis labels, display the count of the artist next to its bar on the
            bar plot.
         */
        let counts = countRef.selectAll("text").data(data);
        // Render the text elements on the DOM
        counts.enter()
            .append("text")
            .merge(counts)
            .transition()
            .duration(1000)
            .attr("x", function (d) {
                return x1(parseInt(d.count)) + 10;
            })
            .attr("y", function (d) {
                return y1(d.year) + 10;
            })
            .style("text-anchor", "start")
            .text(function (d) {
                return parseInt(d.count);
            });
        // Add y1-axis text and chart title
        y_axis_text.text("Year");
        title.text("Number of football games played each year");
        // Remove elements not in use if fewer groups in new dataset
        bars.exit().remove();
        counts.exit().remove();
    });
}

/**
 * Checks if a date falls within a provided year range
 */
function validYear(start, end, cur) {
    return (Date.parse(start) < Date.parse(cur)) &&
        (Date.parse(cur) < Date.parse(end));
}

/**
 * Converts a text to sentence case
 */
function sentenceCase(word) {
    return `${word[0].toUpperCase()}${word.substring(1)}`;
}

/**
 * Abbreviates and shortens a given label by adding ellipses
 */
function trimText(label) {
    if (label.length > 20) {
        return label.substring(0, 20) + "..."
    }
    return label;
}

/**
 * Finds all artists collaborating on a song by splitting on predefined text
 * and returns a list of all artists
 */
function splitArtist(artist) {
    let song_artists = artist.split(/(?:Featuring|&|,)/);
    return song_artists.map(s => trimText(s.trim()));
}

/**
 * Returns a darker shade of a given color
 */
function darkenColor(color, percentage) {
    return d3.hsl(color).darker(percentage);
}

updateDashboard();