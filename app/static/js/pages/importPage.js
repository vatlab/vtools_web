var importPage = (function(){


    function loadExampleData(){
        if ($('#exampleDataList').has('option').length==0){
            $.get(protocol+"//"+server+"/getExampleDataList/"+projectID).done(function(exampleFiles){
                var fileList=exampleFiles.split("\n")
                for (var file of fileList){
                    utils.addOptionArea("existingExampleName", [file])
                }
            })
        }
    }

    function importFile(){
        var uploadedFiles=$('#existingSourceName').val();
        var exampleFiles=$('#existingExampleName').val();
        if (uploadedFiles.length==0 && exampleFiles.length>0){
                importSelectedFile(exampleFiles,"true")
        }else if (uploadedFiles.length==0 && exampleFiles.length==0){
            $('#existingSourceName option').prop('selected', "true");
            uploadedFiles=$('#existingSourceName').val();
            if (uploadedFiles.length==0){
                utils.showErrorMessage("Please select a file name from dropdown list for importing.","import_error_placeholder")
                return
            }else{
                 importSelectedFile(uploadedFiles,"false")
            }
        }else if (uploadedFiles.length>0){
            importSelectedFile(uploadedFiles,"false")
        }
    }


    function importSelectedFile(fileNames,fromExample){
        console.log(fileNames)        
        vcfFiles=fileNames.filter((file)=>file.endsWith("vcf"))
        tsvFiles=fileNames.filter((file)=>file.endsWith("tsv"))
        if (vcfFiles.length>0){
            vcfFileList=vcfFiles.join(" ")
            importGenotype(vcfFileList, fromExample)      
        }
        if (vcfFiles.length==0 && tsvFiles.length>0){
            phenotypeFile=tsvFiles[0]
            importPhenotype(phenotypeFile,fromExample)
        }
    }

    function importGenotype(fileName,fromExample){
        var genomeVersion=$("#genomeVersion").val()
        $.get(protocol+"//"+server+"/import/"+projectID,{
                fileName:fileName,genomeVersion:genomeVersion,fromExample:fromExample
            }).done(function(data){
                console.log(data)
                utils.addToLog("vtools import "+fileName+" --build "+genomeVersion)
                setTimeout(checkImportProgress,2000)         
            }).fail(function(xhr,status,error){
                utils.showErrorMessage(xhr.responseText,"import_error_placeholder")
            })
    }


    function importPhenotype(fileName,fromExample){
            $.post(protocol+"//"+server+"/phenotype/"+projectID,{
                fileName:fileName,fromExample:fromExample
            }).done( function(data){
                showPage.vtoolsShow("phenotypes", true)
                utils.addToLog("vtools phenotype --from_file " + fileName)
                $("#runAssociation").show()   
            }).fail(function(xhr,status,error){
                utils.showErrorMessage(xhr.responseText,"phenotype_error_placeholder")
            })   
    }

    function checkImportProgress(){
        $.get(protocol+"//"+server+"/check/import/"+projectID, async function(data){
                console.log(data)
                // $("#importProgress").text(data)
                document.getElementById("importProgress").innerHTML='<pre style="color: silver; background: black;">'+data+'</pre>'
                if (data.includes("Importing genotypes: 100%")){
                    $('#dataDetail').show()
                    await utils.vtoolsUse("dbSNP")
                    await utils.vtoolsUse("refGene")
                    await showPage.vtoolsShow("annotations -v0",false)
                    showPage.vtoolsShow("tests",false)
                    showPage.vtoolsShow("tables",true)        
                    $("#showError").hide()
                    showPage.vtoolsShow("fields",false)
                    showPage.vtoolsShow("show",false)
                    $(".nav-item").show()

                    var fileNames=$('#existingSourceName').val();
                    tsvFiles=fileNames.filter((file)=>file.endsWith("tsv"))
                    if (tsvFiles.length>0){
                        phenotypeFile=tsvFiles[0]
                        importPhenotype(phenotypeFile,"false")
                    }
                    fileNames=$('#existingExampleName').val();
                    tsvFiles=fileNames.filter((file)=>file.endsWith("tsv"))
                    if (tsvFiles.length>0){
                        phenotypeFile=tsvFiles[0]
                        importPhenotype(phenotypeFile,"true")
                    }
                }else{
                    setTimeout(checkImportProgress,2000)
                }
            })
    }




    return {
        loadExampleData:   loadExampleData,
        bindEvents: function(){
            $("#importButton").click(function(){
                importFile();
            });

            $("#exampleData").click(function(){
                $('#exampleDataList').toggle();
                if ($('#exampleDataList').is(":visible")){
                    $('#importData').show()
                }
                var fileNames=[]
                $('#existingSourceName option').each(function() { 
                    fileNames.push($(this).attr('value') );
                });
                if ($('#exampleDataList').is(":hidden") && fileNames.length==0){
                    $('#importData').hide()
                }
            });
        }
    };
})()