(function () {

    const mapContainer = d3.select('#map')

    const width = mapContainer.node().offsetWidth - 60;
    const height = mapContainer.node().offsetHeight - 60;

    const svg = mapContainer
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .classed('position-absolute', true)
        .style('top', 40)
        .style('left', 30);

    const stateGeoJson = d3.json('data/states.geojson')
    const countyTopoJson = d3.json('data/counties.topojson')
    const pollutionTopoJson = d3.json('data/county_pollution.topojson')

    Promise.all([stateGeoJson, countyTopoJson, pollutionTopoJson]).then(getData);

    // accepts the data as a parameter countiesData (??? How did you derive at this -- countiesData ???)
    function getData(data) {

        d3.select('#dropdown-ui select').on('change', function () {
            drawMap(this.value, data)
        });

        drawMap('air_pollution_data_Carb', data)
    }

    function drawMap(pollutant, data) {

        // clear existing map
        svg.selectAll('*').remove()

        const stateData = data[0];
        const countyData = data[1];
        const pollutionData = data[2];

        const countyTopoJson = topojson.feature(countyData, {
            type: 'GeometryCollection',
            geometries: countyData.objects.counties.geometries
        });

        const pollutionGeoJson = topojson.feature(pollutionData, {
            type: 'GeometryCollection',
            geometries: pollutionData.objects.county_pollution.geometries
        });

        // Use D3 legend function: https://observablehq.com/@d3/color-legend
        // get all values for variable, push them in an array
        const myArray = []
        for (let x of pollutionGeoJson.features) {
            myArray.push(+x.properties[pollutant])
        }

        // find the highest and lowest values
        const max = d3.max(myArray)
        const min = d3.min(myArray)
        console.log(myArray, min, max)

        // create color function for classification method and color scheme
        const color = d3.scaleQuantize([min, max], d3.schemePurples[9])

        // Add legend to map
        svg.append("g")
            .attr("transform", "translate(0,50)")
            .append(() => legend({
                color,
                width: 260,
                title: pollutant,
                tickSize: 10,
                tickFormat: ".1f",
            }));

        const projection = d3.geoConicEquidistant()
            .center([0, 40])
            .rotate([97, 0])
            .scale(1300)
            .translate([width / 2, height / 2]);

        const path = d3.geoPath()
            .projection(projection);

        const pollution = svg.append('g')
            .selectAll('path')
            .data(pollutionGeoJson.features)
            .join('path')
            .attr('d', path)
            .attr("fill", d => {
                console.log
                return color(d.properties[pollutant]); // color individual polygons
            })
        // .attr('class', 'pollution')

        // addUi(pollution);

        const tooltip = d3.select('.container-fluid').append('div')
            .attr('class', 'my-tooltip bg-warning text-white py-1 px-2 rounded position-absolute invisible');

        mapContainer
            .on('mousemove', event => {
                tooltip.style('left', (d3.event.pageX + 10) + 'px')
                    .style('top', (d3.event.pageY - 30) + 'px');
            });

        pollution.on('mousemove', (d, i, nodes) => {
            d3.select(nodes[i]).classed('hover', true).raise();
            tooltip.classed('invisible', false).html(`${d.properties.NAME} County<br>${d.properties[pollutant]} parts per billion`)
        })
            .on('mouseout', (d, i, nodes) => {
                d3.select(nodes[i]).classed('hover', false)
                tooltip.classed('invisible', true)
            });
    }
})();