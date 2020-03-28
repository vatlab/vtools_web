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
                $('#existingSourceName')
                    .find('option')
                    .remove()
                    .end()
                $("#infoDiv").empty()
                // console.log(dataTable)
                // if (dataTable != undefined){
                 $('#dataTable tbody').empty();
                // }
                $("#plotNGCHM").empty()
                $("#exampleDataList").hide()
                $("#importProgress").text("")
                $("#importData").hide()
                $("#infoArea").show()
                $("#plotNGCHM").show()
                $("#landingNav").hide()
                $("#indexNav").show()
                projectID=result
                $("#title_projectID").html("ProjectID: " + projectID)
                console.log(projectID)

                $("#projectName").text(projectID)
                $("#content-wrapper").hide()
                // $("#landing_content").hide()
                $("#accordionSidebar").show()
                $(".nav-item").hide()
                $("#importTab").show()
                include("../static/js/demo-config.js")

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
 
                    $("#content-wrapper").hide()
                    $("#accordionSidebar").show()
                    $("#infoArea").show()
                    $("#plotNGCHM").show()
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
                    $(".nav-item").show()

                    $.get(protocol+"//" + server + "/logs/" + projectID, function (logstring) {
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
