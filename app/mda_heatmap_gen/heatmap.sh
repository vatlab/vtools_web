#!/bin/bash
#echo "1: " $1" 2: " $2" 3: " $3" 4: "$4" 5: "$5 " 6: "$6 "7: "$7" 8: "$8 " 9: "$9" 10: "${10}" 11: "${11} "12: "${12} 
#echo " 13: "${13}" 14: "${14}" 15: "${15}" 16: "${16} "17: "${17}" 18: "${18}" 19: "${19}" 20: "${20}" 21: "${21} " 22: "${22}" 23:" ${23} 

#Count total number of parameters and classification parameters
parmSize=0
classSize=0
matrixSize=0
for i in "$@"; do
	currParm=$(cut -d'|' -f1 <<< $i)
	parmSize=$((parmSize+1))
	if [ $currParm = "classification" ]
	then
		classSize=$((classSize+1))
  	fi
done

#Get tool data and tool install directories
tooldir=$1
tooldata=$2
#create temp directory for row and col order and dendro files.
tdir=$tooldata/$(date +%y%m%d%M%S)
mkdir $tdir
#echo "tdir: "$tdir

#Extract parameters for row and column order and dendro files
rowOrderFile=$tdir/ROfile.txt
rowDendroFile=$tdir/RDfile.txt
colOrderFile=$tdir/COfile.txt
colDendroFile=$tdir/CDfile.txt
rowOrderJson='"order_file": "'$rowOrderFile'",'
rowDendroJson='"dendro_file": "'$rowDendroFile'",'
colOrderJson='"order_file": "'$colOrderFile'",'
colDendroJson='"dendro_file": "'$colDendroFile'",'

#BEGIN: Construct JSON for all non-repeating parameters
parmJson='{'
rowConfigJson='"row_configuration": {'
colConfigJson='"col_configuration": {'

ctr=0
heatmapName="testRun"
for i in "$@"; do
	if [ $ctr -gt 1 ]
	then
		currParm=$(cut -d'|' -f1 <<< $i)
		if [ $currParm != "matrix_files" ] && [ $currParm != "row_configuration" ] && [ $currParm != "col_configuration" ] && [ $currParm != "classification" ]
		then
			#Parse pipe-delimited parameter parameter
			parmJson=$parmJson' "'$(cut -d'|' -f1 <<< $i)'":"'$(cut -d'|' -f2 <<< $i)'",'
			if [ $currParm = "chm_name" ]
			then
				heatmapName=$(cut -d'|' -f2 <<< $i)
			fi
	  	fi
		if [ $currParm = "row_configuration" ]
		then
			rowOrder=$(cut -d'|' -f3 <<< $i)
			rowDistance=$(cut -d'|' -f5 <<< $i)
			rowAgglomeration=$(cut -d'|' -f7 <<< $i)
			rowCuts=$(cut -d'|' -f9 <<< $i)
			rowLabels=$(cut -d'|' -f11 <<< $i)
			dataTypeJson='"'$(cut -d'|' -f10 <<< $i)'":["'$rowLabels'"]'
			if [ $rowOrder = 'Hierarchical' ]
			then
				rowConfigJson=$rowConfigJson$rowOrderJson$rowDendroJson
			fi
			rowConfigJson=$rowConfigJson'"'$(cut -d'|' -f2 <<< $i)'":"'$(cut -d'|' -f3 <<< $i)'","'$(cut -d'|' -f4 <<< $i)'":"'$(cut -d'|' -f5 <<< $i)'","'$(cut -d'|' -f6 <<< $i)'":"'$(cut -d'|' -f7 <<< $i)'",'$dataTypeJson'},'
	  	fi
		if [ $currParm = "col_configuration" ]
		then
			colOrder=$(cut -d'|' -f3 <<< $i)
			colDistance=$(cut -d'|' -f5 <<< $i)
			colAgglomeration=$(cut -d'|' -f7 <<< $i)
			colCuts=$(cut -d'|' -f9 <<< $i)
			colLabels=$(cut -d'|' -f11 <<< $i)
			dataTypeJson='"'$(cut -d'|' -f10 <<< $i)'":["'$colLabels'"]'
			if [ $colOrder = 'Hierarchical' ]
			then
				colConfigJson=$colConfigJson$colOrderJson$colDendroJson
			fi
			colConfigJson=$colConfigJson'"'$(cut -d'|' -f2 <<< $i)'":"'$(cut -d'|' -f3 <<< $i)'","'$(cut -d'|' -f4 <<< $i)'":"'$(cut -d'|' -f5 <<< $i)'","'$(cut -d'|' -f6 <<< $i)'":"'$(cut -d'|' -f7 <<< $i)'",'$dataTypeJson'},'
	  	fi
	 fi
	 ctr=$((ctr+1))
