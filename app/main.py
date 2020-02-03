import os
import uuid
from subprocess import PIPE, run, Popen, STDOUT
import sys
import sqlite3
from multiprocessing import Process
from shutil import copy2
import glob
import time
from flask import Flask, send_file, request, redirect, jsonify
from werkzeug.utils import secure_filename
import tables as tb
import numpy as np
import pandas as pd
from scipy.stats import mannwhitneyu
import scipy.cluster.hierarchy as shc
from scipy.spatial import distance
app = Flask(__name__)

WORK_FOLDER = os.getenv("WORK_FOLDER")+"/app/"
PROJECT_FOLDER = os.getenv("WORK_FOLDER")+"/testProject/"
if not os.path.exists(PROJECT_FOLDER):
    os.makedirs(PROJECT_FOLDER)
# os.chdir(PROJECT_FOLDER+"test2k")
# os.chdir(WORK_FOLDER+"VT46e0d8d3d2a24f9baf434d5e91be2225")

ALLOWED_EXTENSIONS = set(['txt', 'vcf'])
dbSNP_map = {}
samples_map = {}

# app.config['WORK_FOLDER'] = WORK_FOLDER
print("start")


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/showNGCHM/<projectID>', methods=['GET'])
def show_NGCHM(projectID):
    if not dbSNP_map:
        prepare_dbSNP_annotation(projectID)

    projectFolder=PROJECT_FOLDER+projectID
    if os.path.exists(projectFolder+"/fake.ngchm"):
        os.remove(projectFolder+"/fake.ngchm")
    if os.path.exists(projectFolder+"/fake_genotype.tsv"):
        os.remove(projectFolder+"/fake_genotype.tsv")
    chr = request.args.get('chr', None, type=None)
    name = request.args.get('name', None, type=None)
    reorder = request.args.get('reorder', None, type=None)
    heatmapName = "chr"+chr+"_"+name
   
    heatmapName = heatmapName+"_"+reorder
    print("showNGCHM", chr, name, heatmapName, reorder)
    if os.path.exists(projectFolder+"/cache/"+heatmapName+".ngchm"):
        return "cache exists", 200
    HDFfileNames = glob.glob(projectFolder+"/tmp*_genotypes_multi_genes.h5")
    HDFfileNames = sorted(HDFfileNames, key=lambda name: int(name.split("/")[-1].split("_")[1]))
    allGenotype = []
    allColnames = []

    try:
        for filePath in HDFfileNames:
            print(filePath)
            file = tb.open_file(filePath)
            node = file.get_node("/chr"+chr+"/"+name+"/")
            genotype = node.GT[:]
            rownames = node.rownames[:]
            rownames = get_dbSNP_annotation(rownames)
            whereNaN = np.isnan(genotype)
            genotype[whereNaN] = -1
            genotype = genotype.astype(int)
            if (len(allGenotype) == 0):
                allGenotype = genotype
            else:
                allGenotype = np.append(allGenotype, genotype, 1)
            # numCols = len(node.GT[:][0])
            # colnames = []
            # for num in range(1, numCols+1):
            #     colnames.append("col"+str(num))
            colnode = file.get_node("/chr"+chr+"/colnames/")
            colnames = colnode[:]
            allColnames.extend(colnames)
            file.close()

        # allColnames = get_column_names(allColnames)
        allGenotype = pd.DataFrame(allGenotype, columns=allColnames, index=rownames)
        
        if reorder == "reorderBoth":
            return reorder_genotype(projectID,allGenotype, heatmapName)
        elif reorder == "Original":
            allGenotype.to_csv(projectFolder+"/fake_genotype.tsv", sep="\t")
            command = '{}/mda_heatmap_gen/heatmap.sh {}/mda_heatmap_gen /Users/jma7/Development/vtools_website/testData/ chm_name|{} chm_description|validateTool matrix_files|path|{}|name|datalayer|summary_method|sample row_configuration|order_method|Hierarchical|distance_metric|manhattan|agglomeration_method|ward.D|tree_covar_cuts|0|data_type|labels col_configuration|order_method|Hierarchical|distance_metric|manhattan|agglomeration_method|ward.D|tree_covar_cuts|0|data_type|labels classification|name|disease|path|{}|category|column_discrete output_location|{}'.format(
                WORK_FOLDER+"", WORK_FOLDER,heatmapName, projectFolder+"/fake_genotype.tsv", projectFolder+"/disease.tsv", projectFolder+"/cache/"+heatmapName+".ngchm")
            print(command)
            return runCommand(command)
        elif reorder == "reorderCol1":
            return reorder_col1(projectID, allGenotype, heatmapName)
        elif reorder == "reorderCol2":
            return reorder_col2(projectID, allGenotype, heatmapName)
    except tb.exceptions.NoSuchNodeError:
        print("No such node")
        return "No such node", 500


