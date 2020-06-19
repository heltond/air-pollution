(function () {

    const legendContainer = d3.select('#map')

    const width = legendContainer.node().offsetWidth - 60;
    const height = legendContainer.node().offsetHeight - 60;


    const svgLegend = legendContainer
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .classed('position-absolute', true)
        .style('top', 40)
        .style('left', 30);


    const mapContainer = d3.select('#map')

    const svg = mapContainer
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .classed('position-absolute', true)
        .style('top', 40)
        .style('left', 30);


    countyMap();

    var choice = d3.select('#dropdown-tm select').on('change', function () {
        this.value
        var selection = this.value

        if (selection == 'county_select') {
            svg.selectAll('*').remove()
            countyMap()
            selection = '';
        }
        else if (selection == 'point_select') {
            svg.selectAll('*').remove()
            pointMap()
            selection = '';
        }
        else {
            svg.selectAll('*').remove()
            countyMap()
            selection = '';
        }
    })

    function scale(k) {
        console.log(k)
    }

    // Create zoom function
    const zoom = d3.zoom()
      .scaleExtent([0.5,4])
      // on zoom (many events fire this event like mousemove, wheel, dblclick, etc.)...
      .on('zoom', () => {
        svg
          // select all group items in svg
          .selectAll('g') 
          // transform path based on event 
          .attr('transform', d3.event.transform)
        scale(d3.event.transform.k)
      });

    function scale(k) {
        console.log(k)
    }

    // Attach function to svg
    svg.call(zoom)


    
    function countyMap() {

        const stateGeoJson = d3.json('data/states.geojson')
        const countyTopoJson = d3.json('data/counties.topojson')
        const pollutionTopoJson = d3.json('data/county_pollution.topojson')

        Promise.all([stateGeoJson, countyTopoJson, pollutionTopoJson]).then(getData);

        function getData(data) {

            

            d3.select('#dropdown-ui select').on('change', function () {
                svg.selectAll('*').remove()
                svgLegend.selectAll('*').remove()
                drawMap(this.value, data)
            });

            drawMap('air_pollution_data_Carb', data)
        }

        function drawMap(pollutant, data) {

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

            const myArray = []
            for (let x of pollutionGeoJson.features) {
                if (x.properties[pollutant] > 0) {
                myArray.push(+x.properties[pollutant])
                }
            }

            const max = d3.max(myArray)
            const min = d3.min(myArray)

            const wheel = ['#E6E6FA', '#DDA0DD', '#FF00FF', '#9400D3', '#4B0082']

            const color = d3.scaleQuantile().domain(myArray).range(wheel)

            if (pollutant == 'air_pollution_data_Carb' || pollutant == 'air_pollution_data_Ozo') {
                var measure = 'parts per million';
            }
            else if (pollutant == 'air_pollution_data_Lead' || pollutant == 'air_pollution_data_Part') {
                var measure = 'micrograms/cubic meter'
            }
            else {
                var measure = 'parts per billion'
            }

            svgLegend.append("g")
                // .attr("transform", "translate(0,50)")
                .append(() => legend({
                    color,
                    width: 260,
                    title: `${measure}`,
                    tickSize: 10,
                    tickFormat: ".2f",
                }));

            const projection = d3.geoConicEquidistant()
                .center([0, 40])
                .rotate([97, 0])
                .scale(1300)
                .translate([width / 2, height / 2]);

            const path = d3.geoPath()
                .projection(projection);

            const states = svg.append('g')
            .selectAll('path')
            .data(stateData.features)
            .join('path')
            .attr('d', path)
            .attr('fill', 'white')
            .attr('stroke', 'black')
            .attr('class', 'states');

            const pollution = svg.append('g')
            .selectAll('path')
            .data(pollutionGeoJson.features)
            .join('path')
            .attr('d', path)
            .attr("fill", d => {
                if ((d.properties[pollutant]) > 0) {
                return color(d.properties[pollutant]);
                }
                else {
                    return 'transparent'
                }
            })
            .attr('class', 'states'); // don't scale outlines
            // .attr('stroke', 'black');

            const tooltip = d3.select('.container-fluid').append('div')
                .attr('class', 'my-tooltip bg-warning text-white py-1 px-2 rounded position-absolute invisible');

            mapContainer
                .on('mousemove', event => {
                    tooltip.style('left', (d3.event.pageX + 10) + 'px')
                        .style('top', (d3.event.pageY - 30) + 'px');
                });

            pollution.on('mousemove', (d, i, nodes) => {
                d3.select(nodes[i]).classed('hover', true).raise();
                if (d.properties[pollutant] > 0) {
                tooltip.classed('invisible', false).html(`${d.properties.NAME} County<br>${d.properties[pollutant]} ${measure}`)
                }
            })
                .on('mouseout', (d, i, nodes) => {
                    d3.select(nodes[i]).classed('hover', false)
                    tooltip.classed('invisible', true)
                });
        }
    }

    function pointMap() {

        mapView = 'point'

        const pollutionGeoJson = d3.csv('data/air_pollution_data.csv')
        const countyTopoJson = d3.json('data/counties.topojson')
        const stateGeoJson = d3.json('data/states.geojson')

        Promise.all([pollutionGeoJson, countyTopoJson,stateGeoJson]).then(getData);

        function getData(data) {

            d3.select('#dropdown-ui select').on('change', function () {
                svg.selectAll('*').remove()
                svgLegend.selectAll('*').remove()
                drawMap(this.value, data)
            });

            drawMap('air_pollution_data_Carb', data)
        }

        function drawMap(pollutant, data) {

            const pollutionData = data[0];
            const countyData = data[1];
            const stateData = data[2];

            const geojson = topojson.feature(countyData, {
                type: 'GeometryCollection',
                geometries: countyData.objects.counties.geometries
            });

            const myArray = []
            for (let x of pollutionData) {
                if (x[pollutant] > 0) {
                myArray.push(+x[pollutant])
                }
            }

            const max = d3.max(myArray)
            const min = d3.min(myArray)

            const radius = d3.scaleSqrt().domain([0.000000000000001, max]).range([3, 20]);

            const wheel = ['#E6E6FA', '#DDA0DD', '#FF00FF', '#9400D3', '#4B0082']

            const color = d3.scaleQuantile().domain(myArray).range(wheel)

            if (pollutant == 'air_pollution_data_Carb' || pollutant == 'air_pollution_data_Ozo') {
                var measure = 'parts per million';
            }
            else if (pollutant == 'air_pollution_data_Lead' || pollutant == 'air_pollution_data_Part') {
                var measure = 'micrograms/cubic meter'
            }
            else {
                var measure = 'parts per billion'
            }

            svgLegend.append("g")
                // .attr("transform", "translate(0,50)")
                .append(() => legend({
                    color,
                    width: 260,
                    title: `${measure}`,
                    tickSize: 10,
                    tickFormat: ".2f",
                }));

            const projection = d3.geoConicEquidistant()
                .center([0, 40])
                .rotate([97, 0])
                .scale(1300)
                .translate([width / 2, height / 2]);

            const path = d3.geoPath()
                .projection(projection);

            // const counties = svg.append('g')
            //     .selectAll('path')
            //     .data(geojson.features)
            //     .join('path')
            //     .attr('d', path)
            //     .attr('class', 'county');

            const states = svg.append('g')
            .selectAll('path')
            .data(stateData.features)
            .join('path')
            .attr('d', path)
            .attr('fill', 'white')
            .attr('stroke', 'black')
            .attr('class', 'states');

            const pollution = svg.append('g')
                .selectAll('circle')
                .data(pollutionData.sort(function (a, b) {
                    return b[pollutant] - a[pollutant];
                }))
                .join('circle')
                .attr('cx', d => {
                    d.position = projection([d.Longitude, d.Latitude]);
                    return d.position[0];
                })
                .attr('cy', d => {
                    return d.position[1];
                })
                .attr('r', d => {
                    return radius(+d[pollutant]);
                })
                .attr('class', 'pollution')
                .style('fill', d => {
                    if (d[pollutant] > 0) {
                        return color(d[pollutant]);
                    }
                    else {
                        return 'none';
                    }
                })
                .style('stroke', d => {
                    if (d[pollutant] > 0) {
                        return 'black';
                    }
                    else {
                        return 'none';
                    }
                })
                .attr('class', 'points');

            const tooltip = d3.select('.container-fluid').append('div')
                .attr('class', 'my-tooltip bg-warning text-white py-1 px-2 rounded position-absolute invisible');

            mapContainer
                .on('mousemove', event => {
                    tooltip.style('left', (d3.event.pageX + 10) + 'px')
                        .style('top', (d3.event.pageY - 30) + 'px');
                });

            pollution.on('mousemove', (d, i, nodes) => {
                d3.select(nodes[i]).classed('hover', true);
                tooltip.classed('invisible', false).html(`${d.County_Name} County, ${d.State_Name}<br>${d[pollutant]} ${measure}`)
            })
                .on('mouseout', (d, i, nodes) => {
                    d3.select(nodes[i]).classed('hover', false);
                    tooltip.classed('invisible', true)
                });

            //  const circLegend = svg.append('g')
            //    .attr('dy', '1.3em')
            //    .attr('class', 'legend')
            //    .attr('transform', 'translate(' + (width - 40) + ',' + (height - 20) + ')')
            //    .selectAll('g')
            //    .data([5e6, 2e7])
            //    .join('g');
            //
            //   circLegend.append('circle')
            //    .attr('cy', d => {
            //       return -radius(d);
            //      })
            //    .attr('r', radius);
            //
            //    circLegend.append('text')
            //     .attr('y', d => {
            //       return -2 * radius(d);
            //       })
            //     .attr('dy', '1.3em')
            //     .text(d3.format('.1s'));
            //
            //    circLegend.append('text')
            //      .attr('y', 16)
            //      .text(`${measure}`);

        }

    }
})();