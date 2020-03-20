var server;
var dataTable;
var logs=[];
var projectID;
var fieldMap={};


$(document).ready(function(){
    server=env.server
    $("#createRandomProject").click(function(){
        console.log(server)
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
                console.log("Upload success")
                addOption("existingSourceName", ["", fileName])
                addOption("existingSourceNameUpdate", ["", fileName])
                $('#dataSources').show();
            },
         
        });



    })

    


    // $("#phenoUpload").submit(function(e){
    //     e.preventDefault();
    //     var formData= new FormData()
    //     formData.append('datafile', $('#uploadPhenotype')[0].files[0])
    //     var fileName = $('#uploadPhenotype')[0].files[0].name;
    //     $("#localPhenoFileName").val(fileName);
    //     $.ajax({
    //         url:"http://"+server+"/phenotype/"+projectID,
    //         data:formData,
    //         type:'POST',
    //         contentType:false,
    //         processData:false, 
           
    //         success: function(data) {
    //             $("#phenotypeAdded").text(fileName + " added")
    //             vtoolsShow("phenotypes", true)
    //             addToLog("vtools phenotype --from_file " + fileName)
    //             $("#runAssociation").show()
    //         },
    //         error: function(XMLHttpRequest, textStatus, errorThrown) {
    //             alert(errorThrown);
    //         }     
    //     });
    // })

    $("#addPhenotypeButton").click(function(){
        addPhenotype()
    })

    $("#getProjectButton").click(function(){
        getProject()
    })

    $("#importButton").click(function(){
        importFile();
    });

    $("#useButton").click(function(){
        var option = $("#annotationOptions").val();
        vtoolsUse(option).then((message)=>console.log(message));
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

    // $("#updateCheckbox").click(function(){
    //     $("#div_fromStat").toggle()
    //     $("#div_fromFile").toggle()
    // })
    
    $("#updateCheckbox").change(function () {
         $("#div_fromStat").toggle()
         if (this.value=="from_stat"){
             $("#div_fromFile").hide()
             $("#div_fromStat").show()

         }else if (this.value=="from_file"){
             $("#div_fromFile").show()
             $("#div_fromStat").hide()
         }
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




   


    // function bs_input_file(typeID,fieldID) {
    //      $("."+typeID).before(
    //             function() {
    //                 if ( ! $(this).prev().hasClass('input-ghost') ) {
    //                     var element = $("<input id='"+fieldID+"' type='file' class='input-ghost' style='visibility:hidden; height:0'>");
    //                     element.attr("name",$(this).attr("name"));
    //                     element.change(function(){
    //                         element.next(element).find('input').val((element.val()).split('\\').pop());
    //                     });
    //                     $(this).find("button.btn-choose").click(function(){
    //                         element.click();
    //                     });
    //                     $(this).find("button.btn-reset").click(function(){
    //                         element.val(null);
    //                         $(this).parents("."+typeID).find('input').val('');
    //                     });
    //                     $(this).find('input').css("cursor","pointer");
    //                     $(this).find('input').mousedown(function() {
    //                         $(this).parents('.'+typeID).prev().click();
    //                         return false;
    //                     });
    //                     return element;
    //                 }
    //             }
    //         );
    //     }


    // $(function() {
    //     bs_input_file("input-file-data","uploadData");
    //     bs_input_file("input-file-phenotype","uploadPhenotype");
    //     // $('select').selectpicker()
    // });
        

})


function include(filename)
{
   var head = document.getElementsByTagName('head')[0];

   var script = document.createElement('script');
   script.src = filename;
   script.type = 'text/javascript';
   head.appendChild(script)
}   



function createProject(){
    $.post("http://"+server+"/project",function(result){
        $("#localFileSource").show()
        projectID=result
        $("#title_projectID").html("ProjectID: " + projectID)
        console.log(projectID)
        $("#projectName").text(projectID)
        $("#landing_content").hide()
        $("#accordionSidebar").show()
        $(".nav-item").hide()
        $("#importTab").show()
        include("../static/js/demo-config.js")
    }).fail(function(xhr,status,error){
        showErrorMessage(xhr.responseText,"createProject_error_placeholder")
        
       
    })
}

function showErrorMessage(message,placeholder){
    var messageID=placeholder+"_errorMessage"
    var errorText=placeholder+"_errorText"
    var errorClose=placeholder+"_errorClose"
    $('#'+placeholder).html('<div id='+messageID+' class="alert alert-danger text-center alert-dismissible" role="alert" style="display:none">\
         <button type="button" id="'+errorClose+'" class="close" aria-label="Close"><span aria-hidden="true">&times;</span></button>\
         <p id="'+errorText+'">\
              This is a danger alert—check it out!\
          </p>\
    </div>')
        
    $("#"+errorClose).click(function(){
        $("#"+errorText).text("")
        $("#"+messageID).hide()

    })
    console.log(message)
    $("#"+messageID).show()
    $("#"+errorText).html(message)

}


function vtoolsSelect(){
    $.post("http://"+server+"/select/"+projectID,{"variantTable":$("#secondSelection").val(),"condition":$("#selectCondition").val(),"tableName":$("#newTable").val()},function(result){
        console.log(result)
        vtoolsShow("fields",false)
        vtoolsShow("tables",true)
        vtoolsShow("show",false)
        
    }).fail(function(xhr,status,error){
        showErrorMessage(xhr.responseText,"select_error_placeholder")
    })
}


function vtoolsUpdate(){

    if ($("#updateCheckbox").is(":checked")){
        console.log($("#updateStates").val().join(" "))
        $.post("http://"+server+"/update/"+projectID,{
            "table":$("#updateTables").val(),
            "stat":$("#updateStates").val().join(" "),
            "method":"fromStat"
        },function(result){
            vtoolsShow("show",false)
            vtoolsShow("fields",false)
        }).fail(function(xhr,status,error){
            showErrorMessage(xhr.responseText,"update_error_placeholder")
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

        $.post("http://"+server+"/update/"+projectID,{
            "table":$("#updateTables").val(),
            "fileName":$("#existingSourceNameUpdate").val(),
            "selectedGeno":selectedGeno,
            "selectedVar":selectedVar,
            "method":"fromFile"
        },function(result){
            vtoolsShow("show",false)
            vtoolsShow("fields",false)
        }).fail(function(xhr,status,error){
            showErrorMessage(xhr.responseText,"update_error_placeholder")
        })
    }

}

async function getProject(){
    projectID=$("#projectID").val()
    $("#title_projectID").html("ProjectID: "+projectID)
    $.get("http://"+server+"/project/"+projectID,async function(fileName){
        if (fileName!=="empty"){
            // $(".existingSourceNameClass").each((idx,obj)=>{
            //   addOption(obj.id,["",fileName])
            // })
            addOption("existingSourceName", ["", fileName])
            $("#landing_content").hide()
            $("#accordionSidebar").show()
            await vtoolsUse("dbSNP")
            vtoolsShow("annotations -v0", false)
            vtoolsShow("tests", false)
            vtoolsShow("tables", false)
            vtoolsShow("show", true)

            vtoolsShow("phenotypes", false)
            $("#runAssociation").show()
            $("#showError").hide()

            $.get("http://" + server + "/logs/" + projectID, function (logstring) {
                $('#dataDetail').show()
                logs = logstring.split("\n").filter((log) => log !== "")
                console.log(logs)
                var i;
                var outputLog = "";
                for (i = 0; i < logs.length; i++) {
                    var ii = i + 1
                    outputLog += ii + "." + logs[i] + "\n"
                    if (logs[i].includes("vtools associate")) {
                        $("#showAssociation").show()
                    }
                }
                $("#logsText").val(outputLog)
            })
            get_AssociationDBs(projectID)
            $(".nav-item").show()
        }
      
    }).fail(function(xhr,status,error){
        showErrorMessage(xhr.responseText,"getProject_error_placeholder")
 
    })
}


function get_AssociationDBs(projectID){
    $.get("http://" + server + "/associationDBs/" + projectID, function (data) {

        var dbs = data.DBs.map(function (db) {
            var cols = db.split("/")
            return cols[cols.length - 1].replace(".DB", "")
        })
        addOption("associationDBs", dbs)
        $("#searchGeneButton").show()
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


function addOptionArea(id,contents){
    let options = $.map($("#"+id+" option"), (option)=>option.value)
    console.log(options)
    let selectOption=""
    // if (options.length == 1 && options[0]=="") {
    //     selectOption="<option value='Please select'>Please select</option>";
    // }else{
        options.forEach((option)=>{
            selectOption += '<option>' + option + '</option>'
        })
    // }

    contents.forEach((content)=>{
        selectOption+='<option>'+content+'</option>'
    })
    console.log(id, selectOption)
    $('#' + id).html(selectOption)
}



function addOption(id,contents){
    let options = $.map($("#"+id), (option)=>option.value)
    let selectOption=""
    if (options.length == 1 && options[0]=="") {
        selectOption="<option value='Please select'>Please select</option>";
    }else{
        options.forEach((option)=>{
            selectOption += '<option>' + option + '</option>'
        })
    }

    contents.forEach((content)=>{
        selectOption+='<option>'+content+'</option>'
    })
    $('#' + id).html(selectOption).selectpicker("refresh")

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

    addOption("existingSourceName",[fileName])

    $.get("http://"+server+"/loadSampleData/"+projectID,{"fileType":"data"}).done(function(message){
        console.log(message)
    })


}


function loadSamplePhenotype(){
    var fileName="simulated.tsv"
    $("#localPhenoFileName").val(fileName)
    $.get("http://"+server+"/loadSampleData/"+projectID,{"fileType":"pheno"}).done(function(data){
        $("#phenotypeAdded").text(fileName + " added")
        vtoolsShow("phenotypes", true)
        addToLog("vtools phenotype --from_file " + fileName)
        $("#runAssociation").show()
    })
}



function selectDataSource(fileName){
    console.log(fileName)
    if (fileName.slice(-3)==="vcf"){
        $('#importData').show()
        $('#selectedFileName').text("Import "+fileName)
        $('#addPhenotypeButton').hide()
    }else if (fileName.slice(-3)==="tsv"){
        $('#addPhenotypeButton').show()
        $('#importData').hide()
       
    }
}


function checkImportProgress(){
    $.get("http://"+server+"/check/import/"+projectID,async function(data){
            console.log(data)
            // $("#importProgress").text(data)
            document.getElementById("importProgress").innerHTML='<pre style="color: silver; background: black;">'+data+'</pre>'
            if (data.includes("Importing genotypes: 100%")){
                $('#dataDetail').show()
                vtoolsShow("annotations -v0",false)
                vtoolsShow("tests",false)
                vtoolsShow("tables",true)
                vtoolsShow("fields",false)
                $("#showError").hide()
                await vtoolsUse("dbSNP")
                await vtoolsUse("refGene")
                vtoolsShow("show",false)
                $(".nav-item").show()

            }else{
                setTimeout(checkImportProgress,2000)
            }
        })
}


function importFile(){
    var fileName=$('#existingSourceName option:selected').text();
    var genomeVersion=$("#genomeVersion").val()
    if (fileName==="" || genomeVersion===""){
        showErrorMessage("Please select a file name from dropdown list for importing.","import_error_placeholder")
        return
    }
    addToLog("vtools import "+fileName+" --build "+genomeVersion)
    $.get("http://"+server+"/import/"+projectID,{
        fileName:fileName,genomeVersion:genomeVersion
    }).done( function(data){
        console.log(data)
        setTimeout(checkImportProgress,2000)         
    }).fail(function(xhr,status,error){
        showErrorMessage(xhr.responseText,"import_error_placeholder")
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
    $.get("http://"+server+"/output/"+projectID,{
            "outputTable":$("#outputTables").val(),
            "outputTableFields":outputTableFields,
            // "outputAnno":$("#outputAnnos").val(),
            "outputAnnoFields":outputAnnoFields,
    }).done(function(data){
        var rows=data.split("\n")
        generateDataTable("#dataTable",rows)
    })
    .fail(function(xhr,status,error){
        showErrorMessage(xhr.responseText,"output_error_placeholder")
    })  
}





function generateDataTable(table,rows){
    if (dataTable !== undefined){
        dataTable.destroy()
    }
    $("#infoDiv").hide()
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
    console.log(rows)
    console.log(columns)
    if (rows.length==0){
        showErrorMessage("Table is empty","show_error_placeholder")
    }else{
        dataTable=$(table).DataTable({
            data:rows,
            columns:columns
        })
    }
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

function generateInfoText(table,data){
    $('#dataTable').parents('div.dataTables_wrapper').first().hide();


    $("#infoDiv").show();
    document.getElementById("infoDiv").innerHTML='<pre style="color: silver; background: black;">'+data+'</pre>'

}


function populateDropDownOutput(info){
    $("#outputTables").change(function(){
        vals=fieldMap[this.value]        
        $("#outputTableFields").empty()
        addOption("outputTableFields", vals.map((val)=>val.split(" ")[0])) 
        $("#outputTableFields").selectpicker("refresh")
        $("#outputButton").show()
    })
  
    $("#outputAnnoFields").empty()
    info["Annotation_databases"].forEach((key)=>{        
        vals=fieldMap[key]
        $.each(vals, (index, value) => {
            vals[index]=key+"."+value.split(" ")[0]
        })
        // $.each(vals,(index,value)=>{
        //     var field=value.split("(")[0].replace(/^\s+|\s+$/g, '')
        //     $("#outputAnnoFields").append("<option>"+key+"."+field+"</option>")  
        // })
        addOption("outputAnnoFields", vals) 
        $("#outputAnnoFields").selectpicker("refresh")
        $("#outputButton").show()
    })
    

}


function populateDropDownSelect(info){
    $("#selectionFields").prop('selectedIndex',0);
    $("#secondSelectionDiv").hide()
    $("#thirdSelectionDiv").hide()
    $("#fourthSelectionDiv").hide()
    $("#selectionInputDiv").hide()
    $("#selectCondition").val("")
    $("#newTable").val("")  
    // $("#selectionTables").change(function(){
    //     $("#selectCondition").val(this.value)
    // })

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
        $("#secondSelectionDiv").hide()
        $("#thirdSelectionDiv").hide()
        $("#fourtchSelectionDiv").hide()
        $("#selectionInputDiv").hide()
        console.log(vals)
        $.each(vals,(index,value)=>{
           $("#secondSelection").append("<option value="+value+">"+value+"</option>");
        })
        $("#secondSelection").append("<option selected value='Please select'>Please select</option>");
        $("#secondSelection").selectpicker("refresh")
        $("#secondSelectionDiv").show()
        $("#secondSelection").change(function(){
            vals=fieldMap[this.value]
            $("#selectCondition").val(this.value)
            $("#thirdSelection").empty()
            var typeMap={}
            $.each(vals,(index,value)=>{
                // var field=value.split("(")[0].replace(/^\s+|\s+$/g, '')
                // var fieldType=value.split("(")[1]
                var field=value.split(" ")[0]
                typeMap[field]=value.split(" ")[1]
                $("#thirdSelection").append("<option>"+field+"</option>")  
            })
      
            $("#thirdSelectionDiv").show()
            $("#thirdSelection").append("<option selected value='Please select'>Please select</option>");
            $("#thirdSelection").selectpicker("refresh")
            $("#thirdSelection").change(function(){
               
                $("#fourthSelection").empty()
                $("#fourthSelectionDiv").hide()
                $("#selectionInputDiv").hide()
               
                if (typeMap[this.value]==="char"){
                    $.each(["IS_NOT_NULL","IS_NULL","="],(index,value)=>{
                        $("#fourthSelection").append("<option>"+value+"</option>")
                    })
                }else if (typeMap[this.value]==="int"){
                    $.each([">","<","="],(index,value)=>{
                        $("#fourthSelection").append("<option>"+value+"</option>")
                    })
                }
                // $("#fourthSelection").show()
                $("#fourthSelectionDiv").show()
                $("#fourthSelection").append("<option selected value='Please select'>Please select</option>");
                $("#fourthSelection").selectpicker("refresh")
                $("#fourthSelection").change(function(){
                    $("#selectionInputDiv").show()
                })
            })     
        })
    })
}


function vtoolsShow(option,display){
    // $.get("http://localhost:5000/show",{option:option
    $.get("http://"+server+"/show/"+projectID,{option:option
    }).done(function(data){
        
        switch(option){
            case "genotypes":
                var rows=data.split("\n").filter((line)=>!line.includes("omitted"))
                if (display){
                    generateDataTable("#dataTable",rows)
                }
                break;
            case "samples":
                if(display){
                    generateDataTable("#dataTable",data.split("\n"))
                }
                break;
            case "annotations -v0":
                var rows=data.split("\n")
                var uniqAnnotations=Array.from(new Set(rows.map((row)=>row.split("-")[0])))

                addOption("annotationOptions",uniqAnnotations)
                $("#annotationOptions").val("refGene");
               
                break;

            case "tables":
                var tables=data.split("\n").slice(1).map((row)=>row.split(/(\s+)/)[0]).filter( function(e) { return e.trim().length > 0; } )
                addOption("projectTables",tables)
                addOption("outputTables", tables)
                addOption("updateTables", tables)
                // addOption("selectionTables", tables)
                if(display){
                    generateInfoText('#infoTable',data)
                }
                break;
            
            case "phenotypes": 
                var rows=data.split("\n")
                var phenotypes=rows[0].split(/(\s+)/)
                phenotypes=phenotypes.filter((phenotype)=>phenotype.trim().length>0).slice(2)
                addOption("projectPhenotypes",phenotypes)
                if (display){
                    generateDataTable("#dataTable",rows)
                }
                break;

            case "tests":
                var methods=data.split("\n").map((row)=>row.split(/(\s+)/)[0]).filter( function(e) { return e.trim().length > 0; } )
                addOption("associateMethods",methods)
                break;

            case "fields":
                var fields=data.split("\n").filter((e)=>! (e.startsWith(" "))).filter((e)=>e.length>0)
                
                fields=fields.map((row)=>{
                    var cols=row.split(" ")
                    return cols[0]+" "+cols[1].replace("(","").replace(")","")
                })
                console.log(fields)
                fields.forEach((field)=>{
                    cols=field.split(" ")
                    var fieldType=cols[0].split(".")[0]
                    var fieldValue=field.split(".")[1]
                    if (!(fieldType in fieldMap)){
                        fieldMap[fieldType]=[fieldValue]
                    }else{
                        if (!(fieldMap[fieldType].includes(fieldValue))){
                            fieldMap[fieldType].push(fieldValue)
                        }
                    }
                })
                console.log(fieldMap)
                break;

            case "show":
                info={}
                onTable=false
                onDatabases=false
                var rows=data.split("\n")
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
                if (info["Primary reference genome"]==""){
                    showErrorMessage("Please import genotype first","show_error_placeholder")
                }else{
                    populateDropDownSelect(info)
                    populateDropDownOutput(info)
                }
                break;

            default:
                if(display){
                    generateInfoText('#infoTable',data)
                }
        }
    }).fail(function(xhr,status,error){
        showErrorMessage(xhr.responseText,"show_error_placeholder")
    })
}

function vtoolsUse(option){
    return new Promise((resolve, reject) => {
        addToLog("vtools use "+option)
        $.post("http://"+server+"/use/"+projectID,{
            option:option
        }).done(function(result){
            console.log(option+ "imported")
            vtoolsShow("fields", false)
            // vtoolsShow("show",false)
            $("#useFinished").text(option+" imported")
            resolve(option+" imported")

        }).fail(function(xhr,status,error){
            showErrorMessage(xhr.responseText,"use_error_placeholder")
        })
    })
}


function addPhenotype(){

        var fileName = $('#existingSourceName option:selected').text();     
        console.log(fileName)

        $.post("http://"+server+"/phenotype/"+projectID,{
            fileName:fileName
        }).done( function(data){
            vtoolsShow("phenotypes", true)
            addToLog("vtools phenotype --from_file " + fileName)
            $("#runAssociation").show()   
        }).fail(function(xhr,status,error){
            showErrorMessage(xhr.responseText,"phenotype_error_placeholder")
        })

        

   
}





// function addPhenotype(){
//     var fileName=$("#localPhenoFileName").val()
//     console.log(fileName)
//     $.ajax({
//         url: "http://"+server+"/phenotype/"+projectID,
//         type:"PUT",
//         data:fileName,
//         success:function(data){
//              $("#phenotypeAdded").text(fileName+" added")
//             vtoolsShow("phenotypes",true)
//             addToLog("vtools phenotype --from_file "+fileName)
//             $("#runAssociation").show()
//         },
//         error:function(XMLHttpRequest, textStatus, errorThrown) {
//             alert(errorThrown);
//         }
//       }); 
// }


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
                        get_AssociationDBs(projectID)
                        
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
    if (table=="Please select" || phenotype=="Please select" || method=="Please select"){
        showErrorMessage("Please make selection on table, phenotypes and methods." ,"association_error_placeholder")
    }else{
        $("#runAssociation").hide()
        $.post("http://"+server+"/runAssociation/"+projectID,{
        // $.post("http://localhost:5000/runAssociation",{
            table:table,phenotype:phenotype,method:method,discard:discard,groupby:groupby
        }).done(function(data){
            addToLog("vtools associate "+table+" "+phenotype+" --method "+method+" --group_by "+groupby)
            setTimeout(checkAssociateProgress,2000)  

            
            
        }).fail(function(xhr,status,error){
            showErrorMessage(xhr.responseText,"association_error_placeholder")
            $("#runAssociation").show()
        })
    }

}



