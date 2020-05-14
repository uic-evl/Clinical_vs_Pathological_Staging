/* JavaScript file displaying a choropleth map with multiple views
 * that encompasses the data from the UIC cohort.
 * 
 * Project funded by the Chancellor’s Undergraduate Research Award (CURA)
 * at the University of Illinois at Chicago (UIC)
 * 
 * @Author: Michael Tran
 *  
 */

// Margins definition
var margin = ({
    top: 20,
    right: 40,
    bottom: 20,
    left: 40
})


// Main SVG containing all inner SVGs and elements
var container = d3.select("body")
  .append('svg')
  .attr('width', "90%")
  .attr('height', "85%")
  .attr("class", "topo")
  .attr("border", 1)

var demoTitleHeight = 75; // Space of demographic/legend title
var innerPadding = 10 // Padding to be in between the two charts

window.onresize = redraw;

stackedBarDomain = ["gender", "ethnicity", "insurance"] // Domain of the stacked bars
ratingScaleDomain_C = ["t_stage_clinical", "n_stage_clinical", "m_stage_clinical"] // Domain of the Clinical staging
ratingScaleDomain_P = ["t_stage_path", "n_stage_path", "m_stage_path"] // Domain of the Pathological Staging

var first = true; // Used to draw axes only once in createRatingScale() function

var stackedBarsHeightTotal = 180; // Stacked bars will only take 180 pixels in total for height
var ratingChartHeightTotal = 150; // Rating chart will only take 150 pixels in total for height

var CSPSTextX = 0;                     // Starting x of ClinicalStaging/PathologicalStaging text
var CSPSTextY = margin.top + 180 + 70; // Starting y of ClinicalStaging/PathologicalStaging text

var svg_width = parseInt(container.style("width"));   // Width of svg (90% of screenWidth)
var svg_height = parseInt(container.style("height")); // Height of svg (85% of screen)

var top_width =  (svg_width - margin.left - margin.right - innerPadding * 2) / 3
var top_height = svg_height - margin.top - margin.bottom;

var minWidth = 1680; // From research-stylesheet.css
var minHeight = 900; // From research-stylesheet.css

var mapTitleHeight = top_height * .25; // 25% of the space
var mapTitlePadding = top_height * .02; // 2% padding
var mapHeight = top_height * .73; // 73% of the space

// Original labels corresponding to the JSON object
var orig_labels = new Object({
  age: [
    "<10",
    "10-19",
    "20-29",
    "30-39",
    "40-49",
    "50-59",
    "60-69",
    "70-79",
    ">80"
  ],
  gender: ["Male", "Female"],
  ethnicity: [
    "White",
    "Black",
    "American Indian",
    "Hispanic",
    "Asian",
    "Other"
  ],
  insurance: [
    "Medicaid",
    "Medicare",
    "Charity Care",
    "Blue Cross/Blue Shield",
    "Humana",
    "Cigna",
    "Aetna",
    "Self-Pay",
    "County Care",
    "Other"
  ],
  t_stage_clinical: [
    "T0",
    "Tx",
    "T1",
    "T1a",
    "T1b",
    "T2",
    "T3",
    "T4",
    "T4a",
    "T4b",
    "Tis"
  ],
  n_stage_clinical: ["N0", "N1", "N2", "N2a", "N2b", "N2c", "N3", "Nx"],
  m_stage_clinical: ["M0", "M1", "Mx"],
  t_stage_path: ["T0", "Tis", "T1", "T1a", "T1b", "T2", "T3", "T4a", "T4b"],
  n_stage_path: ["N0", "N1", "N2a", "N2b", "N2c", "N3", "NND"],
  m_stage_path: ["M0", "M1", "Msus", "CM0"]
})

// Edited labels of the data to display, (used in the generated object in PopulationData())
var edit_labels = new Object({
  age: [
    "<10",
    "10-19",
    "20-29",
    "30-39",
    "40-49",
    "50-59",
    "60-69",
    "70-79",
    ">80"
  ],
  gender: ["Male", "Female", "N/A"],
  ethnicity: [
    "White",
    "Black",
    "American Indian",
    "Hispanic",
    "Asian",
    "Other",
    "N/A"
  ],
  insurance: [
    "Medicaid/Medicare",
    "Blue Cross/Blue Shield",
    "Self-Pay",
    "County Care",
    "Other",
    "N/A"
  ],
  t_stage_clinical: [
    "T0",
    "T1",
    "T1a",
    "T1b",
    "T2",
    "T3",
    "T4",
    "T4a",
    "T4b",
    "Tx",    
    "Tis",

  ],
  n_stage_clinical: ["N0", "N1", "N2", "N2a", "N2b", "N2c", "N3", "Nx"],
  m_stage_clinical: ["M0", "M1", "Mx"],
  t_stage_path: ["T0", "T1", "T1a", "T1b", "T2", "T3", "T4a", "T4b", "Tis"],
  n_stage_path: ["N0", "N1", "N2a", "N2b", "N2c", "N3", "NND"],
  m_stage_path: ["M0", "M1", "Msus", "CM0"]
})


