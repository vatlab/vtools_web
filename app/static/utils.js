
    	
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
    		$.get("http://localhost:5000/import",{
    			fileName:fileName,genomeVersion:genomeVersion
    		}, function(data){
    			console.log(data)
    			$('#dataDetail').show()
                vtoolsShow("annotations -v0")


    		})
    	}

    	function outputData(){
    		$.get("http://localhost:5000/output",{
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
    		
    		$.get("http://localhost:5000/show",{option:option
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
                }
                else{
                    addRowToTableTab('#dataTable',rows)

                    
                    // $('#dataTable').empty()
                    // rows.forEach((row)=>{
                    //     row="<tr><td>"+row+"</td></tr>"
                    //     $('#dataTable').append(row)
                    // })
                }
    		})
    	}

        function vtoolsUse(){
            var option=$("#annotationOptions").val();
            $.post("http://localhost:5000/use",{
                option:option
            },function(result){
                console.log(option+ "imported")
                $("#useFinished").text(option+" imported")
        
            })
        }


        function addPhenotype(){
            var fileName=$("#existingSourceName").val()
            $.post("http://localhost:5000/addPhenotype",{
                fileName:fileName
            },function(data){
                console.log(data)
                console.log(fileName)
                $("#phenotypeAdded").text(fileName+" added")
            })
        }