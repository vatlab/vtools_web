var server;
var dataTable;
var logs=[];
var projectID;
var fieldMap={};

$(document).ready(function(){
    server=env.server+"/vtoolsweb/"
    // server=env.server+":8082"
	console.log(server)

    $("#createRandomProject").click(function(){
        createProject();
    })

    // $("#dataUploadExternal").submit(function(e){
    //     e.preventDefault();
    //     var formData= new FormData()
    //     var fileName = $('#uploadExternalFile')[0].files[0].name;
    //     $("#externalFile").val(fileName);
    //     formData.append('datafile',$('#uploadExternalFile')[0].files[0])
    //     $.ajax({
    //         url:"http://"+server+"/data/"+projectID,
    //         data:formData,
    //         type:'POST',
    //         contentType:false,
    //         processData:false, 
    //         success:function(data){
    //             // addOption("existingSourceName",["",fileName])
    //             $(".existingSourceNameClass").each((idx,obj)=>{
    //               addOption(obj.id,["",fileName])
    //             })
    //         }
    //     });

    // })


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
                // addOption("existingSourceName",["",fileName])
                $(".existingSourceNameClass").each((idx,obj)=>{
                  addOption(obj.id,["",fileName])
                })

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
        vtoolsOutput();
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

    $('#existingSourceNameUpdate').change(function() {
        getFileInfo(this.value)
    });


    $('#showProjectOptions').change(function(){
        vtoolsShow(this.value,true);
    });

    $('#showVtoolsOptions').change(function(){
        vtoolsShow(this.value,true);
    });

    $("#showAssociation").click(function(){
        $.get("http://"+server+"/associationResult/"+projectID,function(data){
            var rows=data.split("\n")
            generateDataTable("#dataTable",rows)
            $("#runAssociation").show()
            $("#showAssociation").hide()
        })

    })

    $("#addToCondition").click(function(){
        console.log($("#selectCondition").val())
        var condition=$("#selectCondition").val()+" "+$("#thirdSelection").val()+$("#fourthSelection").val()+$("#selectionInput").val()
        if ($("#selectionFields").val()==="Annotation_databases"){
            condition=$("#selectCondition").val()+" "+$("#secondSelection").val()+"."+$("#thirdSelection").val()+"_"+$("#fourthSelection").val()+$("#selectionInput").val()
        }
        $("#selectCondition").val(condition)
        $("#newTable").val($("#secondSelection").val()+"-"+$("#thirdSelection").val()+"-"+$("#fourthSelection").val()+"-"+$("#selectionInput").val())
    })  




    $("#selectRemoveOptions").change(function(){
        vtoolsRemove();
    })

    $("#selectButton").click(function(){
        vtoolsSelect();
    })

    $("#updateButton").click(function(){
        vtoolsUpdate();
    })

    $("#updateCheckbox").click(function(){
        $("#div_fromStat").toggle()
        $("#div_fromFile").toggle()
    })


    $('legend.togvis').click(function() {
        var $this = $(this);
        var parent = $this.parent();
        var contents = parent.contents().not(this);
        if (contents.length > 0) {
            $this.data("contents", contents.remove());
        } else {
            $this.data("contents").appendTo(parent);
        }
        return false;
    });

    

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


function vtoolsSelect(){
    $.post("http://"+server+"/select",{"condition":$("#selectCondition").val(),"tableName":$("#newTable").val()},function(result){
        console.log(result)
        vtoolsShow("fields",false)
        vtoolsShow("tables",true)
        vtoolsShow("show",false)
        
    }).fail(function(xhr,status,error){
        alert(error)
    })
}


function vtoolsUpdate(){

    if ($("#updateCheckbox").is(":checked")){
        console.log($("#updateStates").val().join(" "))
        $.post("http://"+server+"/update",{
            "table":$("#updateTables").val(),
            "stat":$("#updateStates").val().join(" "),
            "method":"fromStat"
        },function(result){
            vtoolsShow("show",false)
            vtoolsShow("fields",false)
        }).fail(function(xhr,status,error){
            alert(error)
        })
    }else{
        var selectedGeno=""
        var selectedVar=""
        if ($("#updateGenoInfo").val()!==undefined){
            selectedGeno=$("#updateGenoInfo").val().join(",")
        }
        if ($("updateVarInfo").val()!==undefined){
            selectedVar=$("#updateVarInfo").val().join(",")
        }

        $.post("http://"+server+"/update",{
            "table":$("#updateTables").val(),
            "fileName":$("#existingSourceNameUpdate").val(),
            "selectedGeno":selectedGeno,
            "selectedVar":selectedVar,
            "method":"fromFile"
        },function(result){
            vtoolsShow("show",false)
            vtoolsShow("fields",false)
        }).fail(function(xhr,status,error){
            alert(error)
        })
    }

}

function getProject(){
    projectID=$("#projectID").val()
    $.get("http://"+server+"/project/"+projectID,function(fileName){
        $(".existingSourceNameClass").each((idx,obj)=>{
          addOption(obj.id,["",fileName])
        })

        vtoolsShow("fields",false)
        vtoolsShow("annotations -v0",false)
        vtoolsShow("tests",false)
        vtoolsShow("tables",false)
        vtoolsShow("show",true)
        
        $('#addPhenotype').show();
        vtoolsShow("phenotypes",false)
        $("#runAssociation").show()
        
        document.getElementById("defaultOpen").click();
        $("#showError").hide()


        $.get("http://"+server+"/logs/"+projectID,function(logstring){
            $('#dataDetail').show()
            logs=logstring.split("\n").filter((log)=>log!=="")
            console.log(logs)
            var i;
            var outputLog="";
            for (i=0;i<logs.length;i++){
                  var ii=i+1
                  outputLog+=ii+"."+logs[i]+"\n"
                  if (logs[i].includes("vtools associate")){
                    $("#showAssociation").show()
                  }
            }
                $("#logsText").val(outputLog)
            })
        
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

    $.post("http://"+server+"/logs/"+projectID,{
        "log":log
    }).done(function(result){
        console.log("log saved.")
    }).fail(function(xhr,status,error){
        alert(error)
    })
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


function getFileInfo(fileName){

    $.get("http://"+server+"/fileInfo/"+projectID,{"fileName":fileName}).done(function(result){
        if (result["genoFields"].length>0){
            $("#div_genoInfo").show()
            addOption("updateGenoInfo",result["genoFields"])
        }else{
            $("#div_genoInfo").hide()
        }
        if (result["varFields"].length>0){
            $("#div_varInfo").show()
            addOption("updateVarInfo",result["varFields"])
        }else{
            $("#div_varInfo").hide()
        }
    })


}



function loadSampleData(){
    var fileName="10k_test_2k.vcf"
    $("#localFileName").val(fileName);
    
    $('#dataSources').show();
    $('#addPhenotype').show();
    $(".existingSourceNameClass").each((idx,obj)=>{
      addOption(obj.id,["",fileName])
  
    })
    $.get("http://"+server+"/loadSampleData/"+projectID,{"fileType":"data"}).done(function(message){
        console.log(message)
    })


}


function loadSamplePhenotype(){
    var fileName="simulated.tsv"
    $("#localPhenoFileName").val(fileName)
    $.get("http://"+server+"/loadSampleData/"+projectID,{"fileType":"pheno"}).done(function(message){
        console.log(message)
    })
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
            
            $("#importProgress").text(data)
            
            if (data.includes("Importing genotypes: 100%")){
                $('#dataDetail').show()
                vtoolsShow("annotations -v0",false)
                vtoolsShow("tests",false)
                vtoolsShow("tables",true)
                vtoolsShow("fields",false)
                vtoolsShow("show",false)
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




function vtoolsOutput(){
    // $.get("http://localhost:5000/output",{
    let outputTableFields=""
    let outputAnnoFields=""
    if ($("#outputTableFields").val()!==null){
        outputTableFields=$("#outputTableFields").val().join(" ")
    }
    if ($("#outputAnnoFields").val()!==null){
        outputAnnoFields=$("#outputAnnoFields").val().join(" ")
    }
    $.get("http://"+server+"/output",{
            "outputTable":$("#outputTables").val(),
            "outputTableFields":outputTableFields,
            // "outputAnno":$("#outputAnnos").val(),
            "outputAnnoFields":outputAnnoFields,
    }).done(function(data){
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


function populateDropDownOutput(info){

    $("#outputTables").change(function(){
        vals=fieldMap[this.value]
        $("#outputTableFields").empty()
        $.each(vals,(index,value)=>{
            var field=value.split("(")[0].replace(/^\s+|\s+$/g, '')
            $("#outputTableFields").append("<option>"+field+"</option>")  
        })
    })


    $("#outputAnnoFields").empty()
    info["Annotation_databases"].forEach((key)=>{        
        vals=fieldMap[key]
        $.each(vals,(index,value)=>{
            var field=value.split("(")[0].replace(/^\s+|\s+$/g, '')
            $("#outputAnnoFields").append("<option>"+key+"."+field+"</option>")  
        })

    })



}


function populateDropDownSelect(info){
    $("#selectionFields").prop('selectedIndex',0);
    $("#secondSelection").hide()
    $("#thirdSelection").hide()
    $("#fourthSelection").hide()
    $("#selectionInput").hide()
    $("#addToCondition").hide()
    $("#selectCondition").val("")
    $("#newTable").val("")

    // $("#selectionTables").empty()
    // $.each(info["Variant_tables"],(index,value)=>{
    //     $("#selectionTables").append("<option value="+value+">"+value+"</option>")
    // })
    // $("#selectionTables").append("<option selected value='Please select'>Please select</option>");
    // $("#selectionTables").change(function(){
    //     $("#selectCondition").val(this.value)
    // })


    $(".existingTables").each((id,object)=>{
        console.log(object.id)
        $("#"+object.id).empty()
        $.each(info["Variant_tables"],(index,value)=>{
            $("#"+object.id).append("<option value="+value+">"+value+"</option>")
        })
        $("#"+object.id).append("<option selected value='Please select'>Please select</option>");
        $("#selectionTables").change(function(){
            $("#selectCondition").val(this.value)
        })
    })


    $("#selectionFields").change(function(){
        var key=this.value
        var vals=[]

        switch(key) {
            case "Variant_tables":
                vals=info["Variant_tables"]
                break;
            case "Annotation_databases":
                vals=info["Annotation_databases"]
                break;
        }
        
        $("#secondSelection").empty()
        $("#thirdSelection").empty()
        $("#fourthSelection").empty()
        $("#secondSelection").hide()
        $("#thirdSelection").hide()
        $("#fourthSelection").hide()
        $("#selectionInput").hide()
        
        $.each(vals,(index,value)=>{
           $("#secondSelection").append("<option value="+value+">"+value+"</option>");
        })
        $("#secondSelection").append("<option selected value='Please select'>Please select</option>");
        $("#secondSelection").show()
        $("#secondSelection").change(function(){
            

     
            vals=fieldMap[this.value]
            $("#thirdSelection").empty()
            var typeMap={}
            $.each(vals,(index,value)=>{
                var field=value.split("(")[0].replace(/^\s+|\s+$/g, '')
                var fieldType=value.split("(")[1]
                typeMap[field]=fieldType
                $("#thirdSelection").append("<option>"+field+"</option>")  
            })
            $("#thirdSelection").show()
            $("#thirdSelection").append("<option selected value='Please select'>Please select</option>");
            $("#thirdSelection").change(function(){
               
                $("#fourthSelection").empty()
                $("#fourthSelection").hide()
                $("#selectionInput").hide()

                if (typeMap[this.value]==="char"){
                    $.each(["IS_NOT_NULL","IS_NULL","="],(index,value)=>{
                        $("#fourthSelection").append("<option>"+value+"</option>")
                    })
                }else if (typeMap[this.value]==="int"){
                    $.each([">","<","="],(index,value)=>{
                        $("#fourthSelection").append("<option>"+value+"</option>")
                    })

                }
                
                $("#fourthSelection").show()
                $("#fourthSelection").append("<option selected value='Please select'>Please select</option>");
                $("#fourthSelection").change(function(){
                    $("#selectionInput").show()
                    $("#addToCondition").show()

                })

            })
            
        })
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
                var fields=rows.map((row)=>row.split(")")[0]).filter( function(e) { return (e.includes("("));} )
             
                fields.forEach((field)=>{
                  
                    var cols=field.split(".")
                    if (!(cols[0] in fieldMap)){
                        fieldMap[cols[0]]=[cols[1]]
                    }else{
                        if (!(fieldMap[cols[0]].includes(cols[1]))){
                            fieldMap[cols[0]].push(cols[1])
                        }
                    }
            
                })
             
                // addOption("fields",fields)
                break;

            case "show":
                info={}


                onTable=false
                onDatabases=false
                rows.forEach((row)=>{
                    cols=row.split(":")
                    if (row.includes(":") && cols[0]!=="Variant tables" && cols[0]!=="Annotation databases"){
                        info[cols[0]]=row.replace(cols[0]+":","").replace(/^\s+|\s+$/g, '')
                    }else if (cols[0]==="Variant tables"){
                        info["Variant_tables"]=[row.replace(cols[0]+":","").replace(/^\s+|\s+$/g, '')]
                        onTable=true
                        onDatabases=false

                    }else if (cols[0]==="Annotation databases"){
                        info["Annotation_databases"]=[row.replace(cols[0]+":","").split("(")[0].replace(/^\s+|\s+$/g, '')]
                        onTable=false
                        onDatabases=true
                    }else if (! row.includes(":")){
                        if (onTable){
                            info["Variant_tables"].push(row.replace(/^\s+|\s+$/g, ''))
                        }else if (onDatabases){
                            database=row.split("(")[0].replace(/^\s+|\s+$/g, '')
                            if (database!==""){
                                info["Annotation_databases"].push(database)
                            }
                        }
                    }
                })
                if ("Annotation_databases" in info && info["Annotation_databases"].length!==0){
                    annoText=info["Annotation_databases"].join(",")
                    $("#useFinished").text(annoText+" imported")  
                }
                console.log(info)
                populateDropDownSelect(info)
                populateDropDownOutput(info)
                break;

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
        
        vtoolsShow("show",false)
        vtoolsShow("fields",false)

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
            // if (data.includes("Testing for association")){
            $("#associateProgress").text(data)
            // }
            if (data.includes("Testing for association: 100%")){
                
                console.log("association done")
                $.get("http://"+server+"/associationResult/"+projectID,function(data){
                    if (data!=="Association result is not available."){
                        var rows=data.split("\n")
                        generateDataTable("#dataTable",rows)
                        $("#runAssociation").show()
                    }
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