// Define colors to use
var colors = new Object({
  map: ["#edf8fb", "#b3cde3", "#8c96c6", "#88419d"],
  gender: ["#779ecb", "#cb779e", "#000000"],
  age: [
    "rgb(235, 229, 245)",
    "rgb(193, 174, 224)",
    "rgb(165, 137, 210)",
    "rgb(123, 82, 189)"
  ],
  ethnicity: ["#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854", "#e5c494", "#000000"],
  insurance: ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fdbf6f", "#000000"],
  clinical: "#66c2a5",
  pathological: "#fc8d62"
})

// Define scales of colors
var colorScales = new Object({
  map: d3
    .scaleThreshold()
    .domain([1, 5, 10, 20])
    .range(colors.map),
  gender: d3
    .scaleOrdinal()
    .domain(edit_labels.gender)
    .range(colors.gender),
  age: d3
    .scaleOrdinal()
    .domain([1, 5, 10, 20])
    .range(colors.age),
  ethnicity: d3
    .scaleOrdinal()
    .domain(edit_labels.ethnicity)
    .range(colors.ethnicity),
  insurance: d3
    .scaleOrdinal()
    .domain(edit_labels.insurance)
    .range(colors.insurance)
})



// --------------------------------------- Creating necessary SVGs ---------------------------------------

var containerBorder = container
  .append("rect")
  .attr("x", 0)
  .attr("y", 0)
  .attr("height", svg_height)
  .attr("width", svg_width)
  .style("fill", "#fcf8f3")
  .attr("rx", 30)

var map = container
  .append('svg')
  .attr('id', 'map')
  .attr('width', top_width)
  .attr('height', top_height)
  .attr('x', margin.left)
  .attr('y', margin.top)

var demographics = container
  .append('svg')
  .attr('id', 'demo')
  .attr('width', top_width)
  .attr('height', top_height)
  .attr('x', margin.left + top_width + innerPadding)
  .attr('y', margin.top + 40)  

var demographicLabels = container
  .append('svg')
  .attr('id', 'demolabels')
  .attr('width', top_width)
  .attr('height', top_height)
  .attr('x', margin.left + top_width * 2 + innerPadding * 2)
  .attr('y', margin.top + 40)    

var demographicTitleSvg = container
  .append('svg')
  .attr('id', 'demotitle')
  .attr('width', top_width)
  .attr('height', demoTitleHeight)
  .attr('x', margin.left + top_width + innerPadding)
  .attr('y', 0)      

var demographicLabelsTitleSvg = container
  .append('svg')
  .attr('id', 'demolabelstitle')
  .attr('width', top_width)
  .attr('height', demoTitleHeight)
  .attr('x', margin.left + top_width * 2 + innerPadding * 2)
  .attr('y', 0)        


// --------------------------------------- Append necessary elements to SVGs ---------------------------------

// Group for the bars
gBar = demographics
  .append('g')
  .attr('class', 'gBar')
  .attr('transform', `translate(${margin.left}, ${margin.top})`)

// Group for the xAxis
gxAxis = demographics
  .append('g')
  .attr('transform', `translate(${margin.left}, ${margin.top})`)
  .attr("class", "xAxis")

// Group for the yAxis
gyAxis = demographics
  .append('g')
  .attr('transform', `translate(${margin.left * 2}, ${margin.top})`)
  .attr("class", "yAxis")

// Title of demographics
demoTitle = demographicTitleSvg.append("text")
  .attr('class', 'demotitletext')
  .attr("x", (top_width + margin.left) / 2)
  .attr("y", (75) / 2)
  .style("text-anchor", "middle")
  .text("Demographics");

// Title of legend
demoLabelsTitle = demographicLabelsTitleSvg.append("text")
  .attr('class', 'demotitletext')
  .attr("x", top_width / 2)
  .attr("y", (75) / 2)
  .style("text-anchor", "middle")
  .text("Legend");

// Title of clincal staging
clinicalTitle = demographics
  .append(`g`)
  .attr('class', "RatingTitle")
  .attr('transform', `translate(${CSPSTextX}, ${CSPSTextY - 30})`)
  .append("text")
  .attr('class', 'RatingTitleText')
  .attr("x", top_width / 2)
  .style("text-anchor", "middle")
  .text("Clinical Staging");

