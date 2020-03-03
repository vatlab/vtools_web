import os
# from subprocess import PIPE, run, Popen, STDOUT
import sys
# from multiprocessing import Process
import glob
import time
from flask import Flask, send_file, request, redirect, jsonify, url_for, render_template
from werkzeug.utils import secure_filename

from associationResultAccess import associationResultAccess
from vtoolsCommandAccess import vtoolsCommandAccess


app = Flask(__name__)

WORK_FOLDER = os.getenv("WORK_FOLDER")+"/app/"
PROJECT_FOLDER = os.getenv("WORK_FOLDER")+"/testProject/"
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

    VTAccess = associationResultAccess.getVTResultAccess(projectID)
    detail = VTAccess.get_variants_summary(chr,name,covariate)
    pvalue = VTAccess.get_gene_pvalue(name, associationDB)
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

    VTAccess = associationResultAccess.getVTResultAccess(projectID)
    return VTAccess.drawHeatmap(chr, name, reorder, covariate, heatmapName)



@app.route('/getPvalue/<projectID>/<associationDB>', methods=['GET'])
def get_pvalue(projectID,associationDB):
    VTAccess = associationResultAccess.getVTResultAccess(projectID)
    output = VTAccess.get_AssociationResult(associationDB)
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
        commandAccess = vtoolsCommandAccess.getVTCommandAccess()
        return commandAccess.load_sampleData(fileType)


@app.route('/project', methods=['POST'])
def create_project():
    if request.method == 'POST':
        commandAccess=vtoolsCommandAccess.getVTCommandAccess()
        return commandAccess.vtools_create()
        

@app.route('/project/<projectID>', methods=['GET'])
def get_project(projectID):
    if request.method == "GET":
        directory = PROJECT_FOLDER+projectID
        if not os.path.exists(directory):
            return "project doesn't exist", 500
        else:
            vtoolsCommandAccess.getExistingVTCommandAccess(projectID)
            vcfFiles = glob.glob(PROJECT_FOLDER+projectID+"/*.vcf")
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


@app.route('/import', methods=['GET'])
def vtools_import():
    if request.method == 'GET':
        fileName = request.args.get('fileName', None, type=None)
        genomeVersion = request.args.get("genomeVersion", None, type=None)

        commandAccess=vtoolsCommandAccess.getVTCommandAccess()
        commandAccess.vtools_import(fileName,genomeVersion)
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


@app.route('/phenotype', methods=['POST', 'PUT'])
def upload_phenotype():
    if request.method == 'POST':
        phenoFile = request.files['datafile']
        phenotype_fileName = os.path.join(
            PROJECT_FOLDER+projectID, secure_filename(phenoFile.filename))
        phenoFile.save(phenotype_fileName)
        
        commandAccess = vtoolsCommandAccess.getVTCommandAccess()
        return commandAccess.vtools_phenotype(phenotype_fileName)
        



@app.route('/output', methods=['GET'])
def vtools_output():
    if request.method == 'GET':
        outputTable = request.args.get("outputTable", None, type=None)
        outputTableFields = request.args.get("outputTableFields", None, type=None)
        outputAnnoFields = request.args.get("outputAnnoFields", None, type=None)

        commandAccess = vtoolsCommandAccess.getVTCommandAccess()
        return commandAccess.vtools_output(outputTable, outputTableFields, outputAnnoFields)


@app.route("/use", methods=['POST'])
def vtools_use():
    if request.method == 'POST':
        option = request.form["option"]

        commandAccess = vtoolsCommandAccess.getVTCommandAccess()
        return commandAccess.vtools_use(option)
    


@app.route("/select", methods=['POST'])
def vtools_select():
    if request.method == 'POST':
        condition = request.form["condition"]
        newTable = request.form["tableName"]

        commandAccess = vtoolsCommandAccess.getVTCommandAccess()
        return commandAccess.vtools_select(condition, newTable)
        


@app.route("/update", methods=['POST'])
def vtools_update():
    if request.method == 'POST':
        table = request.form["table"]
        method = request.form["method"]
        commandAccess = vtoolsCommandAccess.getVTCommandAccess()
        return commandAccess.vtools_update(request, method, table)


@app.route("/runAssociation", methods=['POST'])
def vtools_associate():
    if request.method == 'POST':
        table = request.form["table"]
        phenotype = request.form["phenotype"]
        method = request.form["method"]
        discard = request.form["discard"]
        groupby = request.form["groupby"]
        print(table, phenotype, method, discard, groupby)
        
        commandAccess = vtoolsCommandAccess.getVTCommandAccess()
        commandAccess.vtools_association(table, phenotype, method, groupby)
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



@app.route("/show", methods=['GET'])
def vtools_show():
    if request.method == 'GET':
        option = request.args.get("option", None, type=None)
        commandAccess = vtoolsCommandAccess.getVTCommandAccess()
        return commandAccess.vtools_show(option)
    



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
