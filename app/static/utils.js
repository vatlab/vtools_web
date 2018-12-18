var server;
var dataTable;
var logs=[];

$(document).ready(function(){
    server=env.server+"/vtoolsweb/"
	console.log(server)

    $("#importButton").click(function(){
        importFile();
    });

    $("#useButton").click(function(){
        vtoolsUse();
    });

    $("#runAssociation").click(function(){
        runAssociation();
    });

    $("#outputButton").click(function(){
        outputData();
    });

    $("#sampleData").click(function(){
        loadSampleData();
    });

    $("#samplePhenotype").click(function(){
        loadSamplePhenotype();
    });

    $("#addPhenotypeButton").click(function(){
        addPhenotype();
    })

    $('#existingSourceName').change(function() {
        selectDataSource(this.value);
    });

    $('#showProjectOptions').change(function(){
        vtoolsShow(this.value);
    });

    $('#showVtoolsOptions').change(function(){
        vtoolsShow(this.value);
    });

    $("#uploadData").change(function(){
        uploadData();
    })

    $("#uploadPheno").change(function(){
        uploadPheno();
    })



})


function addToLog(log){
    logs.push(log)
    var i;
    var outputLog="";
    for (i=0;i<logs.length;i++){
          var ii=i+1
          outputLog+=ii+"."+logs[i]+"\n"
    }
    $("#logsText").val(outputLog)
}


function addOption(id,content){
    var dropdown = document.getElementById(id);
    var optn = document.createElement("option");
    optn.text = content;
    optn.value = content;
    dropdown.options.add(optn);
}


function uploadData(){
    var fileName = $('#uploadData')[0].files[0].name;
    $("#localFileName").val(fileName);
    addOption("existingSourceName"," ")
    addOption("existingSourceName",fileName)
    $('#dataSources').show();
    $('#addPhenotype').show();  
}

function uploadPheno(){
    var fileName = $('#uploadPheno')[0].files[0].name;
    $("#localPhenoFileName").val(fileName);
}

function loadSampleData(){
    var fileName="1000_test_2k.vcf"
    $("#localFileName").val(fileName);
    addOption("existingSourceName"," ")
    addOption("existingSourceName",fileName)
    $('#dataSources').show();
    $('#addPhenotype').show();

}


function loadSamplePhenotype(){
    var fileName="simulated.tsv"
    $("#localPhenoFileName").val(fileName)
}



function selectDataSource(fileName){
    console.log(fileName)
    if (fileName.slice(-3)==="vcf"){
        $('#importData').show()
        $('#selectedFileName').text("Import "+fileName)
    }else if (fileName.slice(-3)==="tsv"){
        $('#addPhenotype').show()
       
    }
}





function importFile(){
    var fileName=$("#existingSourceName").val()
    var genomeVersion=$("#genomeVersion").val()
    addToLog("vtools import "+fileName+" --build "+genomeVersion)
    
    $.get("http://"+server+"/import",{
    // $.get("http://localhost:5000/import",{
        fileName:fileName,genomeVersion:genomeVersion
    }, function(data){
        console.log(data)
        $('#dataDetail').show()
        vtoolsShow("annotations -v0")
        vtoolsShow("tests")
        document.getElementById("defaultOpen").click();
        vtoolsShow("tables")


    })
}




function outputData(){
    // $.get("http://localhost:5000/output",{
    $.get("http://"+server+"/output",{
    }, function(data){
        var rows=data.split("\n")
        generateDataTable("#dataTable",rows)
    })  
}





function generateDataTable(table,rows){
    if (dataTable !== undefined){
        dataTable.destroy()
    }
    $(table).empty()
    var headers=rows[0].split(/(\s+)/).filter( function(e) { return e.trim().length > 0; } );
    var columns=[]
    for(var i =0; i < headers.length; i++){
        columns.push({"data":headers[i],"title":headers[i]})
    }
  
    rows=rows.slice(1)
    rows=rows.map((row)=>{
        if (row.trim().length!==0){
            var cells=row.split(/(\s+)/).filter( (e)=> e.trim().length > 0);
            var object={}
            for(var i =0; i < headers.length; i++){
                object[headers[i]]=cells[i]
            }
            return object;
        }

    })
    rows=rows.filter((row)=>row!==undefined) 
    // console.log(rows)
    // console.log(columns)
    dataTable=$(table).DataTable({
        data:rows,
        columns:columns
    })
}