// Title of pathological staging
pathologicalTitle = demographicLabels
  .append(`g`)
  .attr('class', "RatingTitle")
  .attr('transform', `translate(${CSPSTextX}, ${CSPSTextY - 30})`)
  .append("text")
  .attr('class', 'RatingTitleText')
  .attr("x", top_width / 2)
  .style("text-anchor", "middle")
  .text("Pathological Staging");

// Create a group for each stackable bars & legends based on stackedBarDomain
for (var i = 0; i < stackedBarDomain.length; i++) {
  demographics
    .append('g')
    .attr('class', `g${stackedBarDomain[i]}`)
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  demographicLabels.append("g").attr("class", `${stackedBarDomain[i]}legend`);
}


// --------------------------------------- Grab necessary data from CSV/JSON ---------------------------------

// Get chicago topojson
var json = d3.json(
  "topojson/chicago_zipcodes.json"
)

// Get chicago dataset
var csv = d3.csv(
  '/Data/demographics.csv'
)

// Wait until we get all data to create the map and values
Promise.all([json, csv]).then(function(values){

  jsondata = values[0];
  csvdata = values[1];

  // Get geojson from topojson
  geojson = topojson.feature(jsondata, jsondata.objects["Boundaries - ZIP Codes"])  

  // create projection of Chicago to be used for choropleth map
  projection = d3.geoMercator().fitSize([top_width, mapHeight], geojson)

  populationData = PopulationData();

  createMap(populationData["zipData"], top_width)

  // Create data for overall
  createDataChart(
    populationData,
    demographics,
    demographicLabels,
    top_width
  );

})


// --------------------------------------- Functions defined below ---------------------------------

/* Function dedicated to the creation of map 
 * 
 * @params:
 *  zipData - zipcode data from our object created from json
 *  svgWidth - Width of the svg to hold the map
 */