def prepare_dbSNP_annotation(projectID):
    print("prepare dbSNP")
    annotationFile = PROJECT_FOLDER+projectID+"/dbSNP_annotation.tsv"
    with open(annotationFile, "r") as lines:
        for line in lines:
            cols = line.strip().split("\t")
            if cols[5] != ".":
                dbSNP_map[cols[0].strip()] = cols[5]
            else:
                dbSNP_map[cols[0].strip()] = "chr"+cols[1].strip()+"_"+cols[2]
    print("done with dbSNP")


def get_dbSNP_annotation(rownames):
    return [dbSNP_map[str(rowname)] for rowname in rownames]


def create_connection(db_file):
    conn = None
    try:
        conn = sqlite3.connect(db_file)
    except sqlite3.Error:
        print("error")
    return conn


def prepare_column_names(conn):
    cur = conn.cursor()
    cur.execute("SELECT sample_id,sample_name FROM sample")
    rows = cur.fetchall()
    for row in rows:
        samples_map[row[0]] = row[1]


def get_column_names(colnames):
    return [samples_map[colname] for colname in colnames]



def get_CovariateMap(projectID):
    covariateMap = {}
    projectFolder = PROJECT_FOLDER+projectID
    with open(projectFolder+"/disease.tsv", "r") as lines:
        for line in lines:
            cols = line.strip().split("\t")
            if cols[1] not in covariateMap:
                covariateMap[cols[1]] = []
            else:
                covariateMap[cols[1]].append(cols[0])
    return covariateMap

def reorder_genotype(projectID,allGenotype, heatmapName):
    projectFolder=PROJECT_FOLDER+projectID
    covariateMap=get_CovariateMap(projectID)
    reordered_rows = reorder_rows(allGenotype, covariateMap)
    reordered_cols = reorder_columns(allGenotype, covariateMap)
    reordered_genotype = allGenotype.iloc[reordered_rows, :]
    reordered_genotype = allGenotype.loc[:, reordered_cols]
    reordered_genotype.to_csv(projectFolder+"/fake_genotype.tsv", sep="\t")
    
    command = '{}/mda_heatmap_gen/heatmap.sh {}/mda_heatmap_gen /Users/jma7/Development/vtools_website/testData/ chm_name|{} chm_description|validateTool matrix_files|path|{}|name|datalayer|summary_method|sample row_configuration|order_method|Original|distance_metric|manhattan|agglomeration_method|ward.D|tree_covar_cuts|0|data_type|labels col_configuration|order_method|Original|distance_metric|manhattan|agglomeration_method|ward.D|tree_covar_cuts|0|data_type|labels classification|name|disease|path|{}|category|column_discrete output_location|{}'.format(
        WORK_FOLDER,WORK_FOLDER,heatmapName, projectFolder+"/fake_genotype.tsv", projectFolder+"/disease.tsv",projectFolder+"/cache/"+heatmapName+".ngchm")
    print(command)
    return runCommand(command)


def reorder_col1(projectID, allGenotype, heatmapName):
    projectFolder = PROJECT_FOLDER+projectID
    covariateMap = get_CovariateMap(projectID)
    reordered_cols = reorder_columns(allGenotype, covariateMap)
    reordered_genotype = allGenotype.loc[:, reordered_cols]
    reordered_genotype.to_csv(projectFolder+"/fake_genotype.tsv", sep="\t")
    command = '{}/mda_heatmap_gen/heatmap.sh {}/mda_heatmap_gen /Users/jma7/Development/vtools_website/testData/ chm_name|{} chm_description|validateTool matrix_files|path|{}|name|datalayer|summary_method|sample row_configuration|order_method|Hierarchical|distance_metric|manhattan|agglomeration_method|ward.D|tree_covar_cuts|0|data_type|labels col_configuration|order_method|Original|distance_metric|manhattan|agglomeration_method|ward.D|tree_covar_cuts|0|data_type|labels classification|name|disease|path|{}|category|column_discrete output_location|{}'.format(
        WORK_FOLDER, WORK_FOLDER, heatmapName, projectFolder+"/fake_genotype.tsv", projectFolder+"/disease.tsv", projectFolder+"/cache/"+heatmapName+".ngchm")
    print(command)
    return runCommand(command)


