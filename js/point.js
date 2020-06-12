(function () {

    const pollutionGeoJson = d3.json('data/air_pollution_data.geojson')
    const countyTopoJson = d3.json('data/counties.topojson')

    Promise.all([pollutionGeoJson, countyTopoJson]).then(getData);

    function getData(data) {

        d3.select('#dropdown-ui select').on('change', function () {
            drawMap(this.value, data)
        });

        drawMap('air_pollution_data_Carb', data)
    }

    function drawMap(pollutant, data) {

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

        svg.selectAll('*').remove()

        const pollutionData = data[0];
        const countyData = data[1];

        const geojson = topojson.feature(countyData, {
            type: 'GeometryCollection',
            geometries: countyData.objects.counties.geometries
        });

        const myArray = []
        for (let x of pollutionData.features) {
            myArray.push(+x.properties[pollutant])
        }

        const max = d3.max(myArray)
        const min = d3.min(myArray)

        const radius = d3.scaleSqrt().domain([0, 1e6]).range([1, 9]);

        const color = d3.scaleQuantize([min, max], d3.schemePurples[9])

        const projection = d3.geoConicEquidistant()
            .center([0, 40])
            .rotate([97, 0])
            .scale(1300)
            .translate([width / 2, height / 2]);

        const path = d3.geoPath()
            .projection(projection);

        const counties = svg.append('g')
            .selectAll('path')
            .data(geojson.features)
            .join('path')
            .attr('d', path)
            .attr('class', 'county');

            const pollution = svg.append('g')
            .selectAll('path')
            .data(pollutionData.features)
            .enter()
            .append('path')
            .attr("fill", d => {
                return color(d.properties[pollutant]);
            })
            .attr('d', path.pointRadius(5));
            
            // .attr('d', path.pointRadius([function (d) {
            //    return radius(d.properties[pollutant]);
            // }]))

        const tooltip = d3.select('.container-fluid').append('div')
            .attr('class', 'my-tooltip bg-warning text-white py-1 px-2 rounded position-absolute invisible');

        mapContainer
            .on('mousemove', event => {
                tooltip.style('left', (d3.event.pageX + 10) + 'px')
                    .style('top', (d3.event.pageY - 30) + 'px');
            });

        pollution.on('mousemove', (d, i, nodes) => {
            d3.select(nodes[i]).classed('hover', true).raise();
            tooltip.classed('invisible', false).html(`${d.properties.County_Name} County<br>${d.properties[pollutant]} parts per billion`)
        })
            .on('mouseout', (d, i, nodes) => {
                d3.select(nodes[i]).classed('hover', false)
                tooltip.classed('invisible', true)
            });

            drawLegend(svg, width, height, radius)
    }

    function drawLegend(svg, width, height, radius) {

        const legend = svg.append('g')
          .attr('dy', '1.3em')
          .attr('class', 'legend')
          .attr('transform', 'translate(' + (width - 40) + ',' + (height - 20) + ')')
          .selectAll('g')
          .data([5e6, 2e7])
          .join('g');
  
        legend.append('circle')
          .attr('cy', d => {
            return -radius(d);
          })
          .attr('r', radius);
  
        legend.append('text')
          .attr('y', d => {
            return -2 * radius(d);
          })
          .attr('dy', '1.3em')
          .text(d3.format('.1s'));
  
        legend.append('text')
          .attr('y', 16)
          .text('metric tons');
      }
})();