var indexPage = (function(){

        
        function include(filename)
        {
           var head = document.getElementsByTagName('head')[0];

           var script = document.createElement('script');
           script.src = filename;
           script.type = 'text/javascript';
           head.appendChild(script)
        }   


        function createProject(){
            importPage.loadExampleData()

            $.post(protocol+"//"+server+"/project",function(result){
                // $("#localFileSource").show()
                // $("#dataSources").hide()
                include("../static/js/demo-config.js")
                $('#existingSourceName')
                    .find('option')
                    .remove()
                    .end()
                $("#infoDiv").empty()
                $("#infoArea").hide()
                $('#dataTable tbody').empty();
                
                $("#plotNGCHM").empty()
                $("#plotNGCHM").hide()

                $("#exampleDataList").hide()
                $("#importProgress").text("")
                $("#importData").hide()

                $("#landingNav").hide()
                $("#content-wrapper").hide()
                
                $("#indexNav").show()
                $("#accordionSidebar").show()
                $(".nav-tab").hide()
                $("#importTab").show()
                projectID=result
                $("#title_projectID").html("ProjectID: " + projectID)
                console.log(projectID)
                $("#projectName").text(projectID)
                $("#logsText").html("")
                logs=[]

                
            }).fail(function(xhr,status,error){
                utils.showErrorMessage(xhr.responseText,"createProject_error_placeholder")
            })
        };

        async function getProject(){
            importPage.loadExampleData()
            projectID=$("#projectID").val()
            $("#title_projectID").html("ProjectID: "+projectID)
            $.get(protocol+"//"+server+"/project/"+projectID,async function(message){
                   console.log(message)
                     include("../static/js/demo-config.js")
                    $("#content-wrapper").hide()
                    $("#accordionSidebar").show()
                    $("#infoArea").show()
                    $("#landingNav").hide()
                    $("#indexNav").show()
                    await utils.vtoolsUse("dbSNP")
                    await utils.vtoolsUse("refGene")
                    await showPage.vtoolsShow("annotations -v0", false)
                    showPage.vtoolsShow("tests", false)
                    showPage.vtoolsShow("tables", false)
                    showPage.vtoolsShow("show", true)
                    showPage.vtoolsShow("phenotypes", false)
                    $("#runAssociation").show()
                    $("#showError").hide()
                    associationPage.get_AssociationDBs(projectID)
                    $(".nav-tab").show()

                    $.get(protocol+"//" + server + "/logs/" + projectID, function (logString) {
                        [vcfFiles,phenoFiles]=utils.updateLog(logString);
                        if (vcfFiles!=undefined){
                            for (var vcfFile of vcfFiles){
                                utils.addOptionArea("existingSourceName", [$.trim(vcfFile)])
                            }
                        }
                        if (phenoFiles!=undefined){
                            for (var phenoFile of phenoFiles){
                                utils.addOptionArea("existingSourceName", [$.trim(phenoFile)])
                            }
                        }
                    })
            }).fail(function(xhr,status,error){
                utils.showErrorMessage(xhr.responseText,"getProject_error_placeholder")
            })
        };

        return {
            bindEvents: function(){
                $("#getProjectButton").click(function(){
                        getProject()
                })

                $("#createRandomProject").click(function(){
                        createProject();
                })

                $('a[href="#landingPage"]').click(function(){
                       console.log(projectID)
                       $("#content-wrapper").show()
                       $("#accordionSidebar").hide()
                       $("#infoArea").hide()
                       $("#plotNGCHM").hide()
                       $("#landingNav").show()
                       $("#indexNav").hide()
                       $("#projectID").val(projectID)
                   })
                }
        };

    })()
