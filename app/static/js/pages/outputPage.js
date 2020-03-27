var outputPage = (function(){

    function vtoolsOutput(){
        // $.get("http://localhost:5000/output",{
        let outputTableFields=""
        let outputAnnoFields=""
        if ($("#outputTableFields").val()!==null){
            outputTableFields=$("#outputTableFields").val().join(" ")
        }
        if ($("#outputAnnoFields").val()!==null){
            outputAnnoFields=$("#outputAnnoFields").val().join(" ")
        }
        $.get(protocol+"//"+server+"/output/"+projectID,{
                "outputTable":$("#outputTables").val(),
                "outputTableFields":outputTableFields,
                // "outputAnno":$("#outputAnnos").val(),
                "outputAnnoFields":outputAnnoFields,
        }).done(function(data){
            var rows=data.split("\n")
            utils.generateDataTable("#dataTable",rows)
        })
        .fail(function(xhr,status,error){
            utils.showErrorMessage(xhr.responseText,"output_error_placeholder")
        })  
    }

    function populateDropDownOutput(info){
        $("#outputTables").change(function(){
            vals=fieldMap[this.value]        
            $("#outputTableFields").empty()
            utils.addOption("outputTableFields", vals.map((val)=>val.split(" ")[0])) 
            $("#outputTableFields").selectpicker("refresh")
            $("#outputButton").show()
        })
      
        $("#outputAnnoFields").empty()
        info["Annotation_databases"].forEach((key)=>{        
            vals=fieldMap[key]
            $.each(vals, (index, value) => {
                vals[index]=key+"."+value.split(" ")[0]
            })
            // $.each(vals,(index,value)=>{
            //     var field=value.split("(")[0].replace(/^\s+|\s+$/g, '')
            //     $("#outputAnnoFields").append("<option>"+key+"."+field+"</option>")  
            // })
            utils.addOption("outputAnnoFields", vals) 
            $("#outputAnnoFields").selectpicker("refresh")
            $("#outputButton").show()
        })
    }




    return {
        populateDropDownOutput:populateDropDownOutput,
        bindEvents: function(){
            
            $("#outputButton").click(function(){
                vtoolsOutput();
            });
        }
    };
})()