function createMap(zipData, svgWidth) {
  // Add labels for legend
  var legendLabels = [0, 5, 10, 20];

  mapLegend = map
    .append("svg")
    .attr('id', 'mapLegend')
    .attr('width', top_width)
    .attr('height', mapTitleHeight + mapTitlePadding)    
  
  mapImage = map
    .append("svg")
    .attr('id', 'mapImage')
    .attr('width', top_width)
    .attr('height', mapHeight)
    .attr('x', 0)
    .attr('y', mapTitleHeight + mapTitlePadding)              

  var legendScale = d3
    .scaleBand()
    .domain(d3.range(legendLabels.length))
    .rangeRound([0, svgWidth])
    .paddingInner(0.05);

  var theLegend = mapLegend
    .append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${20}, ${20})`);

  var legend = d3
    .legendColor()
    .labelFormat(d3.format("1f"))
    .labels([0, 5, 10, 20])
    .labelWrap(legendScale.bandwidth())
    .shapeWidth(50)
    .labelAlign("middle")
    .titleWidth(svgWidth)
    .title("Head and Neck Cancer Patients Treated at UIC")
    .orient('horizontal')
    .scale(colorScales.map);

  mapLegend.select(".legend").call(legend);

  // Create number of people + current zipcode text
  var currZip = mapLegend
    .append('g')
    .attr('class', 'currZipGroup')
    .attr('transform', `translate(${20}, ${mapTitleHeight - 60})`)
    .append('text')
    .attr('class', 'currZipText')
    .text("Zipcode: All")    

  var numPeople = mapLegend
    .append('g')
    .attr('class', 'numPeopleGroup')
    .attr('transform', `translate(${20}, ${mapTitleHeight - 30})`)
    .append('text')
    .attr('class', 'numPeopleText')
    .text(`Number of patients: ${populationData.num_people}`)


  // Created own button to prevent using divs
  var button = mapLegend.append('g')
    .attr('transform', `translate(${top_width / 2}, ${mapTitleHeight - 70})`)
    .attr('class', 'backButton')
    .on('mouseover', function(d, i) {
      d3.select('.backButtonBackground').transition(200).style('fill', '#66c2a5').style('opacity', .5)
    })
    .on('mouseout', function(d, i) {
      d3.select('.backButtonBackground').transition(200).style('fill', 'white').style('opacity', 1)
    })
    .on('mousedown', function(d, i){
      d3.select('.backButtonBackground').style('fill', '#66c2a5').style('opacity', .8)
    })
    .on('mouseup', function(d, i){
      d3.select('.backButtonBackground').transition(200).style('fill', '#66c2a5').style('opacity', .5)
    })
    .on('click', function(d, i){
      createDataChart(
        populationData,
        demographics,
        demographicLabels,
        top_width
      );

      // Modify the text
      currZip
      .text(`Zipcode: All`)    

      numPeople
        .text(`Number of patients: ${populationData.num_people}`)
      this.onclick = function(){
        return false;
      }
    })    
  
  button
    .append("rect")
    .attr('class', 'backButtonBackground')  
    .attr('width', 100)
    .attr('height', 30)
    .style('fill', 'white')
    .style("stroke", 'black')
    .style("stroke-width", 1);
 

  button
    .append("text")
    .attr('class', 'backButtonText') 
    .attr('x', 8)
    .attr('y', 20)
    .style('fill', 'black')
    .text("All Zipcodes")    
  
  mapLegend.append('g')
   
  .attr('transform', `translate(${top_width / 2}, ${mapTitleHeight - 70})`)




  // Create tooltip
  var tip = d3.tip()
    .attr('class', "d3-tip")
    .style("color", "white")
    .style("background-color", "black")
    .style("padding", "6px")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .offset([-10, 0])
    .html(function(d) {
      return d;
    });

  map.call(tip);

  var timeout = null;

  // Add the data to the choropleth map
  mapImage
    .selectAll("path")
    .data(geojson.features)
    .enter()
    .append("path")
    .attr("id", function(d, i) {
      return String("zip" + d.properties.zip);
    })
    .attr("fill", function(d, i) {
      return colorScales.map(zipData[d.properties.zip].c_stage.length);
    })
    .attr("d", d3.geoPath(projection))
    .on('mouseover', function(d, i) {
      // On mouseover of zipcode of choropleth map, search the choropleth for 
      // the zipcode that we are currently hovering our mouse and change the
      // opacity of it.
      var zip = d.properties.zip;

      container.selectAll(`#zip${zip}`).each(function(d) {
        d3.select(this).style("stroke", "black").style("opacity", ".5");
      });

      tip.show(zip, this);
    })
    .on('mouseout', function(d, i) {
      // On mouseout of zipcode of choropleth map, search the choropleth for 
      // the zipcode that our mouse currently and reset opacity of it.
      var zip = d.properties.zip;

      container.selectAll(`#zip${zip}`).each(function(d) {
        d3.select(this).style("stroke", "black").style("opacity", "1");
        tip.hide();
      });
    })
    .on('click', function(d, i) {
      // Timeout for double clicking
      clearTimeout(timeout);

      // If only one click then create data chart for particular zip code
      timeout = setTimeout(function() {
        createDataChart(
          populationData["zipData"][d.properties.zip],
          demographics,
          demographicLabels,
          top_width
        );

        // Modify the text
        currZip
        .text(`Zipcode: ${d.properties.zip}`)    

        numPeople
          .text(`Number of patients: ${populationData['zipData'][d.properties.zip].num_people}`)
      }, 300);
    })
    .on('dblclick', function(d, i) {
      // Double click then display the data for overall
      clearTimeout(timeout);
      createDataChart(
        populationData,
        demographics,
        demographicLabels,
        top_width
      );

      // Modify the text
      currZip
      .text(`Zipcode: All`)    

      numPeople
        .text(`Number of patients: ${populationData.num_people}`)
      
    });
}


/* Function dedicated to the creation of charts with data,
 * stacked bar charts, legend, rating scale of clinical/
 * pathological staging
 *
 * @params:
 *  chartData - Object holding the data of the chart, see PopulationData function
 *              for more information/formatting
 *  svgDemo - The SVG holding the demographics
 *  svgDemoLabels - The SVG holding the labels for the demographics
 *  svgWidth - Width of SVG for both svgDemo/svgDemoLabels
 */