def reorder_col2(projectID, allGenotype, heatmapName):
    projectFolder = PROJECT_FOLDER+projectID
    covariateMap = get_CovariateMap(projectID)
    reordered_cols = reorder_columns_hiera(allGenotype, covariateMap)
    reordered_genotype = allGenotype.loc[:, reordered_cols]
    reordered_genotype.to_csv(projectFolder+"/fake_genotype.tsv", sep="\t")
    command = '{}/mda_heatmap_gen/heatmap.sh {}/mda_heatmap_gen /Users/jma7/Development/vtools_website/testData/ chm_name|{} chm_description|validateTool matrix_files|path|{}|name|datalayer|summary_method|sample row_configuration|order_method|Hierarchical|distance_metric|manhattan|agglomeration_method|ward.D|tree_covar_cuts|0|data_type|labels col_configuration|order_method|Original|distance_metric|manhattan|agglomeration_method|ward.D|tree_covar_cuts|0|data_type|labels classification|name|disease|path|{}|category|column_discrete output_location|{}'.format(
        WORK_FOLDER, WORK_FOLDER, heatmapName, projectFolder+"/fake_genotype.tsv", projectFolder+"/disease.tsv", projectFolder+"/cache/"+heatmapName+".ngchm")
    print(command)
    return runCommand(command)

def reorder_columns(allGenotype, covariateMap):
    reordered_columns = []
    for key, value in covariateMap.items():
        values = [int(x) for x in value]
        allFilter = allGenotype[values].applymap(lambda x: x > 0)
        colSum = allFilter.sum(axis=0).sort_values(ascending=False)
        colSum = colSum[colSum > 0]
        reordered_columns.extend(colSum.index)
    return reordered_columns


def reorder_columns_hiera(allGenotype, covariateMap):
    reordered_columns = []
    for key, value in covariateMap.items():
        values = [int(x) for x in value]
        allFilter = allGenotype[values].applymap(lambda x: x > 0)
        print(allFilter.shape)
        allFilter = allFilter.transpose()
        dend = shc.dendrogram(shc.linkage(distance.pdist(
            allFilter, 'cityblock'), method='single'), no_plot=True)
        reordered_columns.extend(allFilter.index[dend["leaves"]])
    return reordered_columns



def reorder_rows(allGenotype, covariateMap):
    keys = list(covariateMap.keys())
    values1 = [int(x) for x in covariateMap[keys[0]]]
    genotype1 = allGenotype[values1]
    values2 = [int(x) for x in covariateMap[keys[1]]]
    genotype2 = allGenotype[values2]
    pvalues = []
    for rowIndex in range(allGenotype.shape[0]):
        stat, p = mannwhitneyu(genotype1.iloc[rowIndex], genotype2.iloc[rowIndex])
        pvalues.append((rowIndex, p))
    pvalues.sort(key=lambda x: x[1])
    reordered_rows = [pvalue[0] for pvalue in pvalues]
    return reordered_rows


@app.route("/ngchmView/<projectID>/<heatmapName>", methods=['GET'])
def download_ngchm(projectID,heatmapName):
    print("donwload NGCHM")
    path = PROJECT_FOLDER+projectID+"/cache/{}.ngchm".format(heatmapName)
    return send_file(path)


@app.route('/loadSampleData/<projectID>', methods=['GET'])
def load_sampleData(projectID):
    if request.method == "GET":
        fileType = request.args.get('fileType', None, type=None)
        print(PROJECT_FOLDER+"/10k_test_2k.vcf")
        if fileType == "data" and os.path.exists(PROJECT_FOLDER+"/10k_test_2k.vcf"):
            src = os.path.realpath(PROJECT_FOLDER+"/10k_test_2k.vcf")
            print("copy ",src)
            copy2(src, PROJECT_FOLDER+projectID+"/")
        elif fileType == "pheno" and os.path.exists("../simulated.tsv"):
            src = os.path.realpath("../simulated.tsv")
            copy2(src, PROJECT_FOLDER+projectID+"/")

        return "copy file", 200


