import os
# from subprocess import PIPE, run, Popen, STDOUT
import sys
# from multiprocessing import Process
import glob
import uuid
import time
from flask import Flask, send_file, request, redirect, jsonify, url_for, render_template
from werkzeug.utils import secure_filename

import associationResultAccess as associationResultAccess
import vtoolsCommandAccess as vtoolsCommandAccess


app = Flask(__name__)

WORK_FOLDER = os.getenv("WORK_FOLDER")+"/app/"
PROJECT_FOLDER = os.getenv("PROJECT_FOLDER")
if not os.path.exists(PROJECT_FOLDER):
    os.makedirs(PROJECT_FOLDER)


ALLOWED_EXTENSIONS = set(['txt', 'vcf'])


# app.config['WORK_FOLDER'] = WORK_FOLDER
print("start")


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/showVariants/<projectID>/<associationDB>',methods=['GET'])
def show_Variants(projectID,associationDB):
    chr = request.args.get('chr', None, type=None)
    name = request.args.get('name', None, type=None)
    covariate = associationDB.split("_")[2]

    
    detail, chr = associationResultAccess.get_variants_summary(projectID, chr,name,covariate)
    if detail is None:
        return "No such gene", 200
    else: 
        pvalue = associationResultAccess.get_gene_pvalue(projectID, name, associationDB)
        return jsonify({"data":detail.to_string(index=False),"pvalue":str(pvalue),"chr":str(chr),"covariate":covariate}),200


@app.route('/showNGCHM/<projectID>/<associationDB>', methods=['GET'])
def show_NGCHM(projectID,associationDB):
    projectFolder=PROJECT_FOLDER+projectID
    chr = request.args.get('chr', None, type=None)
    name = request.args.get('name', None, type=None)
    reorder = request.args.get('reorder', None, type=None)
    heatmapName = "chr"+chr+"_"+name
    heatmapName = heatmapName+"_"+reorder
    print("showNGCHM", chr, name, heatmapName, reorder)
    if not os.path.exists(projectFolder+"/cache/"):
        os.makedirs(projectFolder+"/cache/")
    if os.path.exists(projectFolder+"/cache/"+heatmapName+".ngchm"):
        return "cache exists", 200
    covariate = associationDB.split("_")[2]

    return associationResultAccess.drawHeatmap(projectID, chr, name, reorder, covariate, heatmapName)



@app.route('/getPvalue/<projectID>/<associationDB>', methods=['GET'])
def get_pvalue(projectID,associationDB):
    output = associationResultAccess.get_AssociationResult(projectID,associationDB)
    return output, 200



@app.route("/ngchmView/<projectID>/<heatmapName>", methods=['GET'])
def download_ngchm(projectID,heatmapName):
    print("donwload NGCHM")
    path = PROJECT_FOLDER+projectID+"/cache/{}.ngchm".format(heatmapName)
    return send_file(path)


@app.route('/loadSampleData/<projectID>', methods=['GET'])
def load_sampleData(projectID):
    if request.method == "GET":
        fileType = request.args.get('fileType', None, type=None)
        return vtoolsCommandAccess.load_sampleData(projectID, fileType)


@app.route('/project', methods=['POST'])
def create_project():
    if request.method == 'POST':
        projectID = "VT"+uuid.uuid4().hex
        return vtoolsCommandAccess.vtools_create(projectID)
        

@app.route('/project/<projectID>', methods=['GET'])
def get_project(projectID):
    if request.method == "GET":
        directory = PROJECT_FOLDER+projectID
        if not os.path.exists(directory):
            return "project doesn't exist", 500
        else:
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
        f = request.files['file']
        # f = request.files['datafile']
        f.save(os.path.join(PROJECT_FOLDER+projectID, secure_filename(f.filename)))
    return 'uploaded', 204


@app.route('/import/<projectID>', methods=['GET'])
def vtools_import(projectID):
    if request.method == 'GET':
        fileName = request.args.get('fileName', None, type=None)
        genomeVersion = request.args.get("genomeVersion", None, type=None)

        vtoolsCommandAccess.vtools_import(projectID, fileName,genomeVersion)
        return "import running", 200



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
            return "Running", 200
    else:
        return "Running", 200


@app.route('/phenotype/<projectID>', methods=['POST', 'PUT'])
def add_phenotype(projectID):
    if request.method == 'POST':
        phenoFile = request.form['fileName']
        print(phenoFile)
        phenotype_fileName = os.path.join(
            PROJECT_FOLDER+projectID, secure_filename(phenoFile))      
        return vtoolsCommandAccess.vtools_phenotype(projectID,phenotype_fileName)
        



@app.route('/output/<projectID>', methods=['GET'])
def vtools_output(projectID):
    if request.method == 'GET':
        outputTable = request.args.get("outputTable", None, type=None)
        outputTableFields = request.args.get("outputTableFields", None, type=None)
        outputAnnoFields = request.args.get("outputAnnoFields", None, type=None)

        return vtoolsCommandAccess.vtools_output(projectID,outputTable, outputTableFields, outputAnnoFields)


@app.route("/use/<projectID>", methods=['POST'])
def vtools_use(projectID):
    if request.method == 'POST':
        option = request.form["option"]

        return vtoolsCommandAccess.vtools_use(projectID, option)
    


@app.route("/select/<projectID>", methods=['POST'])
def vtools_select(projectID):
    if request.method == 'POST':
        condition = request.form["condition"]
        newTable = request.form["tableName"]

        return vtoolsCommandAccess.vtools_select(projectID, condition, newTable)
        


@app.route("/update/<projectID>", methods=['POST'])
def vtools_update(projectID):
    if request.method == 'POST':
        table = request.form["table"]
        method = request.form["method"]
        return vtoolsCommandAccess.vtools_update(projectID, request, method, table)


@app.route("/runAssociation/<projectID>", methods=['POST'])
def vtools_associate(projectID):
    if request.method == 'POST':
        table = request.form["table"]
        phenotype = request.form["phenotype"]
        method = request.form["method"]
        discard = request.form["discard"]
        groupby = request.form["groupby"]
        print(table, phenotype, method, discard, groupby)
        
        commandAccess = vtoolsCommandAccess.vtools_association(projectID, table, phenotype, method, groupby)
        return "associate running", 200



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
            return "Running", 200
    else:
        return "Running", 200


@app.route('/associationDBs/<projectID>', methods=['GET'])
def checkAssociationDBs(projectID):
    DBfiles=[]
    for file in glob.glob(PROJECT_FOLDER+projectID+"/association*.DB"):
        DBfiles.append(file)
    print(DBfiles)
    return jsonify({"DBs": DBfiles}), 200



@app.route("/show/<projectID>", methods=['GET'])
def vtools_show(projectID):
    if request.method == 'GET':
        option = request.args.get("option", None, type=None)
        return vtoolsCommandAccess.vtools_show(projectID, option)
    



@app.route("/hello")
def hello():
    return "Hello World from Flask in a uWSGI Nginx Docker container with \
     Python 3.7 (from the example template)"


@app.route("/")
def main():
    # index_path = os.path.join(app.static_folder, 'index.html')
    # return send_file(index_path)
    return render_template("index.html")


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
        return render_template("index.html")


if __name__ == "__main__":
    # Only for debugging while developing
    app.run(host='0.0.0.0', debug=True, port=80)
