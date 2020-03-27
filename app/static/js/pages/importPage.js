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
        // var fileName=$('#existingSourceName option:selected').text();
        var fileNames=$('#existingSourceName').val();
        files=fileNames.join(" ")
        console.log(files)
        
        if (files==""){
            $('#existingSourceName option').prop('selected', true);
            fileNames=$('#existingSourceName').val();
            files=fileNames.join(" ")
            if (files==""){
                utils.showErrorMessage("Please select a file name from dropdown list for importing.","import_error_placeholder")
                return
            }
        }
        vcfFiles=fileNames.filter((file)=>file.endsWith("vcf"))
        tsvFiles=fileNames.filter((file)=>file.endsWith("tsv"))
        if (vcfFiles.length>0){
            vcfFileList=vcfFiles.join(" ")
            importGenotype(vcfFileList, false)      
        }
        if (vcfFiles.length==0 && tsvFiles.length>0){
            phenotypeFile=tsvFiles[0]
            importPhenotype(phenotypeFile)
        }
    }

    function importGenotype(fileName){
        var genomeVersion=$("#genomeVersion").val()
        $.get(protocol+"//"+server+"/import/"+projectID,{
                fileName:fileName,genomeVersion:genomeVersion
            }).done(function(data){
                console.log(data)
                utils.addToLog("vtools import "+files+" --build "+genomeVersion)
                setTimeout(checkImportProgress,2000)         
            }).fail(function(xhr,status,error){
                utils.showErrorMessage(xhr.responseText,"import_error_placeholder")
            })
    }


    function importPhenotype(fileName){
            $.post(protocol+"//"+server+"/phenotype/"+projectID,{
                fileName:fileName
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
                    showPage.vtoolsShow("annotations -v0",false)
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
                        importPhenotype(phenotypeFile)
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
            });
        }
    };
})()