@app.route('/project', methods=['POST'])
def create_project():
    if request.method == 'POST':
        projectID = uuid.uuid4().hex
        projectID = "VT"+projectID
        directory = PROJECT_FOLDER+projectID
        print(directory)
        if not os.path.exists(directory):
            os.makedirs(directory)
        os.chdir(directory)
        command = "vtools init "+projectID+" -f"
        result = run(command.split(" "), stdout=PIPE, stderr=PIPE, universal_newlines=True)
        if "ERROR" in result.stderr:
            return "Internal error", 500
        else:
            return projectID, 200


@app.route('/project/<projectID>', methods=['GET'])
def get_project(projectID):
    if request.method == "GET":
        directory = PROJECT_FOLDER+projectID
        print(directory)
        if not os.path.exists(directory):
            return "project doesn't exist", 200
        else:
            os.chdir(directory)
            vcfFiles = glob.glob(directory+"/*.vcf")
            if len(vcfFiles)==0:
                return "empty", 200
            else:
                return os.path.basename(vcfFiles[0]), 200


@app.route('/logs/<projectID>', methods=['POST', 'GET'])
def logs(projectID):
    logfile = PROJECT_FOLDER+projectID+"/"+projectID+"_log.txt"
    if request.method == "POST":
        log = request.form["log"]
        with open(logfile, "a+") as f:
            f.write(log+"\n")
        return "log added", 200
    if request.method == "GET":
        while not os.path.exists(logfile):
            return "log file doesn't exist", 200
        f = open(logfile, "r")
        data = f.readlines()
        f.close()
        return ("\n").join(data), 200


@app.route('/fileInfo/<projectID>', methods=['GET'])
def get_fileInfo(projectID):
    varFields = []
    genoFields = []
    genoExists = []
    varExists = []
    firstLine = ""
    if request.method == 'GET':
        fileName = request.args.get('fileName', None, type=None)
        if fileName != "":
            with open(PROJECT_FOLDER+projectID+"/"+fileName, "r") as lines:
                for line in lines:
                    if line.startswith("#"):
                        if "##INFO=<ID=" in line:
                            varFields.append(line.split(",")[0].replace("##INFO=<ID=", ""))
                        elif "##FORMAT=<ID=" in line:
                            genoFields.append(line.split(",")[0].replace("##FORMAT=<ID=", ""))
                    else:
                        firstLine = line
                        break
            cols = firstLine.split("\t")
            for var in varFields:
                if var in cols[7]:
                    varExists.append(var)
            for geno in genoFields:
                if geno in cols[8]:
                    genoExists.append(geno)
            return jsonify({"genoFields": genoExists, "varFields": varExists}), 200
        else:
            return "file name is empty", 500


@app.route('/data/<projectID>', methods=['POST'])
def upload_file(projectID):
    if request.method == 'POST':
        f = request.files['datafile']
        f.save(os.path.join(PROJECT_FOLDER+projectID, secure_filename(f.filename)))
    return 'uploaded', 204


@app.route('/import/<projectID>', methods=['GET'])
def vtools_import(projectID):
    fileName = request.args.get('fileName', None, type=None)
    genomeVersion = request.args.get("genomeVersion", None, type=None)
    import_process = Process(target=run_vtools_import, args=(projectID, fileName, genomeVersion))
    import_process.start()
    return "import running", 200


def run_vtools_import(projectID, fileName, genomeVersion):
    command = "vtools import "+PROJECT_FOLDER+projectID+"/"+fileName+" --build " + genomeVersion+" -f"
    os.chdir(PROJECT_FOLDER+projectID)
    with open(PROJECT_FOLDER+projectID+"/import_log.txt", "a+") as output:
        Popen(command.split(" "), stdout=output, stderr=output, universal_newlines=True)


