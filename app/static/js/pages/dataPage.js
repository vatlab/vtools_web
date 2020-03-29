var dataPage = (function(){
     

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






        function vtoolsSelect(){
            $.post(protocol+"//"+server+"/select/"+projectID,{"variantTable":$("#secondSelection").val(),"condition":$("#selectCondition").val(),"tableName":$("#newTable").val()},function(result){
                console.log(result)
                showPage.vtoolsShow("fields",false)
                showPage.vtoolsShow("tables",true)
                showPage.vtoolsShow("show",false)
                
            }).fail(function(xhr,status,error){
                utils.showErrorMessage(xhr.responseText,"select_error_placeholder")
            })
        }


        function vtoolsUpdate(){

            var updateStates=$("#updateStates").val().join(" ")
            var updateFile=$("#existingSourceNameUpdate").val().join(",")
            console.log(updateStates)
            console.log(updateFile)
            if (updateStates.length>0){
                $.post(protocol+"//"+server+"/update/"+projectID,{
                    "table":$("#updateTables").val(),
                    "stat":updateStates,
                    "method":"fromStat"
                },function(result){
                    showPage.vtoolsShow("show",false)
                    showPage.vtoolsShow("fields",false)
                }).fail(function(xhr,status,error){
                    utils.showErrorMessage(xhr.responseText,"update_error_placeholder")
                })
            }
            // }else{
            if (updateFile.length>0){
                var selectedGeno=""
                var selectedVar=""
         
                if ($("#updateGenoInfo").val()!==undefined){
                    selectedGeno=$("#updateGenoInfo").val().join(",")
                }
                if ($("#updateVarInfo").val()!==undefined){
                    selectedVar=$("#updateVarInfo").val().join(",")
                }

                $.post(protocol+"//"+server+"/update/"+projectID,{
                    "table":$("#updateTables").val(),
                    "fileName":updateFile,
                    "selectedGeno":selectedGeno,
                    "selectedVar":selectedVar,
                    "method":"fromFile"
                },function(result){
                    showPage.vtoolsShow("show",false)
                    showPage.vtoolsShow("fields",false)
                }).fail(function(xhr,status,error){
                    utils.showErrorMessage(xhr.responseText,"update_error_placeholder")
                })
            }
            // }

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


        function getFileInfo(fileName){

            $.get(protocol+"//"+server+"/fileInfo/"+projectID,{"fileName":fileName}).done(function(result){
                if (result["genoFields"].length>0){
                    $("#div_genoInfo").show()
                    utils.addOption("updateGenoInfo",result["genoFields"])
                }else{
                    $("#div_genoInfo").hide()
                }
                if (result["varFields"].length>0){
                    $("#div_varInfo").show()
                    utils.addOption("updateVarInfo",result["varFields"])
                }else{
                    $("#div_varInfo").hide()
                }
            })
        }


        return {
            populateDropDownSelect:populateDropDownSelect,
            bindEvents: function(){
                $("#useButton").click(function(){
                    var option = $("#annotationOptions").val();
                    utils.vtoolsUse(option).then((message)=>console.log(message));
                });

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


                $("#updateSelection").change(function () {
                     $("#div_fromStat").toggle()
                     if (this.value=="from_stat"){
                         $("#div_fromFile").hide()
                         $("#div_fromStat").show()

                     }else if (this.value=="from_file"){
                         $("#div_fromFile").show()
                         $("#div_fromStat").hide()
                     }
                })

                
                    $('#existingSourceNameUpdate').change(function() {
                        getFileInfo(this.value)
                    });


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

                
            }
        };

    })()