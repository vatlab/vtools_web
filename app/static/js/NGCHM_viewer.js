
$(document).ready(function(){

    $("#checkNGCHM").click(function(){
        $("#plotNGCHM").show();
        var ajaxUrl="http://"+server+"/ngchmtest"
        console.log(ajaxUrl)
        
        var xmlhttp=new XMLHttpRequest();
        xmlhttp.open("GET", ajaxUrl, true);
        xmlhttp.responseType = 'blob';
        xmlhttp.onload = function(e) {
            if (this.status == 200) {
                var blob = new Blob([this.response], {type: 'compress/zip'});
                // document.getElementById('loader').style.display = '';
                // NgChm.UTIL.resetCHM();
                NgChm.UTIL.displayFileModeCHM(blob)
                document.getElementById("container").addEventListener('wheel', NgChm.SEL.handleScroll, false);
                document.getElementById("detail_canvas").focus();
            }
        };
        xmlhttp.send()
    })


    
})