var associationPage = (function(){

        function get_AssociationDBs(projectID){
            $.get(protocol+"//" + server + "/associationDBs/" + projectID, function (data) {

                var dbs = data.DBs.map(function (db) {
                    var cols = db.split("/")
                    return cols[cols.length - 1].replace(".DB", "")
                })
                $("#associationDBs").empty()
                $("#associationDBs_show").empty()
                utils.addOption("associationDBs", dbs)
                utils.addOption("associationDBs_show", dbs)
                $("#searchGeneButton").show()
            })
        }


        function checkAssociateProgress(table,phenotype,method){
            $.get(protocol+"//"+server+"/check/associate/"+projectID,{
                // $.post("http://localhost:5000/runAssociation",{
                    table:table,phenotype:phenotype,method:method
                }, function(data){
                    console.log(data)
                    // if (data.includes("Testing for association")){
                    $("#associateProgress").text(data)
                    // }
                    if (data.includes("Testing for association: 100%")){
                        
                        console.log("association done")
                        let associationDB="association"+"_"+table+"_"+phenotype+"_"+method
                        $.get(protocol+"//"+server+"/associationResult/"+projectID+"/"+associationDB,{
                // $.post("http://localhost:5000/runAssociation",{
                            table:table,phenotype:phenotype,method:method
                        },function(data){
                                    if (data!=="Association result is not available."){
                                        var rows=data.split("\n")
                                        utils.generateDataTable("#dataTable",rows)
                                        $("#runAssociation").show()
                                        $("#showAssociationArea").show()
                                        get_AssociationDBs(projectID)
                                        utils.addToLog("vtools associate "+table+" "+phenotype+" --method "+method)
                                        
                                    }
                                })
                    }else{
                        setTimeout(function(){
                            checkAssociateProgress(table,phenotype,method);
                        },2000)
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
                utils.showErrorMessage("Please make selection on table, phenotypes and methods." ,"association_error_placeholder")
            }else{
                $("#runAssociation").hide()
                $.post(protocol+"//"+server+"/runAssociation/"+projectID,{
                // $.post("http://localhost:5000/runAssociation",{
                    table:table,phenotype:phenotype,method:method,discard:discard,groupby:groupby
                }).done(function(data){
                    setTimeout(checkAssociateProgress(table,phenotype,method),2000)  

                }).fail(function(xhr,status,error){
                    utils.showErrorMessage(xhr.responseText,"association_error_placeholder")
                    $("#runAssociation").show()
                })
            }

        }



         return {
             get_AssociationDBs:get_AssociationDBs,
            bindEvents: function(){
               
                $("#runAssociation").click(function(){
                    runAssociation();
                });
                // $("#showAssociation").click(function(){
                //     $.get(protocol+"//"+server+"/associationResult/"+projectID,function(data){
                //         var rows=data.split("\n")
                //         generateDataTable("#dataTable",rows)
                //         $("#runAssociation").show()
                //         $("#showAssociation").hide()
                //     })
                // })
                $("#associationDBs_show").change(function(){
                    associationDB=this.value
                    $.get(protocol+"//"+server+"/associationResult/"+projectID+"/"+associationDB,function(data){
                        var rows=data.split("\n")
                        utils.generateDataTable("#dataTable",rows)
                        $("#runAssociation").show()
                        $("#showAssociation").hide()
                    })
                    

                })
            }
        };
    })()