function createDataChart(
  chartData,
  svgDemo,
  svgDemoLabels,
  svgWidth
) {

  var chartWidth = svgWidth - margin.left - margin.right; // Adding margins for chart


  // Scale for labels
  var xBarLabelScale = d3
    .scaleBand()
    .domain(stackedBarDomain)
    .range([0, chartWidth])
    .paddingInner(0.05);

  // Scale for the stacked bar charts on top of each other for demographics
  var yBarScale = d3
    .scaleBand()
    .domain(stackedBarDomain)
    .range([0, stackedBarsHeightTotal])
    .paddingInner(0.05);
  
  
  // Create axes for stacked bar charts in x/y directions
  var xAxisScale = d3
    .scaleLinear()
    .range([margin.left, chartWidth]);
  
  var xAxis = d3
    .axisTop()
    .scale(xAxisScale)
    .ticks(10, "%");

  var yAxis = d3
    .axisLeft()
    .scale(yBarScale);


  svgDemo.select("g.xAxis").call(xAxis);
  svgDemo.select("g.yAxis").call(yAxis);


  // Create all the labels and stacked charts for every element in our stackedBarDomain
  // (gender, ethnicity, insurance)
  for (var i = 0; i < stackedBarDomain.length; i++) {
    createLegend(
      svgDemoLabels,
      stackedBarDomain[i],
      margin.left + xBarLabelScale.step() * i,
      margin.top
    );
    createStackedChart(
      svgDemo,
      chartData,
      stackedBarDomain[i],
      xAxisScale,
      yBarScale
    );
  }

  // Create y-direction scales for our rating charts so they will span only ratingChartHeightTotal pixels
  var yRatingScaleC = d3
    .scaleBand()
    .domain(ratingScaleDomain_C)
    .range([0, ratingChartHeightTotal])
    .paddingInner(0.05);

  var yRatingScaleP = d3
    .scaleBand()
    .domain(ratingScaleDomain_P)
    .range([0, ratingChartHeightTotal])
    .paddingInner(0.05);

  // Create Rating scale for each staging for clinical (T/N/M)
  for (var i = 0; i < ratingScaleDomain_C.length; i++) {
    createRatingScale(
      svgDemo,
      chartData,
      ratingScaleDomain_C[i],
      margin.left,
      CSPSTextY,
      chartWidth,
      yRatingScaleC,
      colors.clinical
    );
  }

  // Create Rating scale for each staging for pathological (T/N/M)  
  for (var i = 0; i < ratingScaleDomain_P.length; i++) {
    createRatingScale(
      svgDemoLabels,
      chartData,
      ratingScaleDomain_P[i],
      margin.left,
      CSPSTextY,
      chartWidth,
      yRatingScaleP,
      colors.pathological
    );
  }
  first = false;
}

/* Function dedicated to the creation of legend labels
 *
 * @params:
 *  svg - SVG holding the legend labels (svgDemoLabels in this case)
 *  label - string holding the label to be modified by selecting the group of that label
 *  xTranslate - The x position that the legend should be translated
 *  yTranslate - The y position that the legend should be translated
 */
function createLegend(svg, label, xTranslate, yTranslate) {
  var colorScale = colorScales[label];

  var theLegend = svg
    .select(`g.${label}legend`)
    .attr("transform", `translate(${xTranslate},${yTranslate})`)
    .style("font-size", "12px");

  var legend = d3
    .legendColor()
    .labelFormat(d3.format("1f"))
    .labels(edit_labels[label])
    .labelWrap(30)
    .shapeWidth(30)
    .labelAlign("middle")
    .shapePadding(5)
    .orient('vertical')
    .scale(colorScale);

  theLegend.call(legend);
}

/* Function dedicated to the creation of stacked charts
 *
 * @params:
 *  svg - SVG holding the legend labels (svgDemoLabels in this case)
 *  data - Data to be displayed in the stacked bar chart
 *  label - string holding the label to be modified by selecting the group of that label
 *  xScale - The scale for the width of the individual bars in a stacked bar chart
 *  yScale - The scale for the height of the different stacked bar charts
 */
function createStackedChart(svg, data, label, xScale, yScale) {
  var chartData = getStackableData(data, label); // Transform the data into data that can be used in stacked bar chart
  var yCoord = yScale(label);
  var yHeight = yScale.bandwidth();

  var bars = svg
    .select(`g.g${label}`)
    .selectAll("rect")
    .data(chartData);

  // Create tooltip
  var tip = d3.tip()
    .attr('class', "d3-tip")
    .style("color", "white")
    .style("background-color", "black")
    .style("padding", "6px")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .offset([-10, 0])
    .html(function(d) {
      return d;
    });

  svg.call(tip);

  // On data that is not yet plotted as bars yet
  bars
    .enter()
    .append("rect")
    .attr('id', function(d, i) {
      return String(d);
    })
    .attr('x', function(data, index) {
      return margin.left;
    })
    .attr("y", function(data, index) {
      return yCoord;
    })
    .attr("width", function(data, index) {
      return 0;
    })
    .attr("height", function(data, index) {
      return yHeight;
    })
    .on('mouseover', function(d, i) {
      tip.show(
        `${d.key} - ${d3.format(".1f")((d[0][1] - d[0][0]) * 100)}% (${
          d[0].data[label][d.key]
        })`,
        this
      );
    })
    .on('mouseout', function(d, i) {
      tip.hide();
    })
    .merge(bars) // Apply all changes to bars after this point
    .transition()
    .duration(500)
    .attr("x", function(data, index) {
      return xScale(data[0][0]);
    })
    .attr("y", function(data, index) {
      return yCoord;
    })
    .attr("width", function(data, index) {
      return xScale(data[0][1]) - xScale(data[0][0]);
    })
    .attr("height", function(data, index) {
      return yHeight;
    })
    .attr("fill", function(data, index) {
      if (findIfExist(edit_labels[label], data.key)) {
        return colorScales[label](data.key);
      }
      return 0;
    });

  bars
    .exit()
    .remove()
    .attr("x", function(data, index) {
      return 0;
    })
    .transition()
    .duration(500);
}