@app.route('/check/import/<projectID>', methods=['GET'])
def checkImportProgress(projectID):
    last = ""
    logfile = PROJECT_FOLDER+projectID+"/import_log.txt"

    if os.path.exists(logfile) and os.path.getsize(logfile) > 100:
        with open(logfile, "rb") as f:
            f.seek(-2, os.SEEK_END)     # Jump to the second last byte.
            while f.read(1) != b"\r":   # Until EOL is found...
                try:
                    f.seek(-2, os.SEEK_CUR)   # ...jump back the read byte plus one more.
                except OSError:
                    f.seek(0, 0)
                    break
            last = f.readline()
        if b"Importing genotypes" in last:
            return last, 200
        else:
            return "Preparing", 200
    else:
        return "Preparing", 200


@app.route('/phenotype/<projectID>', methods=['POST', 'PUT'])
def upload_phenotype(projectID):
    if request.method == 'POST':
        f = request.files['phenofile']
        print(os.path.join(PROJECT_FOLDER+projectID, secure_filename(f.filename)))
        f.save(os.path.join(PROJECT_FOLDER+projectID, secure_filename(f.filename)))
        return 'upload', 204
    elif request.method == 'PUT':
        fileName = request.get_data().decode("utf-8")
        print(PROJECT_FOLDER+projectID+"/"+fileName)
        command = "vtools phenotype --from_file " + \
            PROJECT_FOLDER+projectID + "/" + fileName
        return runCommand(command)


def runCommand(command):
    commandCols = []
    for col in command.split():
        # if "-" in col:
        #     col=(" ").join(col.split("-"))
        commandCols.append(col)
    print(commandCols)
    result = run(commandCols, stdout=PIPE, stderr=PIPE, universal_newlines=True)
    print("stderr "+result.stderr)
    print("stdout "+result.stdout)
    if "ERROR" in result.stderr:
        return "Internal error", 500
    else:
        if result.stdout == "":
            return result.stderr, 200
        else:
            return result.stdout, 200


@app.route('/output', methods=['GET'])
def vtools_output():
    outputTable = request.args.get("outputTable", None, type=None)
    outputTableFields = request.args.get("outputTableFields", None, type=None)
    # outputAnno=request.args.get("outputAnno",None,type=None)
    outputAnnoFields = request.args.get("outputAnnoFields", None, type=None)
    command = "vtools output "+outputTable+" "
    if len(outputTableFields) > 0:
        command += outputTableFields
    if len(outputAnnoFields) > 0:
        command += " "+outputAnnoFields
    command += " --limit 20 --header"
    return runCommand(command)


@app.route("/use", methods=['POST'])
def vtools_use():
    option = request.form["option"]
    command = "vtools use "+option
    return runCommand(command)


@app.route("/select", methods=['POST'])
def vtools_select():
    condition = request.form["condition"]
    newTable = request.form["tableName"]
    command = "vtools select "+condition+" -t "+newTable
    return runCommand(command)


@app.route("/update", methods=['POST'])
def vtools_update():
    table = request.form["table"]
    method = request.form["method"]
    command = "vtools update "+table
    if method == "fromFile":
        fromFile = request.form["fileName"]
        selectedGeno = request.form["selectedGeno"]
        selectedVar = request.form["selectedVar"]
        if fromFile != "":
            command += " --from_file "+fromFile
        if len(selectedGeno) > 0:
            command += " --geno_info "+selectedGeno
        if len(selectedVar) > 0:
            command += " --var_info "+selectedVar
    elif method == "fromStat":
        stat = request.form["stat"]
        if stat != "":
            command += " --from_stat "+stat
    print(command)
    return runCommand(command)


@app.route("/runAssociation/<projectID>", methods=['POST'])
def vtools_associate(projectID):
    table = request.form["table"]
    phenotype = request.form["phenotype"]
    method = request.form["method"]
    discard = request.form["discard"]
    groupby = request.form["groupby"]
    print(table, phenotype, method, discard, groupby)

    associate_process = Process(target=run_vtools_associate, args=(projectID, table, phenotype, method, groupby))
    associate_process.start()
    return "associate running", 200
    # command="vtools associate "+table+" "+phenotype+" --method "+method+" --group_by "+groupby+" --to_db test.DB -f -j 8 -v 2" 
    # print(command)
    # result = run(command.split(" "), stdout=PIPE, stderr=PIPE, universal_newlines=True)