done
#END: Construct JSON for all non-repeating parameters
#echo "rowCuts: "$rowCuts
#echo "colCuts: "$colCuts
#echo "ROW CONFIG JSON: "$rowConfigJson
#echo "COL CONFIG JSON: "$colConfigJson

#BEGIN: Construct JSON for data layers
matrixJson='"matrix_files": [ '
inputMatrix=''
for i in "$@"; do
	currParm=$(cut -d'|' -f1 <<< $i)
	if [ $currParm = "matrix_files" ]
	then
		#Parse pipe-delimited parameter parameter
		matrixJson=$matrixJson' {"'$(cut -d'|' -f2 <<< $i)'":"'$(cut -d'|' -f3 <<< $i)'","'$(cut -d'|' -f4 <<< $i)'":"'$(cut -d'|' -f5 <<< $i)'","'$(cut -d'|' -f6 <<< $i)'":"'$(cut -d'|' -f7 <<< $i)'"}'
		inputMatrix=$(cut -d'|' -f3 <<< $i)
  	fi
done
matrixJson=$matrixJson"],"
#END: Construct JSON for data layers

#BEGIN: Construct JSON for classification files
classJson='"classification_files": [ '
classIter=0
for i in "$@"; do
	currParm=$(cut -d'|' -f1 <<< $i)
	if [ $currParm = "classification" ]
	then
		classIter=$((classIter+1))
		#Parse pipe-delimited 3-part classification bar parameter
		classJson=$classJson' {"'$(cut -d'|' -f2 <<< $i)'":"'$(cut -d'|' -f3 <<< $i)'","'$(cut -d'|' -f4 <<< $i)'":"'$(cut -d'|' -f5 <<< $i)'"'
		classCat=$(cut -d'|' -f7 <<< $i)
		classColorType=$(cut -d'_' -f2 <<< $classCat)
		classJson=$classJson','
		classJson=$classJson' "position":"'$(cut -d'_' -f1 <<< $classCat)'","color_map": {"type":"'$classColorType'"}}'
		if [ $classIter -lt $classSize ]		
		then
			classJson=$classJson','
		fi
  	fi
done
classJson=$classJson']'
#END: Construct JSON for classification files

parmJson=$parmJson$matrixJson$rowConfigJson$colConfigJson$classJson
parmJson=$parmJson'}'
#echo "HEATMAP PARAMETERS JSON: "$parmJson	

#run R to cluster matrix
output="$(R --slave --vanilla --file=$tooldir/CHM.R --args $inputMatrix $rowOrder $rowDistance $rowAgglomeration $colOrder $colDistance $colAgglomeration $rowOrderFile $colOrderFile $rowDendroFile $colDendroFile $rowCuts $colCuts $rowLabels $colLabels 2>&1)"
rc=$?;
if [ $rc != 0 ]
then
  echo $output;
  if [ `echo "$output" | grep -c "Inf in foreign function call"` -gt 0 ]
  then
    echo "";
    echo "Note: This error can occur when there is no variation in a row or column.  Try a different distance measure or remove rows/columns without variation.";
    echo "This error may also be caused when a covariate file has inadvertently been selected as an Input Matrix.  Check your Input Matrix entry.";
  fi
  exit $rc;
fi
#call java program to generate NGCHM viewer files.
java -jar $tooldir/GalaxyMapGen.jar "$parmJson"
#clean up tempdir
rm -rf $tdir

find .  -name *.png -exec cp {} . \;
find . -type d -name $heatmapName -exec rm -r "{}" \;
find . -type d -empty -delete