/* Function dedicated to the creation of stacked charts
 *
 * @params:
 *  svg - SVG holding the rating scales
 *  data - Data to be displayed in the rating scales
 *  label - string holding the label to be modified by selecting the group of that label (3 staging, T/N/M)
 *  xTranslate - The x position that the rating chart should be translated
 *  yTranslate - The y position that the rating chart should be translated
 *  chartWidth - Width of the rating chart
 *  yScale - The scale for the height of the different rating charts stacked on top of each other
 *  color - color of the circles of the rating scale
 */
function createRatingScale(svg, data, label, xTranslate, yTranslate, chartWidth, yScale, color) {

  var chartData = Object.keys(data[label]);
  var chartValues = data[label];

  var max = d3.max(Object.values(data[label]));
  var minR = 3;
  var maxR = 17;

  var rScale = d3
    .scaleLinear()
    .domain([0, max])
    .range([minR, maxR]);

  var xScale = d3
    .scalePoint()
    .domain(chartData)
    .range([0, chartWidth]);

  if(first){ // Only called once to prevent drawing multiple axes
    // If have time, rewrite code...
    var xAxis = d3
      .axisBottom()
      .scale(xScale)
      .tickPadding(15);

    var gctxAxis = svg
      .append('g')
      .attr('transform', `translate(${xTranslate}, ${yTranslate + yScale(label)})`)
      .attr("class", `${label}xAxis`)

    // Create axes first so they are behind the circles
    gctxAxis.call(xAxis);
  }

  svg
    .append('g')
    .attr('class', `g${label}`)
    .attr('transform', `translate(${xTranslate}, ${yTranslate})`);

  var circles = svg
    .select(`g.g${label}`)
    .selectAll("circle")
    .data(chartData);

  // On data that is not yet plotted as bars yet
  circles
    .enter()
    .append("circle")
    .attr("cx", function(data, index) {
      return xScale(data);
    })
    .attr("cy", function(data, index) {
      return yScale(label);
    })
    .attr("r", function(data, index) {
      return 0;
    })
    .merge(circles) // Apply all changes to bars after this point
    .transition()
    .duration(500)
    .attr("cx", function(data, index) {
      return xScale(data);
    })
    .attr("cy", function(data, index) {
      return yScale(label);
    })
    .attr("r", function(data, index) {
      // Dont show circle if there is no data or it is the minimum size (meaning no data)
      return max > 0 && rScale(chartValues[data]) != minR
        ? rScale(chartValues[data])
        : 0;
    })
    .attr("fill", function(data, index) {
      return color;
    });

  circles
    .exit()
    .remove()
    .attr("cx", function(data, index) {
      return 0;
    })
    .transition()
    .duration(500);
}

// -------------------------------------- Helper Functions -------------------------------------

/* Function generates a map for number as keys and domain as values to parse the JSON.
 * Used in generating the data in PopulationData() function
 *  
 * @params: null
 * 
 * @return:
 *  Function returns the generated map that has id number as keys and data name as values
 */
function getLabelMap() {
  var labelDictionary = {};
  for (const label in orig_labels) {
    labelDictionary[label] = {};

    for (var index = 0; index < orig_labels[label].length; index++) {
      var objProperty = orig_labels[label][index];
      labelDictionary[label][index + 1] = objProperty;
    }
  }
  return labelDictionary;
}

/* Function converts data into percentages for stacked bars usage. Please print out the object
 * that is returned to see more details.
 *  
 * @params:
 *  data - data to be converted
 *  label - identifier to determine what the domain of the data is (in edit_labels)
 * 
 * @return:
 *  Function returns the converted data that has the data with corresponding percentages
 *  and keys as identifiers
 */
function getStackableData(data, label) {
  var series = d3
    .stack()
    .keys(edit_labels[label])
    .value(function value(d, key) {
      return d[label][key];
    })
    .offset(d3.stackOffsetExpand);
  return series([data]);
}

/* Function organizes data into objects for easier usage. Please print out the object
 * that is returned to see more details.
 *  
 * @params: null
 * 
 * @return:
 *  Function returns the JSON object of the data
 */