@app.route("/associationResult/<projectID>", methods=['GET'])
def get_AssociationResult(projectID):
    resultfile = PROJECT_FOLDER+projectID+"/associate_result.txt"
    starttime = time.time()
    while not os.path.exists(resultfile) and time.time()-starttime < 5:
        time.sleep(2)
    if os.path.exists(resultfile):
        f = open(resultfile, "r")
        data = f.readlines()
        f.close()
        return ("\n").join(data), 200
    else:
        return "Association result is not available.", 200


def run_vtools_associate(projectID, table, phenotype, method, groupby):
    command = "vtools associate "+table+" "+phenotype+" --method "+method+" --group_by "+groupby+" --to_db association_result.DB -f -j 8 -v 1" 
    logfile = PROJECT_FOLDER+projectID+"/associate_log.txt"
    resultfile = PROJECT_FOLDER+projectID+"/associate_result.txt"
    if os.path.exists(logfile):
        os.remove(logfile)
    if os.path.exists(resultfile):
        os.remove(resultfile)
    print(command)

    # with open (app.config['WORK_FOLDER']+"testProject/"+projectID+"/associate_log.txt","a+") as output:
    #     run(command.split(" "),  stderr=output, universal_newlines=True,check=True)

    # result = run(command.split(" "), stdout=PIPE, stderr=PIPE, universal_newlines=True)
    # print("stderr",result.stderr)
    # print("stdout",result.stdout)
    result = Popen(command.split(" "), stdout=PIPE, stderr=PIPE, universal_newlines=True)
    tee = Popen(['tee', logfile], stdin=result.stderr)
    tee.communicate()
    tee2 = Popen(['tee', resultfile], stdin=result.stdout)
    tee2.communicate()


@app.route('/check/associate/<projectID>', methods=['GET'])
def checkAssociateProgress(projectID):
    last = ""
    logfile = PROJECT_FOLDER+projectID+"/associate_log.txt"

    if os.path.exists(logfile) and os.path.getsize(logfile) > 5:
        with open(logfile, "rb") as f:
            f.seek(-2, os.SEEK_END)     # Jump to the second last byte.
            while f.read(1) != b"\r":   # Until EOL is found...
                try:
                    f.seek(-2, os.SEEK_CUR)  # ...jump back the read byte plus one more.
                except OSError:
                    f.seek(0, 0)
                    break
            last = f.readline()
        if b"Testing for association" in last:
            return last, 200
        else:
            return "Preparing", 200
    else:
        return "preparing", 200


@app.route("/show", methods=['GET'])
def vtools_show():
    option = request.args.get("option", None, type=None)
    command = "vtools show "+option
    if option == "show":
        command = "vtools show"
    elif option == "anotations -v0":
        command = "vtools show annotations -v0 "
    elif option == "genotypes":
        command = "vtools show genotypes -l 10"
    elif option == "tables":
        command = "vtools show tables"
    elif option == "fields":
        command = "vtools show fields -l 10"    
    result = run(command.split(" "), stdout=PIPE, stderr=PIPE, universal_newlines=True)
    # print(result.returncode)
    # print("stdout", result.stdout)
    # print("stderr", result.stderr)
    if "ERROR" in result.stderr:
        return "Internal error", 500
    else:
        return result.stdout, 200


@app.route("/hello")
def hello():
    return "Hello World from Flask in a uWSGI Nginx Docker container with \
     Python 3.7 (from the example template)"


@app.route("/")
def main():
    index_path = os.path.join(app.static_folder, 'index.html')
    return send_file(index_path)


# Everything not declared before (not a Flask route / API endpoint)...
@app.route('/<path:path>')
def route_frontend(path):
    # ...could be a static file needed by the front end that
    # doesn't use the `static` path (like in `<script src="bundle.js">`)
    file_path = os.path.join(app.static_folder, path)
    if os.path.isfile(file_path):
        return send_file(file_path)
    # ...or should be handled by the SPA's "router" in front end
    else:
        index_path = os.path.join(app.static_folder, 'index.html')
        return send_file(index_path)


if __name__ == "__main__":
    # Only for debugging while developing
   
    app.run(host='0.0.0.0', debug=True, port=80)
