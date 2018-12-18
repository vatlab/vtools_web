import os
from subprocess import PIPE,run

from flask import Flask, send_file,request,redirect
from werkzeug.utils import secure_filename
app = Flask(__name__)

WORK_FOLDER=os.getenv("WORK_FOLDER")

ALLOWED_EXTENSIONS = set(['txt', 'vcf'])
app.config['WORK_FOLDER'] = WORK_FOLDER


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/data', methods = ['POST'])
def upload_file():
   if request.method == 'POST':
      f = request.files['datafile']
      f.save(os.path.join(app.config['WORK_FOLDER']+"testData",secure_filename(f.filename)))
      return ('',204)

@app.route('/import', methods = ['GET'])
def vtools_import():
    fileName=request.args.get('fileName',None,type=None)
    genomeVersion=request.args.get("genomeVersion",None,type=None)
    print(fileName,genomeVersion)
    os.chdir(app.config["WORK_FOLDER"]+"testProject")
    run("vtools init test -f".split(" "))
    command="vtools import "+app.config['WORK_FOLDER']+"testData/"+fileName+" --build "+ genomeVersion+" -f"
    print(command)
    run(command.split(" "), stdout=PIPE, stderr=PIPE, universal_newlines=True)
    return "import sucess"

@app.route('/phenotype',methods=['POST','PUT'])
def upload_phenotype():
    if request.method == 'POST':
      f = request.files['phenofile']
      f.save(os.path.join(app.config['WORK_FOLDER']+"testData",secure_filename(f.filename)))
      return ('',204)
    elif request.method=='PUT':
     
      fileName=request.get_data().decode("utf-8")
      command="vtools phenotype --from_file "+app.config['WORK_FOLDER']+"testData/"+fileName
      result = run(command.split(" "), stdout=PIPE, stderr=PIPE, universal_newlines=True)
      print("stdout", result.stdout)
      print("stderr", result.stderr)
      return result.stdout


   


@app.route('/output', methods = ['GET'])
def vtools_output():
    command="vtools output variant chr pos ref alt --limit 20 --header"
    result = run(command.split(" "), stdout=PIPE, stderr=PIPE, universal_newlines=True)
    print(result.returncode)
    print("stdout", result.stdout)
    print("stderr", result.stderr)
    return result.stdout

@app.route("/use",methods=['POST'])
def vtools_use():
    option=request.form["option"]
    command="vtools use "+option
    result = run(command.split(" "), stdout=PIPE, stderr=PIPE, universal_newlines=True)
    print("stdout", result.stdout)
    print("stderr", result.stderr)
    return result.stderr


@app.route("/runAssociation",methods=['POST'])
def vtools_associate():
    table=request.form["table"]
    phenotype=request.form["phenotype"]
    method=request.form["method"]
    discard=request.form["discard"]
    groupby=request.form["groupby"]
    print(table,phenotype,method,discard,groupby)
    command="vtools associate "+table+" "+phenotype+" --method "+method+" --group_by "+groupby+" --to_db test.DB -f -j 8 -v 2" 
    print(command)
    result = run(command.split(" "), stdout=PIPE, stderr=PIPE, universal_newlines=True)
    print("stdout", result.stdout)
    print("stderr", result.stderr)
    return result.stdout



@app.route("/show",methods=['GET'])
def vtools_show():
    option=request.args.get("option",None,type=None)
    command="vtools show "+option
    if option=="show":
        command="vtools show"
    elif option=="anotations -v0":
        command="vtools show annotations -v0 "
    result = run(command.split(" "), stdout=PIPE, stderr=PIPE, universal_newlines=True)
    print(result.returncode)
    print("stdout", result.stdout)
    print("stderr", result.stderr)
    return result.stdout



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
