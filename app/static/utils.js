       
    	var server="10.105.39.124/vtoolsweb"
    	

        function addOption(id,content){
    		var dropdown = document.getElementById(id);
    		var optn = document.createElement("option");
		    optn.text = content;
		    optn.value = content;
		    dropdown.options.add(optn);
    	}


    	function uploadFile(){
    		var fileName = $('#upload')[0].files[0].name;
    		
    		addOption("existingSourceName"," ")
    		addOption("existingSourceName",fileName)
    		
		    $('#dataSources').show();  
    	}

        function loadSampleData(){
            var fileName="1000_test_2k.vcf"
            $("#localFileName").val(fileName);
            addOption("existingSourceName"," ")
            addOption("existingSourceName",fileName)
            addOption("existingSourceName","simulated.tsv")
            $('#dataSources').show();
            $('#addPhenotype').show();

        }

    	function selectDataSource(fileName){
    		console.log(fileName)
            if (fileName.slice(-3)==="vcf"){
        		$('#importData').show()
        		$('#selectedFileName').text("Import "+fileName)
            }else if (fileName.slice(-3)==="tsv"){
                $('#addPhenotype').show()
                $("#selectPhenotypeFile").text("Import "+fileName)
            }
    	}

        

    	function importFile(){
    		var fileName=$("#existingSourceName").val()
    		var genomeVersion=$("#genomeVersion").val()
    		console.log(fileName, genomeVersion)
            $.get("http://"+server+"/import",{
    		// $.get("http://localhost:5000/import",{
    			fileName:fileName,genomeVersion:genomeVersion
    		}, function(data){
    			console.log(data)
    			$('#dataDetail').show()
                vtoolsShow("annotations -v0")
                vtoolsShow("tests")
                document.getElementById("defaultOpen").click();
                vtoolsShow("tables")


    		})
    	}

    	function outputData(){
    		// $.get("http://localhost:5000/output",{
            $.get("http://"+server+"/output",{
    		}, function(data){
    			var rows=data.split("\n")
                
    			addRowToTable('#dataTable',rows)
    		})	
    	}

        function addRowToTable(table,rows){
            $('#dataTable').empty()
            rows.forEach((row)=>{
                cells=row.split(/(\s+)/).filter( function(e) { return e.trim().length > 0; } );
                var row="<tr>"
                for(var i =0; i < cells.length; i++){
                    row+="<td>"+cells[i]+"</td>"
                }
                row+="</tr>"
                $(table).append(row)
            })

        }

        function addRowToTableTab(table,rows){
            $('#dataTable').empty()
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

    	function vtoolsShow(option){
    		
    		// $.get("http://localhost:5000/show",{option:option
            $.get("http://"+server+"/show",{option:option
    		}, function(data){
    			// $("#showText").text(data)
                var rows=data.split("\n")
                if (option==="genotypes" || option==="samples"){
                    addRowToTable('#dataTable',rows)
                }else if (option==="annotations -v0"){
                    var uniqAnnotations=Array.from(new Set(rows.map((row)=>row.split("-")[0])))
                    uniqAnnotations.forEach((uniqAnnotation)=>{
                        addOption("annotationOptions",uniqAnnotation)
                    })
                    $("#annotationOptions").val("refGene");
                    $("#dataAnnotation").show()
                }else{
                    addRowToTableTab('#dataTable',rows)
                    if (option==="tables"){
                        var tables=rows.slice(1).map((row)=>row.split(/(\s+)/)[0]).filter( function(e) { return e.trim().length > 0; } )
                        console.log(tables)
                        tables.forEach((table)=>{
                            addOption("projectTables",table)
                        })
                    }else if (option==="phenotypes"){     
                        var phenotypes=rows[0].split(/(\s+)/)
                        phenotypes=phenotypes.filter((phenotype)=>phenotype.trim().length>0).slice(2)
                        phenotypes.forEach((phenotype)=>{
                            addOption("projectPhenotypes",phenotype)
                        })
                    }else if (option==="tests"){
                        var methods=rows.map((row)=>row.split(/(\s+)/)[0]).filter( function(e) { return e.trim().length > 0; } )
                        console.log(methods)
                        methods.forEach((method)=>{
                            addOption("associateMethods",method)
                        })

                    }

                }
    		})
    	}

        function vtoolsUse(){
            var option=$("#annotationOptions").val();
            // $.post("http://localhost:5000/use",{
            $.post("http://"+server+"/use",{
                option:option
            },function(result){
                console.log(option+ "imported")
                $("#useFinished").text(option+" imported")
        
            })
        }


        function addPhenotype(){
            var fileName=$("#existingSourceName").val()
            // $.post("http://localhost:5000/addPhenotype",{
            $.post("http://"+server+"/addPhenotype",{
                fileName:fileName
            },function(data){
                $("#phenotypeAdded").text(fileName+" added")
                vtoolsShow("phenotypes")
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
            $.post("http://"+server+"/runAssociation",{
            // $.post("http://localhost:5000/runAssociation",{
                table:table,phenotype:phenotype,method:method,discard:discard,groupby:groupby
            },function(data){
                console.log(data)
                var rows=data.split("\n")
                addRowToTable('#dataTable',rows)
                
            })


        }

