
var subsetSize = 150;
var pointRadius = 6;
var zoomEndDelay = 250;

// timeout function
var zoomEndTimeout;



// define all size variables
var fullWidth = 500;
var fullHeight = 500;
var margin = {top: 10, right: 10, bottom: 30, left: 30};
var width = fullWidth - margin.left - margin.right;
var height = fullHeight - margin.top - margin.bottom;

var myColor = d3.scale.category10()



$(document).ready(function(){
	var canvas = d3.select("#plot-canvas")
            .attr("width", width - 1)
            .attr("height", height - 1)
            .style("transform", "translate(" + (margin.left + 1) +
                "px" + "," + (margin.top + 1) + "px" + ")");
    console.log(canvas)
    var svg = d3.select("#axis-svg")
        .attr("width", fullWidth)
        .attr("height", fullHeight)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," +
            margin.top + ")");
    console.log(svg)

    var result=null

    function reset(){
        console.log("reset")
        drawManhattan(result)
    }

    loadData().then((processedData)=>{
        result=processedData
        drawManhattan(result)
    })


    function median(values){
      if(values.length ===0) return 0;

      values.sort(function(a,b){
        return a-b;
      });

      var half = Math.floor(values.length / 2);
      return values[half];

    }

    function loadData(){
        return new Promise((resolve,reject)=>{
            d3.tsv("fake_pvalue.tsv",function(fdata){
                    var numberPoints = fdata.length
                    var chrs= new Set (fdata.map((ele)=>ele.chr))
                    
                    var offSets={0:{max:0,start:0}}
                    for (let chr of chrs){
                        var filterData=fdata.filter((ele)=>ele.chr===chr).map((ele)=>Number(ele.pos))
                        offSets[chr]={min:Math.min(...filterData),max:Math.max(...filterData),start:offSets[chr-1].start+offSets[chr-1].max,median:median(filterData)}
                    }
                    delete offSets[0]
                    var data=fdata.map((ele)=>({x:ele.pos-offSets[ele.chr].min+offSets[ele.chr].start,y:-Math.log10(ele.pvalue),i:ele.id,chr:ele.chr,selected:false}))
                    console.log(offSets)
              
                    var xdata =[]
                    var xdataMap={}
                    Object.keys(offSets).forEach(key=>{
                        let value=offSets[key].median+offSets[key].start;
                        xdata.push(value);
                        xdataMap[value]=key;
                    })
                    console.log(xdata)
                    console.log(xdataMap)
                    var quadTree = d3.geom.quadtree(data);
                    resolve({numberPoints:numberPoints,chrs:chrs,offSets:offSets,data:data,xdata:xdata,xdataMap:xdataMap,quadTree:quadTree})

            })
        })
    }

        // the canvas is shifted by 1px to prevent any artefacts
        // when the svg axis and the canvas overlap
        
    


    function drawManhattan(result){
        console.log(canvas)
        console.log("draw manhattan")
        var numberPoints=result.numberPoints
        var chrs=result.chrs
        var offSets=result.offSets
        var data=result.data
        var xdata=result.xdata
        var xdataMap=result.xdataMap
        var quadTree = result.quadTree;

        // selected 250 random numbers -- this is the subset of points
        // drawn during 'zoom' events
        var randomIndex = _.sampleSize(_.range(numberPoints), subsetSize);


        svg.select(".axis").remove();
        svg.select("#chr").remove();

        // ranges, scales, axis, objects
        var xRange = d3.extent(data, function(d) { return d.x });
        var yRange = d3.extent(data, function(d) { return d.y });

        var xScale = d3.scale.linear()
            .domain([xRange[0] - 5, xRange[1] + 5])
            .range([0, width]);

        var yScale = d3.scale.linear()
            .domain([0, yRange[1] + 3])
            .range([height, 0]);


        var xAxis = d3.svg.axis()
            .scale(xScale)
            .innerTickSize(-height)
            .outerTickSize(0)
            .tickPadding(10)
            .orient('bottom')
            .ticks(10)
            .tickValues(xdata)
            .tickFormat(function(d){
                if (d in xdataMap){
                    return xdataMap[d];
                }else{
                    return d;
                }
            })

        var xAxisSvg = svg.append('g')
            .attr('class', 'xaxis axis')
            .attr('transform', 'translate(0,' + height + ')')
            .call(xAxis);

        var yAxis = d3.svg.axis()
            .scale(yScale)
            .innerTickSize(-width)
            .outerTickSize(0)
            .orient('left');

       var yAxisSvg = svg.append('g')
            .attr('class', 'yaxis axis')
            .call(yAxis);

        // create zoom behaviour
        var zoomBehaviour = d3.behavior.zoom()
            .x(xScale)
            // .y(yScale)
            .scaleExtent([1, 10])
            .on("zoom", onZoom)
            .on("zoomend", onZoomEnd);

        // add zoom behaviour
        canvas.call(zoomBehaviour);
        canvas.on("click", onClick);
        console.log(canvas.node())
        // get the canvas drawing context
        var context = canvas.node().getContext('2d');

        draw();

            // the draw function draws the full dataset if no index
        // parameter supplied, otherwise it draws a subset according
        // to the indices in the index parameter
        function draw(index) {
            var active;
                // save the index of the currently selected point
           

            // quadTree = d3.geom.quadtree(data);
            svg.select("#chr").remove();
            svg.select(".xaxis").remove();


            svg.append('g')
            .attr('class', 'xaxis axis')
            .attr('transform', 'translate(0,' + height + ')')
            .call(xAxis);

            // on onclick handler
            

            context.clearRect(0, 0, fullWidth, fullHeight);
            context.fillStyle = 'steelblue';
            context.strokeWidth = 1;
            context.strokeStyle = 'white';

            // if an index parameter is supplied, we only want to draw points
            // with indices in that array
            if(index) {
                index.forEach(function(i) {
                    var point = data[i];
                    // if(!point.selected) {
                        drawPoint(point, pointRadius);
                    // }
                    // else {
                        // active = point;
                    // }
                });
            }
            // draw the full dataset otherwise
            else {
                console.log("draw all")
                data.forEach(function(point) {
                    if(!point.selected) {
                        drawPoint(point, pointRadius);
                    }
                    else {
                        active = point;
                    }
                });
            }

            // ensure that the actively selected point is drawn last
            // so it appears at the top of the draw order
            if(active) {
                context.fillStyle = 'red';
                drawPoint(active, pointRadius);
                context.fillStyle = 'steelblue';
            }
        }

        function drawPoint(point, r) {
            var cx = xScale(point.x);
            var cy = yScale(point.y);
            // NOTE; each point needs to be drawn as its own path
            // as every point needs its own stroke. you can get an insane
            // speed up if the path is closed after all the points have been drawn
            // and don't mind points not having a stroke
            context.beginPath();
            context.arc(cx, cy, r, 0, 2 * Math.PI);
            context.closePath();
            context.fillStyle=myColor(point.chr)
            context.fill();
            context.stroke();
        }


        function onZoom() {
            clearTimeout(zoomEndTimeout);
            console.log("On zoom ", randomIndex.length)
            draw(randomIndex);
            xAxisSvg.call(xAxis);
            // yAxisSvg.call(yAxis);
        }

        function onZoomEnd() {
            // when zooming is stopped, create a delay before
            // redrawing the full plot
            console.log("on Zoom End")
            zoomEndTimeout = setTimeout(function() {
                draw();
            }, zoomEndDelay);
        }


        function onClick() {
            console.log("onClick called")
            var mouse = d3.mouse(this);
            var selectedPoint;
            // map the clicked point to the data space
            var xClicked = xScale.invert(mouse[0]);
            var yClicked = yScale.invert(mouse[1]);
            // find the closest point in the dataset to the clicked point
            var closest = quadTree.find([xClicked, yClicked]);

            var selectedChr= closest.chr
            var chrData = data.filter((ele)=>ele.chr===selectedChr)
            console.log(chrData)
            var chrquadTree = d3.geom.quadtree(chrData);
            var index=chrData.map((ele)=>ele.i)
            var chrrandomIndex = _.sampleSize(index, subsetSize);
            var chr_scale=d3.scale.linear()
                .domain([offSets[selectedChr].start - 5, offSets[selectedChr].start+offSets[selectedChr].max + 5])
                .range([0, width]);

            canvas.on("click", onChrClick);

            var chrzoomBehaviour=d3.behavior.zoom()
                .x(chr_scale)
                // .y(yScale)
                .scaleExtent([1, 50])
                .on("zoom", onchrZoom)
                .on("zoomend", onchrZoomEnd)
              
            canvas.call(chrzoomBehaviour)
                .on("dblclick.zoom", null)
            drawChr(index,selectedChr)

            function drawChr(index,selectedChr){
                var active;
                clearTimeout(zoomEndTimeout);
                console.log("draw chr")
                context.clearRect(0, 0, fullWidth, fullHeight);
                context.strokeWidth = 1;
                context.strokeStyle = 'white';
                context.fillStyle=myColor(selectedChr)
                               
                svg.select(".xaxis").remove();
                svg.select("#chr").remove();
                
                
                index.forEach(function(i) {
                    var point = data[i];
                    if (!point.selected){
                        drawChrPoint(point, pointRadius);
                    }else{
                        active=point
                    }
                    // chrxAxisSvg.call(chrxAxis);

                });
                svg.append("text")
                    .attr("id","chr")
                    .attr("text-anchor", "middle") 
                    .attr("transform", "translate("+ (width/2) +","+(height+20)+")") 
                    .text("chr"+selectedChr);

                if(active) {
                    console.log("draw active point", active)
                    context.fillStyle = 'red';
                    drawChrPoint(active, pointRadius);
                }
                    
            }


            function onchrZoom() {
                clearTimeout(zoomEndTimeout);
                console.log("On chr zoom ", chrrandomIndex.length)
                drawChr(chrrandomIndex,selectedChr);
                // chrxAxisSvg.call(chrxAxis);
                // yAxisSvg.call(yAxis);
            }

            function onchrZoomEnd() {
                // when zooming is stopped, create a delay before
                // redrawing the full plot
                console.log("on chr Zoom End")
                zoomEndTimeout = setTimeout(function() {
                    drawChr(index,selectedChr);
                }, zoomEndDelay);
            }

            function onChrClick() {
                console.log("onChrClick called")
                var mouse = d3.mouse(this);
                // map the clicked point to the data space
                var xClicked = chr_scale.invert(mouse[0]);
                var yClicked = yScale.invert(mouse[1]);
                var closest = chrquadTree.find([xClicked, yClicked]);

                var dX = chr_scale(closest.x);
                var dY = yScale(closest.y);
                console.log(mouse[0], mouse[1], xClicked,yClicked,closest.x, closest.y, dX, dY)

                // register the click if the clicked point is in the radius of the point
                var distance = euclideanDistance(mouse[0], mouse[1], dX, dY);
                console.log(distance,pointRadius)
                if(distance < pointRadius) {
                    if(selectedPoint) {
                        var selectedIndex=index.indexOf(selectedPoint.toString())
                        chrData[selectedIndex].selected = false;
                    }
                    closest.selected = true;
                    selectedPoint = closest.i;

                    // redraw the points
                    drawChr(index,selectedChr)
                }

                console.log(closest)
            
            }

            function euclideanDistance(x1, y1, x2, y2) {
                return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
            }

            function drawChrPoint(point,r){
                var cx = chr_scale(point.x);
                var cy = yScale(point.y);
                context.beginPath();
                context.arc(cx, cy, r, 0, 2 * Math.PI);
                context.closePath();
                
                context.fill();
                context.stroke();

            }

        }
    }
		
})

