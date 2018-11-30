
    	
    	function addOption(id,content){
    		var dropdown = document.getElementById(id);
    		var optn = document.createElement("option");
		    optn.text = content;
		    optn.value = content;
		    dropdown.options.add(optn);
    	}


    	function uploadFile(){
    		var fileName = $('#upload')[0].files[0].name;
    		$("#localFileName").val(fileName);
    		addOption("existingSourceName"," ")
    		addOption("existingSourceName",fileName)
    		
		    $('#dataSources').show();  
    	}

    	function selectDataSource(fileName){
    		console.log(fileName)
    		$('#importData').show()
    		$('#selectedFileName').text("Import "+fileName)
    	}

    	function importFile(){
    		var fileName=$("#existingSourceName").val()
    		var genomeVersion=$("#genomeVersion").val()
    		console.log(fileName, genomeVersion)
    		$.get("http://localhost:5000/import",{
    			fileName:fileName,genomeVersion:genomeVersion
    		}, function(data){
    			console.log(data)
    			$('#outputData').show()
    			$('#vtoolsShow').show()
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

    	function vtoolsShow(option){
    		
    		$.get("http://localhost:5000/show",{option:option
    		}, function(data){
    			// $("#showText").text(data)
                var rows=data.split("\n")
                if (option==="genotypes" || option==="samples"){
                    addRowToTable('#dataTable',rows)
                }else{
                    $('#dataTable').empty()
                    rows.forEach((row)=>{
                        row="<tr><td>"+row+"</td></tr>"
                        $('#dataTable').append(row)
                    })
                }
    		})
    	}