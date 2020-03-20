import os
from subprocess import PIPE, run, Popen, STDOUT
from multiprocessing import Process
from shutil import copy2


WORK_FOLDER = os.getenv("WORK_FOLDER")+"/app/"
PROJECT_FOLDER = os.getenv("PROJECT_FOLDER")
if not os.path.exists(PROJECT_FOLDER):
    os.makedirs(PROJECT_FOLDER)


def load_sampleData(projectID, fileType):
    print(WORK_FOLDER+"/testData/10k_test_2k.vcf")
    projectFolder = PROJECT_FOLDER+projectID
    os.chdir(projectFolder)
    if fileType == "data" and os.path.exists(WORK_FOLDER+"/testData/10k_test_2k.vcf"):
        src = os.path.realpath(WORK_FOLDER+"/testData/10k_test_2k.vcf")
        print("copy ", src)
        copy2(src, projectFolder+"/")
        return "copy file", 200
    elif fileType == "pheno" and os.path.exists(WORK_FOLDER+"/testData/simulated.tsv"):
        src = os.path.realpath(WORK_FOLDER+"/testData/simulated.tsv")
        copy2(src, projectFolder+"/")
        command = "vtools phenotype --from_file " + \
            projectFolder+"/simulated.tsv"
        return runCommand(command)


def vtools_create(projectID):
    projectFolder = PROJECT_FOLDER+projectID
    if not os.path.exists(projectFolder):
        os.makedirs(projectFolder)
    os.chdir(projectFolder)
    command = "vtools init "+projectID+" -f"
    result = run(command.split(" "), stdout=PIPE,
                 stderr=PIPE, universal_newlines=True)
    if "ERROR" in result.stderr or "error" in result.stderr:
        return result.stderr, 500
    else:
        return projectID, 200


def vtools_import(projectID, fileName, genomeVersion):
    def run_vtools_import(projectFolder, fileName, genomeVersion):
        print(projectFolder, fileName, genomeVersion)
        command = "vtools import "+projectFolder + "/"+fileName+" --build " + genomeVersion+" -f"
        with open(projectFolder+"/import_log.txt", "a+") as output:
            Popen(command.split(" "), stdout=output, stderr=output, universal_newlines=True)
    projectFolder = PROJECT_FOLDER+projectID
    os.chdir(projectFolder)
    import_process = Process(target=run_vtools_import, args=(projectFolder, fileName, genomeVersion))
    import_process.start()


def vtools_phenotype(projectID, phenotype_fileName):
    projectFolder = PROJECT_FOLDER+projectID
    os.chdir(projectFolder)
    command = "vtools phenotype --from_file " + phenotype_fileName
    return runCommand(command)


def vtools_output(projectID, outputTable, outputTableFields, outputAnnoFields):
    projectFolder = PROJECT_FOLDER+projectID
    os.chdir(projectFolder)
    command = "vtools output "+outputTable+" "
    if len(outputTableFields) > 0:
        command += outputTableFields
    if len(outputAnnoFields) > 0:
        command += " "+outputAnnoFields
    command += " --limit 20 --header"
    return runCommand(command)


def vtools_use(projectID, option):
    projectFolder = PROJECT_FOLDER+projectID
    os.chdir(projectFolder)
    command = "vtools use "+option
    return runCommand(command)


def vtools_select(projectID, condition, newTable):
    projectFolder = PROJECT_FOLDER+projectID
    os.chdir(projectFolder)
    command = "vtools select "+condition+" -t "+newTable
    return runCommand(command)


def vtools_update(projectID, request, method, table):
    projectFolder = PROJECT_FOLDER+projectID
    os.chdir(projectFolder)
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
    return runCommand(command)


def vtools_association(projectID, table, phenotype, method, groupby):

    def run_vtools_associate(projectFolder, table, phenotype, method, groupby):
        dbName = "association_"+table+"_"+phenotype+"_"+method+".db"
        command = "vtools associate "+table+" "+phenotype+" --method " + \
            method+" --group_by "+groupby+" --to_db "+dbName+" -f -j 8 -v 1"
        logfile = projectFolder + "/associate_log.txt"
        resultfile = projectFolder + "/associate_result.txt"
        if os.path.exists(logfile):
            os.remove(logfile)
        if os.path.exists(resultfile):
            os.remove(resultfile)
        print(command)
        result = Popen(command.split(" "), stdout=PIPE, stderr=PIPE, universal_newlines=True)
        tee = Popen(['tee', logfile], stdin=result.stderr)
        tee.communicate()
        tee2 = Popen(['tee', resultfile], stdin=result.stdout)
        tee2.communicate()

    projectFolder = PROJECT_FOLDER+projectID
    os.chdir(projectFolder)

    associate_process = Process(target=run_vtools_associate, args=(
        projectFolder, table, phenotype, method, groupby))
    associate_process.start()


def vtools_show(projectID, option):
    projectFolder = PROJECT_FOLDER+projectID
    os.chdir(projectFolder)
    command = "vtools show "+option
    if option == "show":
        command = "vtools show"
    elif option == "anotations -v0":
        command = "vtools show annotations -v0 "
    elif option == "genotypes":
        command = "vtools show genotypes -l 20"
    elif option == "tables":
        command = "vtools show tables"
    elif option == "fields":
        command = "vtools show fields -l 20"
    elif option == "phenotypes":
        command = "vtools show phenotypes"
    return runCommand(command)
    # return run(command.split(" "), stdout=PIPE, stderr=PIPE, universal_newlines=True)


def runCommand(command):
    commandCols = []
    for col in command.split():
        commandCols.append(col)
    print(commandCols)
    result = run(commandCols, stdout=PIPE, stderr=PIPE, universal_newlines=True)
    print("stderr "+result.stderr)
    print("stdout "+result.stdout)
    if "ERROR" in result.stderr or "error" in result.stderr:
        return result.stderr, 500
    else:
        if result.stdout == "":
            return result.stderr, 200
        else:
            return result.stdout, 200



