
// var subsetSize = 10;
var pointRadius = 6;
var zoomEndDelay = 100;

// timeout function
var zoomEndTimeout;



// define all size variables
var fullWidth = 650;
var fullHeight = 400;
var margin = {top: 10, right: 10, bottom: 30, left: 30};
var width = fullWidth - margin.left - margin.right;
var height = fullHeight - margin.top - margin.bottom;

var myColor = d3.scale.category20()



$(document).ready(function(){
    d3.select("#manhattan_plotting_area")
        .style("width", fullWidth+"px")
        .style("height", fullHeight+"px")
        .style("float", "right")

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
    var yScale;
    var selectedPoint;
    var selectedChr;
    var associationDB;

   
     $("#reset").click(function(){
         console.log("reset")
         if (selectedPoint) {
             var chrData = result.data.filter((ele) => ele.chr === selectedChr)
             var index = chrData.map((ele) => ele.i)
             var selectedIndex = index.indexOf(selectedPoint.toString())
             chrData[selectedIndex].selected = false;
         }
         selectedPoint = null;
         d3.select("#plot-canvas").on("mousedown",null)
         d3.select("#plot-canvas").on("mouseup", null)
        drawManhattan(result)
    })


    


    $("#associationDBs").change(function(){
        associationDB=this.value
        loadData(associationDB).then((processedData) => {
            result = processedData
            drawManhattan(result)
        })

    })



    function generateDetailTable(table, rows,name,pvalue) {
        if (dataTable !== undefined) {
            dataTable.destroy()
        }
        $("#infoTable").empty()
        $(table).empty()
        var headers = rows[0].split(/(\s+)/).filter(function (e) { return e.trim().length > 0; });
        headers.unshift("Summary")
        var columns = []
        for (var i = 0; i < headers.length; i++) {
            columns.push({ "data": headers[i], "title": headers[i] })
        }
        
        rows = rows.slice(1)
        rows = rows.map((row) => {
            if (row.trim().length !== 0) {
                var cells = row.split(/(\s+)/).filter((e) => e.trim().length > 0);
                cells.unshift("")
                var object = {}
                for (var i = 0; i < headers.length; i++) {
                    object[headers[i]] = cells[i]
                }
                return object;
            }

        })
        rows = rows.filter((row) => row !== undefined)
        dataTable = $(table).DataTable({
            data: rows,
            columns: columns,
            columnDefs:[{
                targets: [0,5],
                data: null,
                createdCell: function(td,cellData,rowData,row,col){
                    if (col==0){
                        let content = "<div class='bar-chart-bar'>"
                        let count=1
                        for (let index of ["0_hetero","0_homo","1_hetero","1_homo"]){
                            let value= (parseInt(rowData[index])/1000)*100
                            content += "<div class='bar bar"+count+"' style='width:"+value+"%'></div>"
                            count+=1
                            if (count==3){
                                content += "<div style='clear:both'></div>"
                            }
                        }
                        content+="</div>"
                        $(td).append(content)
                    }else if(col==5){
                        console.log
                        if (rowData["dbSNP"].startsWith("rs")){
                            let content = "<a href=https://www.ncbi.nlm.nih.gov/snp/"+rowData["dbSNP"]+">"+rowData["dbSNP"]+"</a>"
                            $(td).empty()
                            $(td).append(content)
                        }
                    }
                }
            }]
        })
        $(table).append("<caption>GeneName: <a href=https://www.genecards.org/cgi-bin/carddisp.pl?gene="+name+">"+name+"</a>"+" pvalue:"+pvalue+"</caption>")
       
    }


    function median(values){
      if(values.length ===0) return 0;

      values.sort(function(a,b){
        return a-b;
      });

      var half = Math.floor(values.length / 2);
      return values[half];

    }

    function tsvJSON(tsv) {
        const lines = tsv.split('\n');
        const headers = lines.slice(0, 1)[0].split('\t');
        return lines.slice(1, lines.length).map(line => {
            const data = line.split('\t');
            return headers.reduce((obj, nextKey, index) => {
                obj[nextKey] = data[index];
                return obj;
            }, {});
        });
    }


    function loadData(db){
        console.log(projectID,db)
        return new Promise((resolve,reject)=>{
            $.get("http://" + server + "/getPvalue/"+projectID+"/"+db, function (data) {
                    fdata=tsvJSON(data)
                    fdata=fdata.filter((ele)=>ele.chr!=="X" && ele.chr!=="Y" && ele.chr !== undefined)
                    var numberPoints = fdata.length
                    var chrs= Array.from(new Set (fdata.map((ele)=>ele.chr)))
                    var collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
                    chrs=chrs.sort(collator.compare)
                    var offSets={0:{max:0,start:0}}
                    for (let chr of chrs){
                        var filterData=fdata.filter((ele)=>ele.chr===chr).map((ele)=>Number(ele.pos))
                        // console.log(filterData)
                        offSets[chr]={min:Math.min(...filterData),max:Math.max(...filterData),start:offSets[chr-1].start+offSets[chr-1].max,median:median(filterData)}
                    }
                    delete offSets[0]
                    console.log(offSets)
                    var data=fdata.map((ele)=>({x:ele.pos-offSets[ele.chr].min+offSets[ele.chr].start,y:-Math.log10(ele.pvalue),i:ele.id,chr:ele.chr,selected:false,name:ele.name,pvalue:ele.pvalue}))
                    
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
    //  })
    }

    $("#searchGeneButton").click(function () {
        let geneName = $("#searchGene").val()
        let projectID = $("#projectID").val()
        $.get("http://" + server + "/showVariants/" + projectID+"/"+associationDB, { name: geneName, chr: null }, function (searchResult) {
            pvalue = searchResult.pvalue
            data = searchResult.data
            selectedChr = searchResult.chr
            generateDetailTable("#dataTable", data.split("\n"), geneName, pvalue)
            
            var chrData = result.data.filter((ele) => ele.chr === selectedChr)
            let searchGeneIndex = chrData.findIndex(ele => ele.name == geneName)
            console.log(searchGeneIndex)
            chrData[searchGeneIndex].selected = true;
            console.log(chrData[searchGeneIndex])
            selectedPoint = chrData[searchGeneIndex].i
            drawChr_prepare(chrData, result.offSets[selectedChr])
        })
    })

    

        // the canvas is shifted by 1px to prevent any artefacts
        // when the svg axis and the canvas overlap
        
    


    function drawManhattan(result){
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
        var subsetSize=numberPoints/3
        var randomIndex = _.sampleSize(_.range(numberPoints), subsetSize);


        svg.select(".axis").remove();
        svg.select("#chr").remove();

        // ranges, scales, axis, objects
        var xRange = d3.extent(data, function(d) { return d.x });
        var yRange = d3.extent(data, function(d) { return d.y });

        var xScale = d3.scale.linear()
            .domain([xRange[0] - 5, xRange[1] + 5])
            .range([0, width]);

        yScale = d3.scale.linear()
            .domain([0, yRange[1] + 1])
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
            .call(yAxis)
            .append("text")
            .attr("fill", "black")//set the fill here
            // .attr("transform", "translate(120, 40)")
            .text("-log10(pvalue)");

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
        // get the canvas drawing context
        var context = canvas.node().getContext('2d');
        var firstPos;
        
        var zoomToChr=false;
        var radius = 6*6
        var y_scaleUp=10000000
        var mouse;

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
            if (!zoomToChr){
                zoomToChr=true
                mouse = d3.mouse(this);
                
                // map the clicked point to the data space
                var xClicked = xScale.invert(mouse[0]);
                var yClicked = yScale.invert(mouse[1]);
                // find the closest point in the dataset to the clicked point
                var closest = quadTree.find([xClicked, yClicked]);
                selectedChr= closest.chr
                var chrData = data.filter((ele) => ele.chr === selectedChr)

                drawChr_prepare(chrData, offSets[selectedChr])
            }
        }
    }

        function drawChr_prepare(chrData,offSet){
            // chrData.sort((a,b)=>(a.x>b.x)?1:-1)
            d3.select("#plot-canvas").on("click", null)
            console.log("drawChr_prepare ", selectedChr)
            var y_scaleUp=10000000
            var context = canvas.node().getContext('2d');
            var isDown = false;
            var isMoving = false;
            var radius = 6 * 6
            var quadTreeChr = chrData.map((ele)=>({x:ele.x,y:ele.y*y_scaleUp,i:ele.i}))
            console.log(quadTreeChr)
            var chrquadTree = d3.geom.quadtree(quadTreeChr);
            var index=chrData.map((ele)=>ele.i)
            var subsetSize=index.length/10
            var chrrandomIndex = _.sampleSize(index, subsetSize);
            var chr_scale=d3.scale.linear()
                .domain([offSet.start - 5, offSet.start+offSet.max + 5])
                .range([0, width]);

            var chrzoomBehaviour=d3.behavior.zoom()
                .x(chr_scale)
                // .y(yScale)
                .scaleExtent([1, 30])
                .on("zoom", onchrZoom)
                .on("zoomend", onchrZoomEnd)
              
            canvas.call(chrzoomBehaviour)
                .on("dblclick.zoom", null)
            drawChr(index)
            canvas.on("mousedown",onMouseDown)
            canvas.on("mouseup",onMouseUp)
            
            


             function drawChr(index){
                console.log("drawChr called", selectedChr)
                var active;
                clearTimeout(zoomEndTimeout);
                context.clearRect(0, 0, fullWidth, fullHeight);
                context.strokeWidth = 1;
                context.strokeStyle = 'white';
                context.fillStyle=myColor(selectedChr)
                               
                svg.select(".xaxis").remove();
                svg.select("#chr").remove();
                
                
                index.forEach(function(i) {
                    var point = chrData.filter((ele)=>ele.i===i)[0];
           
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
                // console.log("On chr zoom ", chrrandomIndex.length)
                drawChr(chrrandomIndex,selectedChr);
                // drawChr(index,selectedChr);
                // chrxAxisSvg.call(chrxAxis);
                // yAxisSvg.call(yAxis);
            }

            function onchrZoomEnd() {
                // when zooming is stopped, create a delay before
                // redrawing the full plot
                console.log("on chr Zoom End")
                zoomEndTimeout = setTimeout(function() {
                    drawChr(index);
                }, zoomEndDelay);
            }


            document.getElementById("plot-canvas").addEventListener("mousemove", function (e) {
                // console.log("mousemove")
                if (!isDown) return; // we will only act if mouse button is down

                var pos = { x: e.clientX, y: e.clientY }
                // calculate distance from click point to current point

                var dx = firstPos.x - pos.x;
                var dy = firstPos.y - pos.y;
                var dist = dx * dx + dy * dy;        // skip square-root (see above)
                // console.log(firstPos,pos,dx,dy,dist)
                if (dist >= radius) isMoving = true; // 10-4 we're on the move


            })


            function onMouseDown(){
                console.log("MouseDown click")
                mouse = d3.mouse(this);
                firstPos = {x:mouse[0],y:mouse[1]};
                isDown = true;
                isMoving = false;

            }

            function onMouseUp() {
                console.log("onMouseUp called")
                console.log("isMoving ",isMoving)
                // var mouse = d3.mouse(this);
                // map the clicked point to the data space
                isDown=false
                if (!isMoving){
                    mouse = d3.mouse(this);
                    var xClicked = chr_scale.invert(mouse[0]);
                    var yClicked = yScale.invert(mouse[1])*y_scaleUp;
                    var closest = chrquadTree.find([xClicked, yClicked]);

                    var dX = chr_scale(closest.x);
                    var dY = yScale(closest.y/y_scaleUp);
                    console.log(mouse[0],mouse[1], xClicked,yClicked,closest.x,closest.y,dX,dY)

                    // register the click if the clicked point is in the radius of the point
                    var distance = euclideanDistance(mouse[0], mouse[1], dX, dY);
                    console.log(distance,pointRadius)
                    // if(distance < pointRadius) {
                    console.log("old selected point", selectedPoint)
                    if(selectedPoint) {
                        var selectedIndex=index.indexOf(selectedPoint.toString())
                        chrData[selectedIndex].selected = false;
                    }
                    // closest.selected = true;
                    selectedPoint = closest.i;
                    var selectedIndex=index.indexOf(selectedPoint.toString())
                    chrData[selectedIndex].selected = true;
                    // redraw the points
                    console.log("new selected point", selectedPoint, selectedChr)
                    drawChr(index)
                    // }
                    console.log(closest)
                    $("#plotNGCHM").hide();
                    // let reorder=$("#reorder").prop("checked")
                    // console.log(reorder)
                    let reorder=$("#selectReorder").val()
                    let chr=chrData[selectedIndex].chr
                    let name=chrData[selectedIndex].name
                    let pvalue = chrData[selectedIndex].pvalue
                    let projectID = $("#projectID").val()
                    $("#searchGene").val(name)
                    if (reorder=="Detail"){
                        $.get("http://"+server+"/showVariants/"+projectID+"/"+associationDB,{name:name,chr:chr},function(result){
                            generateDetailTable("#dataTable", result.data.split("\n"),name,pvalue)
                        })
                    }else{
                        $.get("http://"+server+"/showNGCHM/"+projectID,{name:name,chr:chr,reorder:reorder},function(data){
                            $("#plotNGCHM").show();
                            let heatmapName="chr"+chr+"_"+name
                            
                            heatmapName = heatmapName + "_"+reorder
                            var ajaxUrl="http://"+server+"/ngchmView/"+projectID+"/"+heatmapName
                            console.log(ajaxUrl)
                            
                            var xmlhttp=new XMLHttpRequest();
                            xmlhttp.open("GET", ajaxUrl, true);
                            xmlhttp.responseType = 'blob';
                            xmlhttp.onload = function(e) {
                                if (this.status == 200) {
                                    var blob = new Blob([this.response], {type: 'compress/zip'});
                                    NgChm.UTIL.displayFileModeCHM(blob)
                                    document.getElementById("container").addEventListener('wheel', NgChm.SEL.handleScroll, false);
                                    document.getElementById("detail_canvas").focus();
                                }
                            };
                            isMoving=false
                            xmlhttp.send()
                        })
                    }
                }
            
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
		
})

