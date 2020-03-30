var server;
var dataTable;

var projectID;
var fieldMap={};
var protocol=window.location.protocol;
var utils;



$(document).ready(function(){
    server=window.location.hostname

    indexPage.bindEvents();
    importPage.bindEvents();
    dataPage.bindEvents();
    outputPage.bindEvents();
    showPage.bindEvents();
    associationPage.bindEvents();


   utils = (function(){

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



        function addToLog(log){
            // console.log(log,logs)
            // if (!logs.includes(log)){
            //     logs.push(log)
            //     var i;
            //     var outputLog="";
            //     for (i=0;i<logs.length;i++){
            //           var ii=i+1
            //           outputLog+=ii+"."+logs[i]+"<br>"
            //     }
            //     $("#logsText").html(outputLog)

                $.post(protocol+"//"+server+"/logs/"+projectID,{
                    "log":log
                }).done(function(logString){
                    updateLog(logString)
                    console.log("log saved.")
                }).fail(function(xhr,status,error){
                    alert(error)
                })
            // }
        }


        function updateLog(logString){
            var logs = logString.split("\n").filter((log) => log !== "")
                       
            var i;
            var outputLog = "";
            var vcfFiles;
            var phenoFiles;
            for (i = 0; i < logs.length; i++) {
                var ii = i + 1
                outputLog += ii + "." + logs[i] + "<br>"
                if (logs[i].includes("vtools associate")) {
                    $("#showAssociationArea").show()
                }
                if (logs[i].includes("vtools import")){
                    vcfFiles=logs[i].match(/\s([a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*vcf)\s/g)   
                }
                 if (logs[i].includes("vtools phenotype")){
                    phenoFiles=logs[i].match(/\s([a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*tsv)\s?/g)                 
                }
                
            }
            console.log(outputLog)
            $("#logsText").html(outputLog)
            return [vcfFiles,phenoFiles]
        }


        function addOptionArea(id,contents){
            let options = $.map($("#"+id+" option"), (option)=>option.value)
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
            $('#' + id).html(selectOption)
        }



        function addOption(id,contents){
            let options = $.map($("#"+id+" option"), (option)=>option.value)
    
            let selectOption="";
            if (options.length == 0) {
                selectOption="<option value='Please select'>Please select</option>";
            }else{
                options.forEach((option)=>{
                    selectOption += '<option>' + option + '</option>'
                })
            }
            contents.forEach((content)=>{
                if (!options.includes(content)){
                    selectOption+='<option>'+content+'</option>'
                }
            })
            $('#' + id).html(selectOption).selectpicker("refresh")

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
                // console.log(rows)
                // console.log(columns)
                if (rows.length==0){
                    showErrorMessage("Table is empty","show_error_placeholder")
                }else{
                    dataTable=$(table).DataTable({
                        data:rows,
                        columns:columns
                    })
                    $("#dataTable").show()
                    $("#infoArea").show()
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
                $("#infoArea").show()
                document.getElementById("infoDiv").innerHTML='<pre style="color: silver; background: black;">'+data+'</pre>'

            }


            function vtoolsUse(option){
                return new Promise((resolve, reject) => {
                    addToLog("vtools use "+option)
                    $.post(protocol+"//"+server+"/use/"+projectID,{
                        option:option
                    }).done(function(result){
                        console.log(option+ "imported")
                        showPage.vtoolsShow("fields", false)
                        // vtoolsShow("show",false)
                        $("#useFinished").text(option+" imported")
                        resolve(option+" imported")

                    }).fail(function(xhr,status,error){
                        showErrorMessage(xhr.responseText,"annotation_error_placeholder")
                    })
                })
            }

            return{
                showErrorMessage:showErrorMessage,
                addToLog:addToLog,
                updateLog:updateLog,
                addOptionArea:addOptionArea,
                addOption:addOption,
                generateDataTable:generateDataTable,
                addRowToTable:addRowToTable,
                generateInfoText:generateInfoText,
                vtoolsUse:vtoolsUse

            }

    })()



})


    

    // $("#dataUpload").submit(function(e){
    //     e.preventDefault();
    //     var formData= new FormData()
    //     var fileName = $('#uploadData')[0].files[0].name;
    //     $("#localFileName").val(fileName);
    //     formData.append('datafile',$('#uploadData')[0].files[0])
    //     $.ajax({
    //         url:protocol+"//"+server+"/data/"+projectID,
    //         data:formData,
    //         type:'POST',
    //         contentType:false,
    //         processData:false, 
    //         success:function(data){
    //             console.log("Upload success")
    //             addOption("existingSourceName", ["", fileName])
    //             addOption("existingSourceNameUpdate", ["", fileName])
    //             // $('#dataSources').show();
    //         },
         
    //     });



    // })

    


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

    // $("#addPhenotypeButton").click(function(){
    //     var fileName = $('#existingSourceName option:selected').text();     
    //     addPhenotype(fileName)
    // })





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
        


// function loadSamplePhenotype(){
//     var fileName="simulated.tsv"
//     $("#localPhenoFileName").val(fileName)
//     $.get(protocol+"//"+server+"/loadSampleData/"+projectID,{"fileType":"pheno"}).done(function(data){
//         $("#phenotypeAdded").text(fileName + " added")
//         vtoolsShow("phenotypes", true)
//         addToLog("vtools phenotype --from_file " + fileName)
//         $("#runAssociation").show()
//     })
// }



// function selectDataSource(fileName){
//     console.log(fileName)
//     if (fileName.slice(-3)==="vcf"){
//         $('#importData').show()
//         // $('#selectedFileName').text("Import "+fileName)
//         $('#addPhenotypeButton').hide()
//     }else if (fileName.slice(-3)==="tsv"){
//         $('#addPhenotypeButton').show()
//         $('#importData').hide()
       
//     }
// }









