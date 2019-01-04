import os
import uuid
from subprocess import PIPE,run,Popen
import sys
from multiprocessing import Process

from flask import Flask, send_file,request,redirect
from werkzeug.utils import secure_filename
app = Flask(__name__)

WORK_FOLDER=os.getenv("WORK_FOLDER")

ALLOWED_EXTENSIONS = set(['txt', 'vcf'])
app.config['WORK_FOLDER'] = WORK_FOLDER


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/project',methods=['POST'])
def create_project():
    if request.method=='POST':
        projectID=uuid.uuid4().hex
        
        projectID="VT"+projectID
        directory=app.config["WORK_FOLDER"]+"testProject/"+projectID
        if not os.path.exists(directory):
            os.makedirs(directory)
        os.chdir(directory)
        command="vtools init "+projectID+" -f"
        result=run(command.split(" "),stdout=PIPE, stderr=PIPE, universal_newlines=True)
        if "ERROR" in result.stderr:
            return "Internal error", 500
        else:
            return projectID ,200

@app.route('/project/<projectID>',methods=['GET'])
def get_project(projectID):
    if request.method=="GET":
        directory=app.config["WORK_FOLDER"]+"testProject/"+projectID
        print(directory)
        if not os.path.exists(directory):
            return "project doesn't exist",200
        else:
            os.chdir(directory)
            return projectID,200




@app.route('/data/<projectID>', methods = ['POST'])
def upload_file(projectID):
   if request.method == 'POST':
      f = request.files['datafile']
      f.save(os.path.join(app.config['WORK_FOLDER']+"testProject/"+projectID,secure_filename(f.filename)))
      return 'uploaded',204

@app.route('/import/<projectID>', methods = ['GET'])
def vtools_import(projectID):
    fileName=request.args.get('fileName',None,type=None)
    genomeVersion=request.args.get("genomeVersion",None,type=None)
    import_process=Process(target=run_vtools_import,args=(projectID,fileName,genomeVersion))
    import_process.start()
    return "import running",200


def run_vtools_import(projectID,fileName,genomeVersion):
    command="vtools import "+app.config['WORK_FOLDER']+"testProject/"+projectID+"/"+fileName+" --build "+ genomeVersion+" -f"
    # print(command)
    # result=run(command.split(" "), stdout=PIPE, stderr=PIPE, universal_newlines=True)

    # result=Popen(command.split(" "), stdout=PIPE, stderr=PIPE, universal_newlines=True)
    # tee = Popen(['tee', app.config['WORK_FOLDER']+"testProject/"+projectID+"/output.txt"], stdin=result.stderr)
    # tee.communicate()
    
    with open (app.config['WORK_FOLDER']+"testProject/"+projectID+"/output.txt","a+") as output:
        Popen(command.split(" "),stdout=output, stderr=output, universal_newlines=True)



@app.route('/check/import/<projectID>',methods=['GET'])
def checkImportProgress(projectID):
    last=""
    logfile=app.config['WORK_FOLDER']+"testProject/"+projectID+"/output.txt"

    if os.path.exists(logfile) and os.path.getsize(logfile) > 5:
        with open(logfile, "rb") as f:
            f.seek(-2, os.SEEK_END)     # Jump to the second last byte.
            
            while f.read(1) != b"\r":   # Until EOL is found...
                try:
                    f.seek(-2, os.SEEK_CUR) # ...jump back the read byte plus one more.
                except OSError:
                    f.seek(0, 0)
                    break
            last = f.readline()
        return last,200
    else:
        return "preparing",200



@app.route('/phenotype/<projectID>',methods=['POST','PUT'])
def upload_phenotype(projectID):
    if request.method == 'POST':
      f = request.files['phenofile']
      print(os.path.join(app.config['WORK_FOLDER']+"testProject/"+projectID,secure_filename(f.filename)))
      f.save(os.path.join(app.config['WORK_FOLDER']+"testProject/"+projectID,secure_filename(f.filename)))
      return 'upload',204
    elif request.method=='PUT':
     
      fileName=request.get_data().decode("utf-8")
      print(app.config['WORK_FOLDER']+"testProject/"+projectID+"/"+fileName)
      command="vtools phenotype --from_file "+app.config['WORK_FOLDER']+"testProject/"+projectID+"/"+fileName
      result = run(command.split(" "), stdout=PIPE, stderr=PIPE, universal_newlines=True)
      
      if "ERROR" in result.stderr:
        return "Internal error", 500
      else:
        return  result.stdout,200