function addRowToTable(table,rows){
        
    $(table).empty()
    $(table).append("<tbody>")
    rows.forEach((row)=>{
        cells=row.split(/(\s+)/).filter( function(e) { return e.trim().length > 0; } );
        var row="<tr>"
        for(var i =0; i < cells.length; i++){
            row+="<td>"+cells[i]+"</td>"
        }
        row+="</tr>"
        $(table).append(row)
    })
    $(table).append("</tbody>")

}

function addRowToTableTab(table,rows){
    $('#dataTable').empty()
    rows.forEach((row)=>{
        cells=row.split(/(\t)/).filter( function(e) { return e.trim().length > 0; } );
        var row="<tr>"
        for(var i =0; i < cells.length; i++){
            row+="<td>"+cells[i]+"</td>"
        }
        row+="</tr>"
        $(table).append(row)
    })

}

function vtoolsShow(option){
    
    // $.get("http://localhost:5000/show",{option:option
    $.get("http://"+server+"/show",{option:option
    }, function(data){
        var rows=data.split("\n")
        if (option==="genotypes" || option==="samples"){
            generateDataTable("#dataTable",rows)
        }else if (option==="annotations -v0"){
            var uniqAnnotations=Array.from(new Set(rows.map((row)=>row.split("-")[0])))
            uniqAnnotations.forEach((uniqAnnotation)=>{
                addOption("annotationOptions",uniqAnnotation)
            })
            $("#annotationOptions").val("refGene");
            $("#dataAnnotation").show()
        }else{
            
            if (option==="tables"){
                addRowToTableTab('#dataTable',rows)
                var tables=rows.slice(1).map((row)=>row.split(/(\s+)/)[0]).filter( function(e) { return e.trim().length > 0; } )
                console.log(tables)
                tables.forEach((table)=>{
                    addOption("projectTables",table)
                })
            }else if (option==="phenotypes"){     
                var phenotypes=rows[0].split(/(\s+)/)
                phenotypes=phenotypes.filter((phenotype)=>phenotype.trim().length>0).slice(2)
                phenotypes.forEach((phenotype)=>{
                    addOption("projectPhenotypes",phenotype)
                })

                

                generateDataTable("#dataTable",rows)
            }else if (option==="tests"){
                // addRowToTableTab('#dataTable',rows)
                var methods=rows.map((row)=>row.split(/(\s+)/)[0]).filter( function(e) { return e.trim().length > 0; } )
                
                methods.forEach((method)=>{
                    addOption("associateMethods",method)
                })

            }

        }
    })
}

function vtoolsUse(){
    var option=$("#annotationOptions").val();
    // $.post("http://localhost:5000/use",{
    addToLog("vtools use "+option)
    $.post("http://"+server+"/use",{
        option:option
    },function(result){
        console.log(option+ "imported")
        
        $("#useFinished").text(option+" imported")

    })
}


function addPhenotype(){
    var fileName=$("#localPhenoFileName").val()
    console.log(fileName)
    $.ajax({
        url: "http://"+server+"/phenotype",
        type:"PUT",
        data:fileName,
        success:function(data){
             $("#phenotypeAdded").text(fileName+" added")
            vtoolsShow("phenotypes")
            addToLog("vtools phenotype --from_file "+fileName)
            $("#runAssociation").show()

        }
    });  
}

function openTab(evt, tabName) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the link that opened the tab
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

function runAssociation(){
    var table=$("#projectTables option:selected").text()
    var phenotype=$("#projectPhenotypes option:selected").text()
    var method=$("#associateMethods option:selected").text()
    var discard=$("#discardVariants").val()
    var groupby=$("#annotationOptions option:selected").text()
    if (groupby==="refGene"){
        groupby="refGene.name2"
    }
    console.log(table,phenotype,method,discard,groupby)
    $("#runAssociation").hide()
    $.post("http://"+server+"/runAssociation",{
    // $.post("http://localhost:5000/runAssociation",{
        table:table,phenotype:phenotype,method:method,discard:discard,groupby:groupby
    },function(data){
        addToLog("vtools associate "+table+" "+phenotype+" --method "+method+" --group_by "+groupby)
        var rows=data.split("\n")
        generateDataTable("#dataTable",rows)
        $("#runAssociation").show()
        
    })


}
