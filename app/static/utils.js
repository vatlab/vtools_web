var server;
var dataTable;
var logs=[];
var projectID;

$(document).ready(function(){
    server=env.server+"/vtoolsweb/"
	console.log(server)

    $("#createRandomProject").click(function(){
        createProject();
    })

    $("#dataUpload").submit(function(e){
        e.preventDefault();
        var formData= new FormData()
        var fileName = $('#uploadData')[0].files[0].name;
        $("#localFileName").val(fileName);
        formData.append('datafile',$('#uploadData')[0].files[0])
        $.ajax({
            url:"http://"+server+"/data/"+projectID,
            data:formData,
            type:'POST',
            contentType:false,
            processData:false, 
            success:function(data){
                console.log("sucess")
                addOption("existingSourceName",["",fileName])
                $('#dataSources').show();
                $('#addPhenotype').show();  
            },
         
        });

    })

    $("#phenoUpload").submit(function(e){
        e.preventDefault();
        var formData= new FormData()
        formData.append('phenofile',$('#uploadPheno')[0].files[0])
        var fileName = $('#uploadPheno')[0].files[0].name;
        $("#localPhenoFileName").val(fileName);
        $.ajax({
            url:"http://"+server+"/phenotype/"+projectID,
            data:formData,
            type:'POST',
            contentType:false,
            processData:false, 
            success:function(data){
                console.log("sucess")
                    
            },
         
        });

    })

    $("#getProjectButton").click(function(){
        getProject()
    })

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
        vtoolsShow(this.value,true);
    });

    $('#showVtoolsOptions').change(function(){
        vtoolsShow(this.value,true);
    });




    $("#selectRemoveOptions").change(function(){
        vtoolsRemove();
    })


})

function createProject(){
    $.post("http://"+server+"/project",function(result){
        $("#localFileSource").show()
        projectID=result
        console.log(projectID)
        $("#projectName").text(projectID)
    }).fail(function(xhr,status,error){
        alert(error)
    })

}

function getProject(){
    projectID=$("#projectID").val()
    $.get("http://"+server+"/project/"+projectID,function(result){
        $('#dataDetail').show()
        vtoolsShow("annotations -v0",false)
        vtoolsShow("tests",false)
        vtoolsShow("tables",false)
        vtoolsShow("fields",false)
        vtoolsShow("show",true)
        
        $('#addPhenotype').show();
        vtoolsShow("phenotypes",false)
        $("#runAssociation").show()
        
        document.getElementById("defaultOpen").click();
        $("#showError").hide()
        
    }).fail(function(xhr,status,error){
        alert(error)
    })
}


function vtoolsRemove(){
   var removeOption=$("#selectRemoveOptions").val()
   console.log(removeOption)
   $('#vtoolsRemove div').css('display', 'none');
   switch (removeOption){
    case "Fields":
        $("#divRemoveFields").show()
        break;
    case "Genotypes":
        $("#divRemoveGenotype").show()
        break;
    case "Phenotypes":
        $("#divRemovePhenotype").show()
        break;
    case "Variants":
        $("#divRemoveVariants").show()
        break;
    case "Samples":
        $("#divRemoveSamples").show()
        break;
    case "Annotations":
        $("#divRemoveAnnotation").show()
        break;
   }
}


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


function addOption(id,contents){

    contents.forEach((content)=>{
        var dropdown = document.getElementById(id);
        var optn = document.createElement("option");
        optn.text = content;
        optn.value = content;
        dropdown.options.add(optn);
    })

    // var dropdown = document.getElementById(id);
    // var optn = document.createElement("option");
    // optn.text = content;
    // optn.value = content;
    // dropdown.options.add(optn);
}