@app.route('/output', methods = ['GET'])
def vtools_output():
    command="vtools output variant chr pos ref alt --limit 20 --header"
    result = run(command.split(" "), stdout=PIPE, stderr=PIPE, universal_newlines=True)
    if "ERROR" in result.stderr:
        return "Internal error", 500
    else:
        return  result.stdout,200

@app.route("/use",methods=['POST'])
def vtools_use():
    option=request.form["option"]
    command="vtools use "+option
    result = run(command.split(" "), stdout=PIPE, stderr=PIPE, universal_newlines=True)
    print("stdout", result.stdout)
    print("stderr", result.stderr)
    return result.stderr


@app.route("/runAssociation/<projectID>",methods=['POST'])
def vtools_associate(projectID):
    table=request.form["table"]
    phenotype=request.form["phenotype"]
    method=request.form["method"]
    discard=request.form["discard"]
    groupby=request.form["groupby"]
    print(table,phenotype,method,discard,groupby)

    associate_process=Process(target=run_vtools_associate,args=(projectID,table,phenotype,method,groupby))
    associate_process.start()
    return "associate running",200
    # command="vtools associate "+table+" "+phenotype+" --method "+method+" --group_by "+groupby+" --to_db test.DB -f -j 8 -v 2" 
    # print(command)
    # result = run(command.split(" "), stdout=PIPE, stderr=PIPE, universal_newlines=True)




def run_vtools_associate(projectID,table,phenotype,method,groupby):
    command="vtools associate "+table+" "+phenotype+" --method "+method+" --group_by "+groupby+" --to_db test.DB -f -j 8 -v 1" 
    logfile=app.config['WORK_FOLDER']+"testProject/"+projectID+"/associate_output.txt"
    if os.path.exists(logfile):
        os.remove(logfile)

    print(command)
    # result = run(command.split(" "), stdout=PIPE, stderr=PIPE, universal_newlines=True)
    # print("stderr",result.stderr)
    # print("stdout",result.stdout)
    
    # with open (app.config['WORK_FOLDER']+"testProject/"+projectID+"/associate_output.txt","a+") as output:
    #     Popen(command.split(" "), stderr=output, universal_newlines=True)

    result=Popen(command.split(" "),  stderr=PIPE, universal_newlines=True)
    tee = Popen(['tee', app.config['WORK_FOLDER']+"testProject/"+projectID+"/associate_output.txt"], stdin=result.stderr)
    tee.communicate()


@app.route('/check/associate/<projectID>',methods=['GET'])
def checkAssociateProgress(projectID):
    last=""
    logfile=app.config['WORK_FOLDER']+"testProject/"+projectID+"/associate_output.txt"

    if os.path.exists(logfile) and os.path.getsize(logfile) > 5:
        with open(logfile, "rb") as f:
            f.seek(-2, os.SEEK_END)     # Jump to the second last byte.
            
            while f.read(1) != b"\r":   # Until EOL is found...
                try:
                    f.seek(-2, os.SEEK_CUR) # ...jump back the read byte plus one more.
                except OSError:
                    f.seek(0, 0)
                    break
            last = f.readline()
        return last,200
    else:
        return "preparing",200



@app.route("/show",methods=['GET'])
def vtools_show():
    option=request.args.get("option",None,type=None)
    command="vtools show "+option
    if option=="show":
        command="vtools show"
    elif option=="anotations -v0":
        command="vtools show annotations -v0 "
    result = run(command.split(" "), stdout=PIPE, stderr=PIPE, universal_newlines=True)
    # print(result.returncode)
    # print("stdout", result.stdout)
    # print("stderr", result.stderr)
    if "ERROR" in result.stderr:
        return "Internal error", 500
    else:
        return  result.stdout,200



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