function PopulationData() {
  var dictDemo = {};

  for (const label in edit_labels) {
    // Create object for everything except num_people since it will only be a number
    if(label == 'num_people')
      dictDemo[label] = 0;
    else
      dictDemo[label] = {};

    for (var index = 0; index < edit_labels[label].length; index++) {
      var objProperty = edit_labels[label][index];
      dictDemo[label][objProperty] = 0;
    }
  }

  dictDemo["zipData"] = {};

  // Initialize on overall data
  dictDemo.c_stage = [];
  dictDemo.p_stage = [];
  dictDemo.num_people = 0;

  /* Add all zipcodes in the choropleth zipcode list */
  geojson.features.forEach(function(d) {
    dictDemo["zipData"][d.properties.zip] = {};
    for (const label in edit_labels) {
      dictDemo["zipData"][d.properties.zip][label] = {};

      for (var index = 0; index < edit_labels[label].length; index++) {
        var objProperty = edit_labels[label][index];
        dictDemo["zipData"][d.properties.zip][label][objProperty] = 0;
      }
    }

    // Initialize on per zip code data
    dictDemo["zipData"][d.properties.zip].c_stage = [];
    dictDemo["zipData"][d.properties.zip].p_stage = [];
    dictDemo['zipData'][d.properties.zip].num_people = 0;
  });

  // Go through each of the data (each iteration is one person)
  for (const elem of csvdata) {
    if (dictDemo["zipData"][elem.zipcode] === undefined) {
      // Will skip any zipcodes that are not in "chicago"
      continue;
    }

    for (const label in orig_labels) { 
      // Extract the values from the data
      var dataValue = parseInt(elem[label]);
      
      if (isNaN(dataValue)){ 
        if(label == 'gender' || label == 'ethnicity' || label == 'insurance'){
          dictDemo["zipData"][elem.zipcode][label]["N/A"]++;
          dictDemo[label]["N/A"]++;
        }
        continue;
      }

      var labelMappedFromValue = getLabelMap()[label][dataValue];
      //console.log(getLabelMap())

      if (
        labelMappedFromValue == 'Aetna' ||
        labelMappedFromValue == 'Humana' ||
        labelMappedFromValue == "Charity Care" ||
        labelMappedFromValue == "Cigna"
      ) {
        // Combine Aetna/Humana/Charity Care/Cigna into Other
        dictDemo["zipData"][elem.zipcode][label]['Other']++;
        dictDemo[label]['Other']++;
      } else if (
        labelMappedFromValue == 'Medicaid' ||
        labelMappedFromValue == 'Medicare'
      ) {
        // Combine medicaid/medicare into one
        dictDemo["zipData"][elem.zipcode][label]["Medicaid/Medicare"]++;
        dictDemo[label]["Medicaid/Medicare"]++;
      } else {
        dictDemo["zipData"][elem.zipcode][label][labelMappedFromValue]++;
        dictDemo[label][labelMappedFromValue]++;
      }
    }

    var t_stage_clinical = parseInt(elem.t_stage_clinical);
    var n_stage_clinical = parseInt(elem.n_stage_clinical);
    var m_stage_clinical = parseInt(elem.m_stage_clinical);
    var t_stage_path = parseInt(elem.t_stage_path);
    var n_stage_path = parseInt(elem.n_stage_path);
    var m_stage_path = parseInt(elem.m_stage_path);

    dictDemo["zipData"][elem.zipcode].c_stage.push([
      t_stage_clinical,
      n_stage_clinical,
      m_stage_clinical
    ]);
    dictDemo["zipData"][elem.zipcode].p_stage.push([
      t_stage_path,
      n_stage_path,
      m_stage_path
    ]);

    dictDemo.c_stage.push([
      t_stage_clinical,
      n_stage_clinical,
      m_stage_clinical
    ]);
    dictDemo.p_stage.push([t_stage_path, n_stage_path, m_stage_path]);

    dictDemo['zipData'][elem.zipcode].num_people++;
    dictDemo.num_people++;

  }
  console.log(dictDemo);
  return dictDemo;
}

/* Function checks if toFind element exists in the array
 *
 * @params:
 *  array - array to be searched
 *  toFind - element in the array to search for
 * 
 * @return:
 *  Function returns true if element exists, false otherwise
 */
function findIfExist(array, toFind) {
  for (var index = 0; index < array.length; index++) {
    if (array[index] === toFind) return true;
  }
  return false;
}

/* Function runs when resized event is occuring. Resizes all the SVG/data to
 * the new resized window
 *
 * @params: null
 * 
 * @return: null
 */