function loadSampleData(){
    var fileName="1000_test_2k.vcf"
    $("#localFileName").val(fileName);
    addOption("existingSourceName",["",fileName])
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


function checkImportProgress(){
    $.get("http://"+server+"/check/import/"+projectID,function(data){
            console.log(data)
            if (data.includes("Importing")){
                $("#importProgress").text(data)
            }
            if (data.includes("Importing genotypes: 100%")){
                $('#dataDetail').show()
                vtoolsShow("annotations -v0",false)
                vtoolsShow("tests",false)
                vtoolsShow("tables",true)
                vtoolsShow("fields",false)
                document.getElementById("defaultOpen").click();
                $("#showError").hide()

            }else{
                setTimeout(checkImportProgress,2000)
            }
        })
}


function importFile(){
    var fileName=$("#existingSourceName").val()
    var genomeVersion=$("#genomeVersion").val()
    if (fileName==="" || genomeVersion===""){
        alert("Please select a file name from dropdown list for importing.")
        return
    }
    addToLog("vtools import "+fileName+" --build "+genomeVersion)
    $.get("http://"+server+"/import/"+projectID,{
    // $.get("http://localhost:5000/import",{
        fileName:fileName,genomeVersion:genomeVersion
    }).done( function(data){
        console.log(data)
        setTimeout(checkImportProgress,2000)         
    }).fail(function(xhr,status,error){
        alert(error)
    })
}




function outputData(){
    // $.get("http://localhost:5000/output",{
    $.get("http://"+server+"/output",{
    })
    .done(function(data){
        var rows=data.split("\n")
        generateDataTable("#dataTable",rows)
    })
    .fail(function(xhr,status,error){
        alert(error)
    })  
}





function generateDataTable(table,rows){
    if (dataTable !== undefined){
        dataTable.destroy()
    }
    $("#infoTable").empty()
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

function generateInfoTable(table,rows){
    $('#dataTable').parents('div.dataTables_wrapper').first().hide();
    $(table).empty()
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

function vtoolsShow(option,display){
    
    // $.get("http://localhost:5000/show",{option:option
    $.get("http://"+server+"/show",{option:option
    }).done(function(data){
        var rows=data.split("\n")
        switch(option){
            case "genotypes":
                rows=rows.filter((line)=>!line.includes("omitted"))
                if (display){
                    generateDataTable("#dataTable",rows)
                }
                break;
            case "samples":
                if(display){
                    generateDataTable("#dataTable",rows)
                }
                break;
            case "annotations -v0":
                var uniqAnnotations=Array.from(new Set(rows.map((row)=>row.split("-")[0])))

                addOption("annotationOptions",uniqAnnotations)
                $("#annotationOptions").val("refGene");
                $("#dataAnnotation").show()
                break;

            case "tables":
                var tables=rows.slice(1).map((row)=>row.split(/(\s+)/)[0]).filter( function(e) { return e.trim().length > 0; } )
                addOption("projectTables",tables)
                if(display){
                    generateInfoTable('#infoTable',rows)
                }
                break;
            
            case "phenotypes":  
                var phenotypes=rows[0].split(/(\s+)/)
                phenotypes=phenotypes.filter((phenotype)=>phenotype.trim().length>0).slice(2)
                addOption("projectPhenotypes",phenotypes)
                if (display){
                    generateDataTable("#dataTable",rows)
                }
                break;

            case "tests":
                var methods=rows.map((row)=>row.split(/(\s+)/)[0]).filter( function(e) { return e.trim().length > 0; } )
                addOption("associateMethods",methods)
                break;

            case "fields":
                var fields=rows.map((row)=>row.split(/(\s+)/)[0]).filter( function(e) { return e.trim().length > 0; } )
                addOption("fields",fields)
                break;

            case "show":
                info={}
                rows.forEach((row)=>{
                    cols=row.split(":")
                    if(row===cols[0] && row!=="" && ! row.includes("test")){
                        info["Annotation databases"].push(row.replace(/^\s+|\s+$/g, ''))
                    }else{
                        info[cols[0]]=[row.replace(cols[0]+":","").replace(/^\s+|\s+$/g, '')]
                    }
                    
                })
                if ("Annotation databases" in info){
                    annoText=info["Annotation databases"].map((anno)=>anno.split("(")[0]).join(",")
                    $("#useFinished").text(annoText+" imported")  
                }
                console.log(info) 

            default:
                if(display){
                    generateInfoTable('#infoTable',rows)
                }
        }
    }).fail(function(xhr,status,error){
        alert(error)
    })
}

function vtoolsUse(){
    var option=$("#annotationOptions").val();
    // $.post("http://localhost:5000/use",{
    addToLog("vtools use "+option)
    $.post("http://"+server+"/use",{
        option:option
    }).done(function(result){
        console.log(option+ "imported")
        
        $("#useFinished").text(option+" imported")

    }).fail(function(xhr,status,error){
        alert(error)
    })
}


function addPhenotype(){
    var fileName=$("#localPhenoFileName").val()
    console.log(fileName)
    $.ajax({
        url: "http://"+server+"/phenotype/"+projectID,
        type:"PUT",
        data:fileName,
        success:function(data){
             $("#phenotypeAdded").text(fileName+" added")
            vtoolsShow("phenotypes",true)
            addToLog("vtools phenotype --from_file "+fileName)
            $("#runAssociation").show()
        },
        error:function(XMLHttpRequest, textStatus, errorThrown) {
            alert(errorThrown);
        }
      }); 
}


function checkAssociateProgress(){
    $.get("http://"+server+"/check/associate/"+projectID,function(data){
            console.log(data)
            if (data.includes("Testing for association")){
                $("#associateProgress").text(data)
            }
            if (data.includes("Testing for association: 100%")){
                
                console.log("association done")
                $.get("http://"+server+"/associationResult/"+projectID,function(data){
                    console.log(data)
                    var rows=data.split("\n")
                    generateDataTable("#dataTable",rows)
                    $("#runAssociation").show()
                })
            }else{
                setTimeout(checkAssociateProgress,2000)
            }
        })
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
    $.post("http://"+server+"/runAssociation/"+projectID,{
    // $.post("http://localhost:5000/runAssociation",{
        table:table,phenotype:phenotype,method:method,discard:discard,groupby:groupby
    }).done(function(data){
        addToLog("vtools associate "+table+" "+phenotype+" --method "+method+" --group_by "+groupby)
        setTimeout(checkAssociateProgress,2000)  

        
        
    }).fail(function(xhr,status,error){
        alert(error)
        $("#runAssociation").show()
    })

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
