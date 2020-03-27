    var showPage = (function(){

        function vtoolsShow(option,display){
            // $.get("http://localhost:5000/show",{option:option

            return new Promise((resolve, reject) => {           
                $.get(protocol+"//"+server+"/show/"+projectID,{option:option
                }).done(function(data){
                    
                    switch(option){
                        case "genotypes":
                            var rows=data.split("\n").filter((line)=>!line.includes("omitted"))
                            if (display){
                                utils.generateDataTable("#dataTable",rows)
                            }
                            resolve("done")
                            break;
                        case "samples":
                            if(display){
                                utils.generateDataTable("#dataTable",data.split("\n"))
                            }
                            resolve("done")
                            break;
                        case "annotations -v0":
                            var rows=data.split("\n")
                            var uniqAnnotations=Array.from(new Set(rows.map((row)=>row.split("-")[0])))

                            utils.addOption("annotationOptions",uniqAnnotations)
                            $("#annotationOptions").val("refGene");
                            resolve("done")
                            break;

                        case "tables":
                            var tables=data.split("\n").slice(1).map((row)=>row.split(/(\s+)/)[0]).filter( function(e) { return e.trim().length > 0; } )
                            utils.addOption("projectTables",tables)
                            utils.addOption("outputTables", tables)
                            utils.addOption("updateTables", tables)
                            // addOption("selectionTables", tables)
                            if(display){
                                utils.generateInfoText('#infoTable',data)
                            }
                            resolve("done")
                            break;
                        
                        case "phenotypes": 
                            var rows=data.split("\n")
                            var phenotypes=rows[0].split(/(\s+)/)
                            phenotypes=phenotypes.filter((phenotype)=>phenotype.trim().length>0).slice(2)
                            utils.addOption("projectPhenotypes",phenotypes)
                            if (display){
                                utils.generateDataTable("#dataTable",rows)
                            }
                            resolve("done")
                            break;

                        case "tests":
                            var methods=data.split("\n").map((row)=>row.split(/(\s+)/)[0]).filter( function(e) { return e.trim().length > 0; } )
                            utils.addOption("associateMethods",methods)
                            resolve("done")
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
                            resolve("done")
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
                                utils.showErrorMessage("Please import genotype first","show_error_placeholder")
                            }else{
                                dataPage.populateDropDownSelect(info)
                                outputPage.populateDropDownOutput(info)
                            }
                            resolve("done")
                            break;

                        default:
                            if(display){
                                utils.generateInfoText('#infoTable',data)
                            }
                    }
                }).fail(function(xhr,status,error){
                    utils.showErrorMessage(xhr.responseText,"show_error_placeholder")
                })

            })
        }


        return {
            vtoolsShow: vtoolsShow,
            bindEvents: function(){
               
                $('#showProjectOptions').change(function(){
                    vtoolsShow(this.value,true);
                });

                $('#showVtoolsOptions').change(function(){
                    vtoolsShow(this.value,true);
                });
            }
        };

    })()