function redraw(){
  var windowWidth = window.innerWidth > minWidth ? window.innerWidth : minWidth;
  var windowHeight = window.innerHeight > minHeight ? window.innerHeight : minHeight;

  container.attr("width", `${windowWidth * .90}px`);
  container.attr("height", `${windowHeight * .85}px`);

  svg_width = parseInt(container.style("width"));   // Width of svg (90% of screenWidth)
  svg_height = parseInt(container.style("height")); // Height of svg (85% of screen)

  top_width =  (svg_width - margin.left - margin.right - innerPadding * 2) / 3
  top_height = svg_height - margin.top - margin.bottom;

  // -------------------------------------- Resize all drawings to the new sizes -----------------------------
  containerBorder.attr("width", `${windowWidth * .90}px`);
  containerBorder.attr("height", `${windowHeight * .85}px`);

  chartWidth = top_width - margin.left - margin.right; // Adding margins for chart

  var mapTitleHeight = top_height * .25; // 25% of the space
  var mapTitlePadding = top_height * .02; // 2% padding
  var mapHeight = top_height * .73; // 73% of the space

  map
    .attr('width', top_width)
    .attr('height', top_height)

  demographics
    .attr('width', top_width)
    .attr('x', margin.left + top_width + innerPadding)
    .attr('y', margin.top + 40)          

  demographicLabels
    .attr('width', top_width)
    .attr('x', margin.left + top_width * 2 + innerPadding * 2)
    .attr('y', margin.top + 40)        

  demographicTitleSvg
    .attr('width', top_width)
    .attr('x', margin.left + top_width + innerPadding)
    .attr('y', 0)     

  demographicLabelsTitleSvg
    .attr('width', top_width)
    .attr('x', margin.left + top_width * 2 + innerPadding * 2)
    .attr('y', 0)         

  demoTitle
    .attr("x", (top_width + margin.left) / 2)

  demoLabelsTitle
    .attr("x", top_width / 2)

  clinicalTitle
    .attr("x", top_width / 2)

  pathologicalTitle
    .attr("x", top_width / 2)


  map
    .select("#mapLegend")
    .attr('width', top_width)

  // Generate new projection
  projection = d3.geoMercator().fitSize([top_width, mapHeight], geojson)
  map
    .select("#mapImage")
    .attr('width', top_width)
    .attr('height', top_height)    
    .attr('x', 0)
    .attr('y', mapTitleHeight + mapTitlePadding)          
    .selectAll("path")
    .attr("id", function(d, i) {
      return String("zip" + d.properties.zip);
    })
    .attr("d", d3.geoPath(projection));

  
  // Edit the stacked bar charts

  // Scale for x direction stacked bars
  xAxisScale = d3
    .scaleLinear()
    .range([margin.left, chartWidth]);

  demographics
    .selectAll("rect")
    .attr("x", function(data, index) {
      return xAxisScale(data[0][0]);
    })    
    .attr("width", function(data, index) {
      return xAxisScale(data[0][1]) - xAxisScale(data[0][0]);
    })
  
  xAxis = d3
    .axisTop()
    .scale(xAxisScale)
    .ticks(10, "%");    

  demographics 
    .select("g.xAxis").call(xAxis);

  // Scale for labels
  xBarLabelScale = d3
    .scaleBand()
    .domain(stackedBarDomain)
    .range([0, chartWidth])
    .paddingInner(0.05);

  for (var i = 0; i < stackedBarDomain.length; i++) {
    demographicLabels
    .select(`g.${stackedBarDomain[i]}legend`)    
    .attr("transform", `translate(${margin.left + xBarLabelScale.step() * i},${margin.top})`);
  }

  // Edit the rating scales
  for(var i = 0; i < ratingScaleDomain_C.length; i++){
    xRatingScale = d3
    .scalePoint()
    .domain(Object.keys(populationData[ratingScaleDomain_C[i]]))
    .range([0, chartWidth]);

    xAxis = d3
      .axisBottom()
      .scale(xRatingScale)
      .tickPadding(15);

    demographics
      .select(`.${ratingScaleDomain_C[i]}xAxis`)
      .call(xAxis);  

    demographics
      .select(`g.g${ratingScaleDomain_C[i]}`)
      .selectAll("circle")
      .attr("cx", function(data, index) {
        return xRatingScale(data);
      })      
  }
  for(var i = 0; i < ratingScaleDomain_P.length; i++){
    xRatingScale = d3
    .scalePoint()
    .domain(Object.keys(populationData[ratingScaleDomain_P[i]]))
    .range([0, chartWidth]);

    xAxis = d3
      .axisBottom()
      .scale(xRatingScale)
      .tickPadding(15);

    demographicLabels
      .select(`.${ratingScaleDomain_P[i]}xAxis`)
      .call(xAxis);  

    demographicLabels
      .select(`g.g${ratingScaleDomain_P[i]}`)
      .selectAll("circle")
      .attr("cx", function(data, index) {
        return xRatingScale(data);
      })        
  }

}